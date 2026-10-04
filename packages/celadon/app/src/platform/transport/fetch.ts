/* **出海口**：两宿主一种接口（`17-transport.md` §3）。
   · 没有宿主（浏览器）：用全局 `fetch`
   · 有宿主（桌面壳）：用官方 `@tauri-apps/plugin-http` 的 `fetch` —— **同一签名**，所以上层代码不变
   只有本文件发请求；别处一律不直接调 `fetch`。 */

import { hasHost } from '../bridge/invoke'
import { refreshSession, sessionAuthorization } from '../credential/session'
import { networkFailure, statusFailure, withTimeout } from './errors'
import { fail, type BridgeFailure } from '../bridge/result'
import { ok, type BridgeResult } from '../bridge/result'

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

/** 选实现：宿主在就用插件的，否则用浏览器的。 */
export async function pickFetch(): Promise<FetchLike> {
  if (!hasHost()) return globalThis.fetch.bind(globalThis) as FetchLike
  const { fetch: hostFetch } = await import('@tauri-apps/plugin-http')
  return hostFetch as unknown as FetchLike
}

export type RequestOptions = RequestInit & { timeoutMs?: number }

/** 这个地址在**当前客户端**发得出去吗？
 *  浏览器受同源策略约束：跨域要对方允许（CORS）才行，所以**不许**它去够任意地址（`15 §5` 同一条道理：
 *  Web 只认托管方给的清单）。桌面壳走宿主插件，不受这条限制。
 *  **返回 null 表示可以发**；否则回一条说得清的失败。 */
export function crossOriginRefusal(input: RequestInfo | URL, host: boolean): BridgeFailure | null {
  if (host) return null
  const raw = typeof input === 'string' ? input : String(input)
  try {
    const target = new URL(raw, globalThis.location?.href ?? 'http://localhost/')
    const here = globalThis.location
    if (!here || !here.origin || here.origin === 'null') return null // 非浏览器环境（测试/SSR）
    if (target.origin === here.origin) return null
    return fail('transport.cross_origin', `the browser cannot call another origin: ${raw}`, { url: raw })
  } catch {
    return null // 相对路径之类，交给 fetch 自己判断
  }
}

/** 发一次请求。**失败是值**，不是异常：形状见 `errors.ts`。 */
export async function transportFetch(
  input: RequestInfo | URL,
  init: RequestOptions = {},
): Promise<BridgeResult<Response>> {
  const url = typeof input === 'string' ? input : String(input)
  // **默认不限定**：超时由业务方给（见 17 §2.2），出口不替它定数字
  const { timeoutMs, ...rest } = init
  const host = hasHost()
  // 浏览器里**先判跨域**：不让它去够够不到的地址，也不给说不清的失败
  const refusal = crossOriginRefusal(input, host)
  if (refusal) return refusal
  let call: FetchLike
  try {
    call = await pickFetch()
  } catch (error) {
    return networkFailure(error, url)
  }
  // **凭据"有就带上，不覆盖显式给的"**（`15 §4`）：Web 没有 = 不带；桌面 = 宿主拿到的
  const withCredential = (init: RequestOptions): RequestOptions => {
    const authorization = sessionAuthorization()
    if (!authorization) return init
    const merged = new Headers(init.headers)
    if (!merged.has('authorization')) merged.set('Authorization', authorization)
    return { ...init, headers: merged }
  }
  const outcome = await withTimeout((signal) => call(input, { ...withCredential(rest), signal }), url, timeoutMs)
  if (!outcome.ok || outcome.value.status !== 401) return outcome.ok ? ok(outcome.value) : outcome.failure
  // 401：**续期一次、重放一次**（刷新本身由数据层声明，出口只认注入的那一支；不循环）
  const refreshed = await refreshSession()
  if (!refreshed.ok || !refreshed.value) return ok(outcome.value)
  const retried = await withTimeout((signal) => call(input, { ...withCredential(rest), signal }), url, timeoutMs)
  return retried.ok ? ok(retried.value) : retried.failure
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
  timeoutMs?: number,
): Promise<BridgeResult<{ status: number; ok: boolean; contentType: string }>> {
  const result = await transportFetch(url, { method: 'GET', timeoutMs })
  if (!result.ok) return result
  return ok({
    status: result.value.status,
    ok: result.value.ok,
    contentType: result.value.headers.get('content-type') ?? '',
  })
}
