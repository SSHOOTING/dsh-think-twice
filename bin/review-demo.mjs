#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fallbackReview } from '../src/review.js'

const fromArgs = process.argv.slice(2).join(' ').trim()
const fromStdin = process.stdin.isTTY ? '' : readFileSync(0, 'utf8').trim()
const text = fromArgs || fromStdin

if (!text) {
  console.error('用法：npm run demo -- "你的草稿"')
  process.exitCode = 1
} else {
  const result = fallbackReview(text)
  console.log(`\n${result.summary}\n`)
  if (result.questions.length === 0) {
    console.log('（没有发现高置信度问题）')
  } else {
    for (const question of result.questions) {
      console.log(`[${question.layer}] ${question.question}`)
      console.log(`  原文：${question.quote}`)
      if (question.why) console.log(`  原因：${question.why}`)
      console.log('')
    }
  }
}

