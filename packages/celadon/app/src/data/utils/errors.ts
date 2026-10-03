/* **0.1 错误收口**：服务端的错误体 → `ApiFailure`（与传输失败同形）。
 *
 * 认得的写法：
 *   · `{ error, error_description }`（旧 OAuth 形状）
 *   · `{ code, message }` · `{ error: { code, message } }`
 *   · 字段级：`{ fields: [{ path|field, code, params }] }` · `{ errors: [...] }`
 */

import type { ApiFailure, FieldIssue } from '../types'

type Raw = Record<string, unknown>

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

function issues(raw: Raw): readonly FieldIssue[] | undefined {
  const list = raw.fields ?? raw.errors
  if (!Array.isArray(list)) return undefined
  const mapped = list
    .map((item) => {
      const one = (item ?? {}) as Raw
      const path = text(one.path) ?? text(one.field) ?? text(one.name)
      const code = text(one.code) ?? text(one.error) ?? 'invalid'
      if (!path) return undefined
      return { path, code, ...(one.params && typeof one.params === 'object' ? { params: one.params as Record<string, unknown> } : {}) }
    })
    .filter((one): one is FieldIssue => one !== undefined)
  return mapped.length > 0 ? mapped : undefined
}

/** @param fallbackCode 服务端没给码时用的（如 `user.create_failed`） */
export function toFailure(status: number, body: unknown, fallbackCode: string): ApiFailure {
  const raw = (body && typeof body === 'object' ? body : {}) as Raw
  const nested = (raw.error && typeof raw.error === 'object' ? raw.error : {}) as Raw
  const code = text(nested.code) ?? text(raw.code) ?? text(raw.error) ?? fallbackCode
  const message = text(nested.message) ?? text(raw.error_description) ?? text(raw.message) ?? `the service answered ${status}`
  const fields = issues(raw)
  return { code, params: { status }, message, ...(fields ? { fields } : {}) }
}
