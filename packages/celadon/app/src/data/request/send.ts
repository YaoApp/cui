/* **普通请求的包装**（`request/` 里，与订阅共用同一套 ctx）：组装 → 出口 → 解包裹。
 *
 * 这一层**只做三件事**：把 ctx 与查询拼上 · 交给 `platform/transport/` 发 · 把结果解成 `Result<T>`。
 * **不拼业务字段、不判状态码语义**（那是各域与引擎的事）。
 */

import type { OutboundInputs } from '@/platform/client/context'
import { serviceInfo, serviceUrl } from '@/platform/service'
import { transportFetch } from '@/platform/transport/fetch'
import type { Result } from '../types'
import { failure as buildFailure } from '../utils/failure'
import { unwrap } from '../utils/unwrap'
import { context, headers as contextHeaders, query as contextQuery, type Context } from './context'

/** 一个接口的声明：**只写方法与路径**（进出类型在调用方给的泛型上，见 `data/<域>/api.ts`）。 */
export type Call = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 引擎的路径（**不含** `openapi` 前缀，如 `/helloworld/public`） */
  path: string
}

export type SendInputs = {
  /** 出站上下文（语言 · 主题）—— 由钩子层从 `platform/` 读出来传进来（`hub` 不变） */
  outbound: OutboundInputs
  /** 该域自己的查询参数（如 `page` · `pagesize`）—— 与 ctx 的合并，ctx 先 */
  query?: Record<string, string | number | boolean | undefined>
  /** 请求体（`GET`/`DELETE` 不带） */
  body?: unknown
  signal?: AbortSignal
  /** **超时由调用方给**（`17 §2.2`：出口不替业务方定数字） */
  timeoutMs?: number
}

function withQuery(url: string, params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value))
  const text = search.toString()
  return text ? `${url}${url.includes('?') ? '&' : '?'}${text}` : url
}

/** 一次普通请求。**失败是值**，不抛异常。 */
export async function send<T>(call: Call, inputs: SendInputs): Promise<Result<T>> {
  const ctx: Context = context(inputs.outbound)
  // 引擎的接口都在 `well-known` 给的 `openapi` 前缀下（没读到就先按 `/v1` —— 见 `plan/03-data.md` 的 serverUrl 缺口）
  const openapi = serviceInfo()?.openapi ?? '/v1'
  const url = withQuery(serviceUrl(`${openapi}${call.path}`), { ...contextQuery(ctx), ...(inputs.query ?? {}) })

  const response = await transportFetch(url, {
    method: call.method,
    headers: contextHeaders(ctx),
    ...(inputs.body === undefined ? {} : { body: JSON.stringify(inputs.body) }),
    ...(inputs.signal ? { signal: inputs.signal } : {}),
    ...(inputs.timeoutMs === undefined ? {} : { timeoutMs: inputs.timeoutMs }),
  })
  if (!response.ok) return response
  if (!response.value.ok) {
    let body: unknown
    try {
      body = await response.value.json()
    } catch {
      body = undefined
    }
    return { ok: false, ...buildFailure(response.value.status, body, `${call.method.toLowerCase()}_failed`) }
  }
  return { ok: true, value: unwrap<T>(await response.value.json()) }
}
