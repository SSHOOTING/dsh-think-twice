const FENCE_RE = /```(?:json)?\s*([\s\S]*?)```/gi
const MAX_QUESTIONS = 2
const MIN_CONFIDENCE = 0.45

const LAYERS = new Set(['language', 'logic', 'information'])
const SEVERITIES = new Set(['high', 'medium', 'low'])
const SEVERITY_RANK = { high: 3, medium: 2, low: 1 }

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function findBalancedJson(text) {
  const start = text.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, index + 1)
    }
  }
  return null
}

function candidateJson(raw) {
  const trimmed = String(raw || '').trim()
  const candidates = [trimmed]
  for (const match of trimmed.matchAll(FENCE_RE)) candidates.unshift(match[1].trim())
  const balanced = findBalancedJson(trimmed)
  if (balanced) candidates.push(balanced)
  return [...new Set(candidates.filter(Boolean))]
}

function parseJson(raw) {
  for (const candidate of candidateJson(raw)) {
    try {
      return JSON.parse(candidate)
    } catch {
      // Try the next plausible extraction shape.
    }
  }
  return null
}

function clampConfidence(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0.6
  return Math.max(0, Math.min(1, number))
}

function cleanQuote(value) {
  return String(value || '').trim().replace(/^["“”'‘’]+|["“”'‘’]+$/g, '').trim()
}

function questionKey(question) {
  return `${question.layer}\u0000${question.quote}\u0000${question.question}`
}

export function normalizeQuestions(values, source, maxQuestions = MAX_QUESTIONS) {
  const original = normalizeWhitespace(source)
  const output = []
  const seen = new Set()

  for (const value of Array.isArray(values) ? values : []) {
    if (value === null || typeof value !== 'object') continue
    const layer = String(value.layer || '').trim().toLowerCase()
    const severity = String(value.severity || 'medium').trim().toLowerCase()
    const quote = cleanQuote(value.quote)
    const question = normalizeWhitespace(value.question)
    const why = normalizeWhitespace(value.why)
    const confidence = clampConfidence(value.confidence)

    if (!LAYERS.has(layer)) continue
    if (!SEVERITIES.has(severity)) continue
    if (!quote || !original.includes(quote)) continue
    if (question.length < 6 || question.length > 240) continue
    if (confidence < MIN_CONFIDENCE) continue

    const normalized = {
      id: String(value.id || '').trim() || `q-${output.length + 1}`,
      layer,
      severity,
      confidence: Math.round(confidence * 100) / 100,
      quote: quote.slice(0, 80),
      question,
      why: why.slice(0, 240),
    }
    const key = questionKey(normalized)
    if (seen.has(key)) continue
    seen.add(key)
    output.push(normalized)
  }

  return output
    .sort((left, right) => (
      (SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity])
      || (right.confidence - left.confidence)
    ))
    .slice(0, maxQuestions)
    .map((question, index) => ({ ...question, id: question.id || `q-${index + 1}` }))
}

export function parseReviewResponse(raw, source, maxQuestions = MAX_QUESTIONS) {
  const parsed = parseJson(raw)
  if (!parsed || typeof parsed !== 'object') {
    const error = new Error('模型没有返回可解析的审查 JSON')
    error.code = 'INVALID_OUTPUT'
    throw error
  }

  const questions = normalizeQuestions(parsed.questions, source, maxQuestions)
  const summary = normalizeWhitespace(parsed.summary)
  return {
    summary: summary || (questions.length === 0
      ? '这次没有发现会阻碍对方行动的问题。'
      : `对方可能还会确认 ${questions.length} 件事。`),
    questions,
    parseMode: 'json',
  }
}

function addFallbackQuestion(list, question) {
  if (list.length >= MAX_QUESTIONS) return
  if (list.some(item => item.layer === question.layer && item.quote === question.quote)) return
  list.push({
    id: `fallback-${list.length + 1}`,
    confidence: 0.65,
    why: '',
    ...question,
  })
}

function findConflictQuote(text) {
  const patterns = [
    /(?:不用|不需要|不必)[^。！？\n]{0,36}(?:但是|但|又|同时)[^。！？\n]{0,36}(?:必须|需要|要)/u,
    /(?:必须|一定要|只能)[^。！？\n]{0,36}(?:但是|但|又|同时|却)[^。！？\n]{0,36}(?:不用|不需要|不必|不能)/u,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[0].trim().slice(0, 80)
  }
  return ''
}

function hasExplicitTime(text) {
  return /(?:今天|明天|后天|今天内|本周|这周|下周|周[一二三四五六日天]|月底|下个月|\d{1,2}月\d{1,2}日|\d{1,2}号|上午|下午|晚上|\d{1,2}[:：]\d{2})/u.test(text)
}

function repeatedFiller(text) {
  const fillers = ['就是说', '然后', '那个', '就是', '嗯', '呃', '其实', '怎么说', '差不多']
  for (const filler of fillers) {
    const count = (text.match(new RegExp(filler, 'gu')) || []).length
    if (count >= 4) return { filler, count }
  }
  return null
}

export function fallbackReview(source, maxQuestions = MAX_QUESTIONS) {
  const text = normalizeWhitespace(source)
  const questions = []
  const generalQuestion = /[？?]/u.test(text)
    && /(?:比较|分析|解释|说说|怎么|为什么|如何|评价|判断|看法|区别)/u.test(text)
  const directRequest = /(?:^|[。！？\n])\s*(?:请|麻烦|帮忙|需要|要|能不能|可不可以|把|给我)/u.test(text)
    || /(?:请|麻烦|帮忙)/u.test(text)

  const conflict = findConflictQuote(text)
  if (conflict) {
    addFallbackQuestion(questions, {
      layer: 'logic',
      severity: 'high',
      quote: conflict,
      question: '这两处要求看起来可能互相冲突。它们需要同时满足吗？最终以哪一条为准？',
      why: '同一段里出现不兼容的要求时，对方无法判断该按哪一条行动。',
      confidence: 0.82,
    })
  }

  const bareReference = !generalQuestion && text.match(/(?:这个|那个|这件事|那件事|这些|那些|他们|她们|对方|那边)(?=[，。；！？\s]|尽|要|需要|可以|先|再|就|都|也|还|不|别|把|给|发|看|处理|安排)/u)
  if (bareReference) {
    addFallbackQuestion(questions, {
      layer: 'information',
      severity: 'high',
      quote: bareReference[0],
      question: `这里的“${bareReference[0]}”具体指哪个人、哪份材料或哪一步？`,
      why: '指代对象没有在原文中明确落点，对方可能需要先反问才能行动。',
      confidence: 0.78,
    })
  }

  const vagueTime = text.match(/(?:尽快|晚点|回头|到时候|过几天|之后|有空|抽空|看情况)/u)
  if (directRequest && vagueTime && /(?:提交|确认|处理|安排|回复|完成|发|上线|弄|搞)/u.test(text)) {
    addFallbackQuestion(questions, {
      layer: 'information',
      severity: 'medium',
      quote: vagueTime[0],
      question: `这里的“${vagueTime[0]}”具体是哪个时间点前？`,
      why: '模糊时间会让对方无法安排优先级，也可能错过真正需要的时点。',
      confidence: 0.76,
    })
  }

  if (questions.length < maxQuestions
    && directRequest
    && /(?:发|提交|确认|处理|安排|回复|完成|上线|弄|搞)/u.test(text)
    && !hasExplicitTime(text)) {
    const quote = text.slice(0, Math.min(48, text.length))
    addFallbackQuestion(questions, {
      layer: 'information',
      severity: 'medium',
      quote,
      question: '这件事希望对方在什么时候前完成？',
      why: '任务动作已经出现，但没有截止时间，对方可能不知道应该多快处理。',
      confidence: 0.68,
    })
  }

  const repetition = repeatedFiller(text)
  if (questions.length < maxQuestions && repetition && !generalQuestion) {
    addFallbackQuestion(questions, {
      layer: 'language',
      severity: 'low',
      quote: repetition.filler,
      question: `“${repetition.filler}”出现了 ${repetition.count} 次。哪一次承载关键意思，其余是否可以合并？`,
      why: '重复填充词会遮住真正的重点，但这类问题通常不改变行动。',
      confidence: 0.62,
    })
  }

  const limited = normalizeQuestions(questions, text, maxQuestions)
  return {
    summary: limited.length === 0
      ? '这次没有发现会阻碍对方行动的问题。'
      : `对方可能还会确认 ${limited.length} 件事。`,
    questions: limited,
    parseMode: 'fallback',
  }
}

export function buildReviewUserMessage(text, repair = false) {
  const lines = [
    '请审查下面这段准备发送的文字。',
    '只返回约定的 JSON。不要改写原文，不要给修改后的句子。',
  ]
  if (repair) {
    lines.push(
      '上一次输出不是合法 JSON，或引用的 quote 没有逐字出现在原文中。',
      '请重新输出完整 JSON；每个 quote 必须从原文逐字复制，最多两个问题。',
    )
  }
  lines.push('', '<draft>', normalizeWhitespace(text), '</draft>')
  return lines.join('\n')
}

export {
  MAX_QUESTIONS,
  MIN_CONFIDENCE,
  normalizeWhitespace,
}

