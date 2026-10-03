/* **出海口**：两宿主一种接口（`17-transport.md` §3）。
   · 没有宿主（浏览器）：用全局 `fetch`
   · 有宿主（桌面壳）：用官方 `@tauri-apps/plugin-http` 的 `fetch` —— **同一签名**，所以上层代码不变
   只有本文件发请求；别处一律不直接调 `fetch`。 */

import { hasHost } from '../bridge/invoke'
import { networkFailure, statusFailure, withTimeout } from './errors'
import { ok, type BridgeResult } from '../bridge/result'

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

/** 选实现：宿主在就用插件的，否则用浏览器的。 */
export async function pickFetch(): Promise<FetchLike> {
  if (!hasHost()) return globalThis.fetch.bind(globalThis) as FetchLike
  const { fetch: hostFetch } = await import('@tauri-apps/plugin-http')
  return hostFetch as unknown as FetchLike
}

export type RequestOptions = RequestInit & { timeoutMs?: number }

/** 发一次请求。**失败是值**，不是异常：形状见 `errors.ts`。 */
export async function transportFetch(
  input: RequestInfo | URL,
  init: RequestOptions = {},
): Promise<BridgeResult<Response>> {
  const url = typeof input === 'string' ? input : String(input)
  const { timeoutMs = 15_000, ...rest } = init
  let call: FetchLike
  try {
    call = await pickFetch()
  } catch (error) {
    return networkFailure(error, url)
  }
  const outcome = await withTimeout((signal) => call(input, { ...rest, signal }), url, timeoutMs)
  return outcome.ok ? ok(outcome.value) : outcome.failure
}

/** 同上，但**非 2xx 也算失败**（多数业务调用要这个）。 */
export async function transportFetchOk(
  input: RequestInfo | URL,
  init: RequestOptions = {},
): Promise<BridgeResult<Response>> {
  const result = await transportFetch(input, init)
  if (!result.ok) return result
  if (!result.value.ok) return statusFailure(result.value, typeof input === 'string' ? input : String(input))
  return result
}

/** 探一下地址能不能用（验证页用）：只回报状态与类型，不读正文。 */
export async function probe(
  url: string,
  timeoutMs = 15_000,
): Promise<BridgeResult<{ status: number; ok: boolean; contentType: string }>> {
  const result = await transportFetch(url, { method: 'GET', timeoutMs })
  if (!result.ok) return result
  return ok({
    status: result.value.status,
    ok: result.value.ok,
    contentType: result.value.headers.get('content-type') ?? '',
  })
}
