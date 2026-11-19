import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildReviewUserMessage,
  fallbackReview,
  normalizeQuestions,
  parseReviewResponse,
} from '../src/review.js'

test('parses fenced review JSON and keeps exact evidence', () => {
  const source = '这个尽快弄一下，然后发给他们。'
  const raw = '```json\n' + JSON.stringify({
    summary: '对方还需要确认两件事。',
    questions: [
      {
        layer: 'information',
        severity: 'high',
        confidence: 0.91,
        quote: '这个',
        question: '这里的“这个”具体指哪份材料或哪件事？',
        why: '对象不明确。',
      },
      {
        layer: 'information',
        severity: 'medium',
        confidence: 0.86,
        quote: '尽快',
        question: '“尽快”具体是哪个时间点前？',
        why: '时间不明确。',
      },
      {
        layer: 'language',
        severity: 'low',
        confidence: 0.7,
        quote: '然后',
        question: '这是第三个问题吗？',
        why: '应被最多两个问题截掉。',
      },
    ],
  }) + '\n```'

  const result = parseReviewResponse(raw, source)
  assert.equal(result.questions.length, 2)
  assert.equal(result.questions[0].quote, '这个')
  assert.equal(result.questions[1].quote, '尽快')
  assert.equal(result.summary, '对方还需要确认两件事。')
})

test('drops questions whose quote is not in the source', () => {
  const source = '请把方案发给我。'
  const result = normalizeQuestions([
    {
      layer: 'information',
      severity: 'high',
      confidence: 0.9,
      quote: '不存在的原文',
      question: '这句话真的存在吗？',
    },
    {
      layer: 'information',
      severity: 'medium',
      confidence: 0.8,
      quote: '方案',
      question: '这是哪一版方案？',
    },
  ], source)

  assert.equal(result.length, 1)
  assert.equal(result[0].quote, '方案')
})

test('fallback finds a vague time in a task request', () => {
  const result = fallbackReview('麻烦尽快把这个处理一下。')
  assert.ok(result.questions.length >= 1)
  assert.equal(result.questions[0].layer, 'information')
  assert.ok(result.questions.some(question => question.quote === '尽快'))
})

test('fallback detects a direct contradiction pair', () => {
  const result = fallbackReview('这个不用审批，但是必须让负责人确认后再发。')
  assert.ok(result.questions.some(question => question.layer === 'logic'))
})

test('fallback stays silent for a clear short message', () => {
  const result = fallbackReview('请张三明天下午三点前把最终版方案发给我。')
  assert.equal(result.questions.length, 0)
  assert.match(result.summary, /没有发现/)
})

test('question prompt wraps the draft and never asks for a rewrite', () => {
  const message = buildReviewUserMessage('把这个弄一下。')
  assert.match(message, /<draft>/)
  assert.match(message, /不要改写原文/)
  assert.match(message, /把这个弄一下/)
})

