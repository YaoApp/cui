/* **普通请求的包装**（`request/` 里，与订阅共用同一套 ctx）：组装 → 出口 → 解包裹。
 *
 * 这一层**只做三件事**：把 ctx 与查询拼上 · 交给 `platform/transport/` 发 · 把结果解成 `Result<T>`。
 * **不拼业务字段、不判状态码语义**（那是各域与引擎的事）。
 */

import type { OutboundInputs } from '@/platform/client/context'
import { apiUrl } from '@/platform/service'
import { transportFetch } from '@/platform/transport/fetch'
import type { Result } from '../types'
import { failure as buildFailure } from '../utils/failure'
import { unwrap } from '../utils/unwrap'
import { context, headers as contextHeaders, query as contextQuery, type Context } from './context'

/** 一个接口的**声明**：只写方法与路径（进出类型在调用方给的泛型上，见 `data/<域>/api.ts`）。
 *
 *  **名字与 DOM 的 `Request` 同名**，但两者无关：这里指"我们这个接口怎么调"；
 *  发请求用的是 `RequestInit`（`platform/transport/`），别混。 */
export type Request = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 引擎的路径（**不含** `openapi` 前缀，如 `/helloworld/public`） */
  path: string
  /** **这个接口要不要凭据** —— 与引擎侧的 `oauth.Guard` 对齐：
   *  · `'required'`（默认）：受保护（`/helloworld/protected`）—— 出口带上凭据（Web = 浏览器带 Cookie · 桌面 = 宿主带 Bearer）
   *  · `'none'`：**公开**（`/helloworld/public` · 登录前）—— **别带**（Web 下显式 `credentials: 'omit'`）
   *  · `'manual'`：**调用方自己在 `headers` 里给**（两步登录第一步的临时 `Authorization`）
   *    （叫 `manual` 是直白说法；网关圈子里同类概念叫 `passthrough`，gRPC 叫 call credentials）*/
  auth?: 'required' | 'none' | 'manual'
}

export type SendInputs = {
  /** 出站上下文（语言 · 主题）—— 由钩子层从 `platform/` 读出来传进来（`hub` 不变） */
  outbound: OutboundInputs
  /** 该域自己的查询参数（如 `page` · `pagesize`）—— 与 ctx 的合并，ctx 先 */
  query?: Record<string, string | number | boolean | undefined>
  /** **显式头**：合并**在 ctx 之后**（调用方说了算）。
   *  用途之一：两步登录第一步要显式带临时 `Authorization`（`15 §4`：注入凭据但不覆盖它）。
   *  **凭据本身不从这里注入** —— Web 由浏览器带 Cookie，桌面由宿主带 Bearer（`17 §2`）。 */
  headers?: Record<string, string>
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
export async function send<T>(request: Request, inputs: SendInputs): Promise<Result<T>> {
  const ctx: Context = context(inputs.outbound)
  // `'manual'` 是**声明"调用方自己带"** —— 那就必须真带了，否则这里直接拒（免得裸奔）
  if (request.auth === 'manual' && !inputs.headers?.Authorization) {
    return { ok: false, ...buildFailure(0, undefined, 'request.manual_auth_missing') }
  }
  // 地址由**平台层**给（基址 + well-known 的 openapi 前缀）；**读不到服务信息就直接报错**，不兜前缀
  const address = apiUrl(request.path)
  if (!address) {
    return { ok: false, ...buildFailure(0, undefined, 'service.not_ready') }
  }
  const url = withQuery(address, { ...contextQuery(ctx), ...(inputs.query ?? {}) })

  const response = await transportFetch(url, {
    method: request.method,
    headers: { ...contextHeaders(ctx), ...(inputs.headers ?? {}) },
    // 公开接口明确不带凭据（Web 下浏览器本来会带同源 Cookie，这里关掉；桌面由宿主照同一条声明判断）
    ...(request.auth === 'none' ? { credentials: 'omit' as const } : {}),
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
    return { ok: false, ...buildFailure(response.value.status, body, `${request.method.toLowerCase()}_failed`) }
  }
  return { ok: true, value: unwrap<T>(await response.value.json()) }
}
