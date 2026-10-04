/* **普通请求的包装**（`request/` 里，与订阅共用同一套 ctx）：组装 → 出口 → 解包裹。
 *
 * 这一层**只做三件事**：把 ctx 与查询拼上 · 交给 `platform/transport/` 发 · 把结果解成 `Result<T>`。
 * **不拼业务字段、不判状态码语义**（那是各域与引擎的事）。
 */

import type { Preferences } from '@/platform/client/context'
import { currentPreferences } from '@/platform/client/context'
import { endpoint, loadServiceInfo } from '@/platform/service'
import { transportFetch } from '@/platform/transport/fetch'
import type { Result } from '../types'
import { failure as buildFailure } from '../utils/failure'
import { unwrap } from '../utils/unwrap'
import { context, headers as contextHeaders, query as contextQuery, type Context } from './context'

/** 一个接口的**声明**：方法 · 路径 · **进出类型** · 该接口固定要带的头。
 *
 *  **类型只在编译期存在**（运行时 `Request` 就是 `{ method, path, headers }`），所以写声明时给它标注一下：
 *
 *  ```ts
 *  const hello = {} as Request<void, { MESSAGE: string }>   // 无输入 → 有输出
 *  const login = {} as Request<{ name: string }, User>      // 有输入 → 有输出
 *  ```
 *
 *  **Payload 格式不声明**：引擎默认 JSON（`Content-Type: application/json`）—— 只有上传那类
 *  将来要 `multipart` 时才加值，**平时谁都不用想**。
 *
 *  **凭据也不在这里声明**：出口**有就带上**（Web = 浏览器带 Cookie · 桌面 = 宿主带 Bearer）——
 *  公开接口的服务端不读它（引擎侧只有 `oauth.Guard` 才读，`yao/openapi/oauth/guard.go:240-262`），
 *  登录第一步还没有凭据，自然就不带。**业务不必每次想"要不要带"**。
 *
 *  **名字与 DOM 的 `Request` 同名**，但两者无关：这里指"我们这个接口怎么调"；
 *  发请求用的是 `RequestInit`（`platform/transport/`），别混。 */
export type Request<Input = void, Output = void> = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 引擎的路径（**不含** `openapi` 前缀，如 `/helloworld/public`） */
  path: string
  /** **这个接口固定要带的头**（如聊天域的标记头）—— 每次调用都带，不用调用方记。
   *  用标准的 `HeadersInit`：**同名重复可以表达**（元组数组 / `Headers.append`），**名字大小写不敏感**。 */
  headers?: HeadersInit
  /** 只给类型看（运行时不带值） */
  readonly input?: Input
  /** 只给类型看（运行时不带值） */
  readonly output?: Output
}

/** 一次调用除**声明**之外的东西（业界同类：Node 的 `RequestOptions` · axios 的 `AxiosRequestConfig` · gRPC 的 `CallOptions`）。 */
export type RequestOptions<Input = void> = {
  /** **覆盖**偏好（语言 · 主题）—— 不传就是平台层的**当前值**（`currentPreferences()`），
   *  所以调用点只在要改的时候传这一项，平时不出现。 */
  preferences?: Partial<Preferences>
  /** 该域自己的查询参数（如 `page` · `pagesize`）—— 与 ctx 的合并，ctx 先 */
  query?: Record<string, string | number | boolean | undefined>
  /** **这次调用的请求体**（`GET`/`DELETE` 不带）—— 类型由声明的 `Request<Input, …>` 给 */
  body?: Input
  /** **这次调用**要带的头：合并**在 ctx 与声明之后**（调用方说了算）—— `HeadersInit`，同声明那级。
   *  用途：两步登录第一步的**临时** `Authorization`（`15 §4`：注入凭据但不覆盖显式给的那个）。 */
  headers?: HeadersInit
  signal?: AbortSignal
  /** **超时由调用方给**（`17 §2.2`：出口不替业务方定数字） */
  timeoutMs?: number
}

/** 合并头：**不同来源，后者覆盖前者；同一来源里重名，追加**（`a=foo` + `a=bar` 两个都留）。
 *  用 `Headers` 是为了**大小写不敏感**（HTTP 头名本来就无关大小写）。 */
function mergeHeaders(...sources: (HeadersInit | undefined)[]): Headers {
  const merged = new Headers()
  for (const source of sources) {
    if (!source) continue
    const seen = new Set<string>()
    for (const [name, value] of new Headers(source)) {
      const key = name.toLowerCase()
      if (seen.has(key)) merged.append(name, value)
      else {
        merged.set(name, value)
        seen.add(key)
      }
    }
  }
  return merged
}

function withQuery(url: string, params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value))
  const text = search.toString()
  return text ? `${url}${url.includes('?') ? '&' : '?'}${text}` : url
}

/** 一次普通请求。**失败是值**，不抛异常。 */
export async function send<Input = void, Output = void>(
  request: Request<Input, Output>,
  options: RequestOptions<Input> = {},
): Promise<Result<Output>> {
  const ctx: Context = context({ ...currentPreferences(), ...options.preferences })
  // **第一次需要时先读**（惰性 ✓，之后走内存缓存）—— 读失败就把它自己的失败报出去（比"没就绪"更准）
  const service = await loadServiceInfo()
  if (!service.ok) return service
  // 地址由**平台层**给（基址 + well-known 的 openapi 前缀）；**读不到就直接报错**，不兜前缀
  const address = endpoint(request.path)
  if (!address) {
    return { ok: false, ...buildFailure(0, undefined, 'service.not_ready') }
  }
  const url = withQuery(address, { ...contextQuery(ctx), ...(options.query ?? {}) })

  const response = await transportFetch(url, {
    method: request.method,
    // ctx 先 → 声明里固定要带的 → 这次调用显式的（后者说了算）
    headers: mergeHeaders(contextHeaders(ctx), request.headers, options.headers),
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
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
  return { ok: true, value: unwrap<Output>(await response.value.json()) }
}
