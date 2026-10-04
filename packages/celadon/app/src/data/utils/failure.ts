/* **0.1 错误收口**：服务端的错误体 → `Failure`（与传输失败同形）。
 *
 * 认得的写法：
 *   · `{ error, error_description }`（旧 OAuth 形状）
 *   · `{ code, message }` · `{ error: { code, message } }`
 *   · 字段级：`{ fields: [{ path|field, code, params }] }` · `{ errors: [...] }`
 */

import type { Failure } from '../types'

type Raw = Record<string, unknown>

/** 由码算一句可读的英文兜底（`user.invalid_name` → `user: invalid name`）。**不做翻译**（翻译按码走）。 */
function humanize(code: string): string {
  const [scope, ...rest] = code.split(/[._]/)
  const what = rest.join(' ').replace(/_/g, ' ')
  return what ? `${scope}: ${what}` : code
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

function strings(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const list = value.filter((one): one is string => typeof one === 'string')
  return list.length > 0 ? list : undefined
}

/** @param fallbackCode 服务端没给码时用的（如 `user.create_failed`） */
export function failure(status: number, body: unknown, fallbackCode: string): Failure {
  const raw = (body && typeof body === 'object' ? body : {}) as Raw
  const nested = (raw.error && typeof raw.error === 'object' ? raw.error : {}) as Raw
  // 引擎：`error` 是码、`error_description` 是诊断；少数接口是 `{error:{code,message}}` 或 `{error:"…"}`
  const code = text(nested.code) ?? text(raw.error) ?? text(raw.code) ?? fallbackCode
  const message = text(raw.error_description) ?? text(nested.message) ?? text(raw.message) ?? text(raw.reason) ?? `the service answered ${status}`
  const requiredScopes = strings(raw.required_scopes)
  const missingScopes = strings(raw.missing_scopes)
  return {
    code,
    params: { status },
    // 上层兜底：**由码算出来**（渲染不走它，走按码翻译）
    message: humanize(code),
    ...(message ? { rawMessage: message } : {}),
    ...(requiredScopes ? { requiredScopes } : {}),
    ...(missingScopes ? { missingScopes } : {}),
  }
}
