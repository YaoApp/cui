/* **0.4 请求元数据（ctx）**：普通请求与订阅**带同一份**。
 *
 * 事实的采集在平台层（`platform/client/context.ts` 的 `metadata`），这里只做两件事：
 *   · 把平台事实 + 客户端标识 + 服务地址**组合**成一份 ctx
 *   · 决定**怎么带**（头还是 query）—— 名字是**草稿**，要与后端对齐（旧代码 locale 走 query、`X-Yao-*` 头）
 *
 * **契约**：这里不读 store、不读 DOM（值由调用方传进来），所以是可测的纯函数；
 * 默认值由 `send()` 从平台层取（`platform/client/context.ts` 的 `currentPreferences()`），覆盖时显式传。
 */

import { client, type Preferences, type RequestMetadata } from '@/platform/client'
import { serviceBase } from '@/platform/service'

/** 一次出站调用要带的全部上下文（在 `request/` 里，所以就叫 `Context`）。 */
export type Context = RequestMetadata & {
  /** 客户端标识（`web-…` / `desk-<机器码>`，见 `15 §5`）—— 与 `RequestMetadata.client`（web/desktop）不是一回事 */
  clientId: string
  /** 服务基址（同源时为空串，见 `platform/service`） */
  service: string
}

/** 要什么由平台那侧定（`Preferences`），这里**不另造一个形状**。 */
export function context(inputs: Preferences): Context {
  const facts = { ...client.metadata, ...inputs }
  return { ...facts, clientId: client.id, service: serviceBase() }
}

/** 按**引擎源码**对齐（`yao/agent/context/types.go:33-52` 的 `ValidAccepts`）：
 *  `standard` · `cui-web` · `cui-native` · **`cui-desktop`**（不是 `cui-desk`）。
 *  引擎取这个值的优先序：query `accept` > 头 `X-Yao-Accept` > body `metadata.accept`（`yao/agent/context/openapi.go:284-311`）。
 *  **CSRF 不在这里**：`15 §4` 定了前端不碰令牌。 */
export function headers(ctx: Context): Record<string, string> {
  return {
    'X-Yao-Accept': accept(ctx),
    // 引擎取语言：query `locale` > `Accept-Language`（`yao/agent/context/openapi.go:193-224`）；
    // **登录相关接口只认 `X-Locale`/`Accept-Language`，不读 query**（`yao/openapi/user/utils.go:118-130`）
    'Accept-Language': ctx.locale,
    'X-Locale': ctx.locale,
    'Content-Type': 'application/json',
  }
}

/** 流式（SSE / WS）**只能**把上下文放 query —— `EventSource` 不能设头，浏览器 WS 握手也不能；
 *  引擎两侧都认：`accept` 与 `locale`（`yao/agent/context/openapi.go:468-540`）。
 *  会话/助手/模型等**域专属**参数由该域自己加。 */
export function query(_ctx: Context): Record<string, string> {
  /* **ctx 不再往 query 里塞东西**（2026-10-05）：语言与 accept 只走请求头，各接口若方言是 query，
     由**域层自己**按接口适配（`user/api.ts` 的 entryConfig / entryOtp 就是这么做的）。
     这个函数保留是为了让出口的合并顺序（ctx → 域 → 调用方）保持不变。 */
  return {}
}

function accept(ctx: Context): string {
  return ctx.client === 'desktop' ? 'cui-desktop' : 'cui-web'
}
