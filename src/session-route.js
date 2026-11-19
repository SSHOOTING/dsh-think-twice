import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import zlib from 'node:zlib'

const ZSTD_MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

function decodeZstdFrames(buffer) {
  if (typeof zlib.zstdDecompressSync !== 'function') return null
  const starts = []
  let cursor = 0
  while (cursor < buffer.length) {
    const next = buffer.indexOf(ZSTD_MAGIC, cursor)
    if (next < 0) break
    starts.push(next)
    cursor = next + ZSTD_MAGIC.length
  }
  if (starts.length === 0) return buffer.toString('utf8')

  const chunks = []
  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index]
    const end = index + 1 < starts.length ? starts[index + 1] : buffer.length
    try {
      chunks.push(zlib.zstdDecompressSync(buffer.subarray(start, end)))
    } catch {
      // A torn final frame must not hide the complete frames before it.
    }
  }
  return Buffer.concat(chunks).toString('utf8')
}

function findSessionDir(root, sessionId) {
  if (!sessionId || !root) return ''
  const target = `session-${sessionId}`
  const stack = [{ path: root, depth: 0 }]
  while (stack.length > 0) {
    const current = stack.pop()
    let entries
    try {
      entries = readdirSync(current.path, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const path = join(current.path, entry.name)
      if (entry.name === target) return path
      if (current.depth < 4) stack.push({ path, depth: current.depth + 1 })
    }
  }
  return ''
}

function latestSessionFile(sessionDir) {
  let files = []
  try {
    files = readdirSync(sessionDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^session\..+\.jsonl(?:\.zstd)?$/u.test(entry.name))
      .map((entry) => {
        const path = join(sessionDir, entry.name)
        try {
          return { path, mtimeMs: statSync(path).mtimeMs }
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .sort((left, right) => right.mtimeMs - left.mtimeMs)
  } catch {
    return ''
  }
  return files[0]?.path || ''
}

function routeFromRecord(record) {
  if (!record || typeof record !== 'object') return null
  if (record.type === 'request/context') {
    const provider = String(record.data?.provider || '').trim()
    const model = String(record.data?.model || '').trim()
    if (provider && model) return { provider, model, evidence: 'request/context' }
  }
  if (record.type === 'request/header') {
    const config = record.data?.header?.config
    const provider = String(config?.provider || '').trim()
    const model = String(config?.model || '').trim()
    if (provider && model) return { provider, model, evidence: 'request/header' }
  }
  if (record.type === 'assistant/message') {
    const source = record.data?.source
    const provider = String(source?.provider || '').trim()
    const model = String(source?.model || '').trim()
    if (provider && model) return { provider, model, evidence: 'assistant/message' }
  }
  return null
}

/**
 * Read the latest model route recorded by a DSH session.
 *
 * The global agent default can be stale while an existing session is actively
 * using another provider. The session log is the authoritative local record
 * for what that conversation actually requested.
 */
export function resolveSessionRoute({ sessionId, dshHome = process.env.DSH_HOME || process.cwd() } = {}) {
  const root = join(dshHome, 'sessions')
  const sessionDir = findSessionDir(root, sessionId)
  if (!sessionDir) return null
  const file = latestSessionFile(sessionDir)
  if (!file) return null

  let text = ''
  try {
    const bytes = readFileSync(file)
    text = file.endsWith('.zstd') ? decodeZstdFrames(bytes) : bytes.toString('utf8')
    if (text === null) return null
  } catch {
    return null
  }

  const lines = text.split(/\r?\n/).filter(Boolean)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    let record
    try {
      record = JSON.parse(lines[index])
    } catch {
      continue
    }
    const route = routeFromRecord(record)
    if (route) return route
  }
  return null
}

