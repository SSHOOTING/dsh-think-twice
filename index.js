import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
import {
  buildReviewUserMessage,
  fallbackReview,
  parseReviewResponse,
} from './src/review.js'

export const name = 'dsh-think-twice'
export const inject = ['llm', 'agentDefaultModel']

const DEFAULT_PROMPT = readFileSync(
  new URL('./prompts/review-system.md', import.meta.url),
  'utf8',
).trim()

const remoteMethods = []

function exposeRemote(klass, method, exportName) {
  const initializers = []
  Remote(exportName || method)(klass.prototype[method], {
    private: false,
    static: false,
    name: method,
    addInitializer(fn) {
      initializers.push(fn)
    },
  })
  const marker = Object.create(klass.prototype)
  for (const init of initializers) init.call(marker)
  remoteMethods.push(exportName || method)
}

function normalizedError(error) {
  return String(error && error.message ? error.message : error)
}

class ReviewModelError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'ReviewModelError'
    this.code = code || 'MODEL'
  }
}

function retryable(error) {
  return [
    'EMPTY_RESPONSE',
    'INVALID_OUTPUT',
    'RATE_LIMIT',
    'SERVER',
    'TIMEOUT',
    'TRANSPORT',
    'TRUNCATED',
  ].includes(error.code)
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function historyPathFor(config) {
  if (config.historyPath) return String(config.historyPath)
  const home = process.env.DSH_HOME || process.cwd()
  return join(home, 'dsh-think-twice', 'history.jsonl')
}

function pickFallbackRoute(llm, selection) {
  const providers = llm.listProviders()
  if (providers.length === 0) throw new Error('DSH 当前没有可用的模型服务')
  const selected = providers.find((provider) => provider.id === selection.provider)
  const provider = selected || providers[0]
  return {
    provider: provider.id,
    model: selected ? (selection.model || '') : '',
    selected: selected !== undefined,
  }
}

async function resolveRoute(ctx, config) {
  const configuredProvider = String(config.provider || '').trim()
  const configuredModel = String(config.model || '').trim()
  const current = ctx.agentDefaultModel.currentSelection()
  const selection = {
    provider: configuredProvider || current.provider,
    model: configuredModel || current.model,
  }

  const route = pickFallbackRoute(ctx.llm, selection)
  const models = await ctx.llm.listModels(route.provider)
  if (models.length === 0) {
    throw new Error(`模型服务 ${route.provider} 没有可用模型`)
  }
  if (!route.model || !models.some((model) => model.id === route.model)) {
    route.model = models[0].id
  }
  return route
}

async function resolveReasoningEffort(ctx, route, config) {
  const requested = String(config.reasoningEffort || 'low').trim().toLowerCase()
  if (!requested || requested === 'default') return undefined
  try {
    const info = await ctx.llm.resolveModelInfo(route.provider, route.model)
    const efforts = info && info.reasoning && Array.isArray(info.reasoning.efforts)
      ? info.reasoning.efforts
      : []
    if (efforts.some((effort) => String(effort.id) === requested)) {
      return efforts.find((effort) => String(effort.id) === requested).id
    }
    for (const level of ['minimal', 'low', 'off', 'medium', 'high', 'xhigh', 'max']) {
      const match = efforts.find((effort) => String(effort.id) === level)
      if (match) return match.id
    }
  } catch {
    // Model metadata is advisory. Preserve the provider default when absent.
  }
  return undefined
}

function addQuestionIds(reviewId, questions) {
  return (Array.isArray(questions) ? questions : []).map((question, index) => ({
    ...question,
    id: `${reviewId}-q${index + 1}`,
  }))
}

class DshThinkTwiceRemote extends TypertRemoteService {
  constructor(ctx, config) {
    super(ctx, 'dshThinkTwice', { namespace: 'dshThinkTwice' })
    this.config = config || {}
    this.historyPath = historyPathFor(this.config)
  }

  appendHistory(record) {
    try {
      mkdirSync(dirname(this.historyPath), { recursive: true })
      appendFileSync(this.historyPath, `${JSON.stringify({
        time: new Date().toISOString(),
        ...record,
      })}\n`, 'utf8')
    } catch {
      // History is useful, but a write failure must not hide the review.
    }
  }

  async reviewWithModel(text, sessionId) {
    const startedAt = Date.now()
    const timeoutMs = Math.max(5000, Number(this.config.timeoutMs) || 45000)
    const configuredRetries = Number(this.config.maxRetries)
    const configuredDelay = Number(this.config.retryDelayMs)
    const maxRetries = Math.max(0, Math.min(3, Number.isFinite(configuredRetries) ? configuredRetries : 1))
    const retryDelayMs = Math.max(100, Number.isFinite(configuredDelay) ? configuredDelay : 500)
    const route = await resolveRoute(this.ctx, this.config)
    const reasoningEffort = await resolveReasoningEffort(this.ctx, route, this.config)
    const system = String(this.config.prompt || '').trim() || DEFAULT_PROMPT
    let attempts = 0
    let lastError = null

    while (attempts <= maxRetries) {
      attempts += 1
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      let raw = ''

      try {
        const user = buildReviewUserMessage(text, attempts > 1)
        const stream = this.ctx.llm.stream({
          provider: route.provider,
          model: route.model,
          ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
          system,
          messages: [{
            role: 'user',
            content: [{ type: 'text', text: user }],
          }],
          temperature: 0.1,
          maxTokens: 4096,
          signal: controller.signal,
        })

        for await (const chunk of stream) {
          if (!chunk) continue
          if (chunk.type === 'text-delta') {
            raw += chunk.text
            continue
          }
          if (chunk.type === 'finish') {
            const reason = chunk.reason || {}
            if (reason.kind === 'error') {
              const failure = reason.failure || {}
              throw new ReviewModelError(
                failure.message || '模型调用失败',
                failure.code || 'MODEL',
              )
            }
            if (reason.kind === 'aborted') {
              throw new ReviewModelError(
                controller.signal.aborted ? '审查请求超时' : '审查请求已取消',
                controller.signal.aborted ? 'TIMEOUT' : 'ABORTED',
              )
            }
            if (reason.kind === 'max-tokens') {
              throw new ReviewModelError('模型输出被截断', 'TRUNCATED')
            }
          }
        }

        if (!raw.trim()) throw new ReviewModelError('模型没有返回文本', 'EMPTY_RESPONSE')
        const parsed = parseReviewResponse(raw, text)
        return {
          ...parsed,
          route: `${route.provider}/${route.model}`,
          reasoningEffort: reasoningEffort === undefined ? null : String(reasoningEffort),
          attempts,
          elapsedMs: Date.now() - startedAt,
        }
      } catch (error) {
        lastError = error instanceof ReviewModelError
          ? error
          : new ReviewModelError(
            normalizedError(error),
            error && error.code ? error.code : 'MODEL',
          )
        if (attempts > maxRetries || !retryable(lastError)) throw lastError
        await wait(retryDelayMs * (2 ** (attempts - 1)))
      } finally {
        clearTimeout(timeout)
      }
    }

    throw lastError || new ReviewModelError('模型没有返回可用审查', 'MODEL')
  }

  async review(request) {
    const text = String(request && request.text ? request.text : '').trim()
    if (!text) {
      return { ok: false, error: '输入框还是空的，请先写下要检查的内容。' }
    }

    const startedAt = Date.now()
    const sessionId = request && request.sessionId ? String(request.sessionId) : ''
    const reviewId = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
    let parsed = null
    let modelError = ''
    let route = ''
    let attempts = 0
    let elapsedMs = 0

    try {
      parsed = await this.reviewWithModel(text, sessionId)
      route = parsed.route
      attempts = parsed.attempts
      elapsedMs = parsed.elapsedMs
    } catch (error) {
      modelError = normalizedError(error)
      parsed = fallbackReview(text)
      elapsedMs = Date.now() - startedAt
    }

    const questions = addQuestionIds(reviewId, parsed.questions)
    const result = {
      ok: true,
      reviewId,
      summary: parsed.summary,
      questions,
      parseMode: parsed.parseMode,
      degraded: Boolean(modelError),
      modelError,
      route,
      attempts,
      elapsedMs,
      historyPath: this.historyPath,
    }

    this.appendHistory({
      type: 'review',
      reviewId,
      sessionId,
      text,
      summary: result.summary,
      questions: result.questions,
      parseMode: result.parseMode,
      degraded: result.degraded,
      modelError: result.modelError,
      route: result.route,
      attempts: result.attempts,
      elapsedMs: result.elapsedMs,
    })
    return result
  }

  async feedback(request) {
    const reviewId = String(request && request.reviewId ? request.reviewId : '').trim()
    const questionId = String(request && request.questionId ? request.questionId : '').trim()
    const action = String(request && request.action ? request.action : '').trim()
    if (!reviewId || !questionId) {
      return { ok: false, error: '缺少 reviewId 或 questionId。' }
    }
    if (!['helpful', 'inaccurate', 'edited'].includes(action)) {
      return { ok: false, error: '反馈类型必须是 helpful、inaccurate 或 edited。' }
    }
    this.appendHistory({
      type: 'feedback',
      reviewId,
      questionId,
      action,
    })
    return { ok: true, historyPath: this.historyPath }
  }
}

exposeRemote(DshThinkTwiceRemote, 'review')
exposeRemote(DshThinkTwiceRemote, 'feedback')

export function apply(ctx, config = {}) {
  new DshThinkTwiceRemote(ctx, config)
  console.log('[dsh-think-twice] host ready')
}

