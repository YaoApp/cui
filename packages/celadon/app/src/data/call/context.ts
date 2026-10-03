/* **0.4 出站上下文（ctx）**：普通请求与订阅**带同一份**。
 *
 * 事实的采集在平台层（`platform/client/context.ts` 的 `outboundContext`），这里只做两件事：
 *   · 把平台事实 + 客户端标识 + 服务地址**组合**成一份 ctx
 *   · 决定**怎么带**（头还是 query）—— 名字是**草稿**，要与后端对齐（旧代码 locale 走 query、`X-Yao-*` 头）
 *
 * **契约**：这里不读 store、不读 DOM（值由调用方传进来），所以是可测的纯函数；
 * 语言与主题由钩子层从 `platform/i18n` · `platform/theme` 读出来传进来。
 */

import type { OutboundContext, OutboundInputs } from '@/platform/client/context'
import { outboundContext } from '@/platform/client/context'
import { clientId as currentClientId } from '@/platform/client/client-id'
import { serviceBase } from '@/platform/service'

/** 一次出站调用要带的全部上下文（在 `call/` 里，所以就叫 `Context`）。 */
export type Context = OutboundContext & {
  /** 客户端标识（`web-…` / `desk-<机器码>`，见 `15 §5`）—— 与 `OutboundContext.client`（web/desktop）不是一回事 */
  clientId: string
  /** 服务基址（同源时为空串，见 `platform/service`） */
  service: string
}

/** 要什么由平台那侧定（`OutboundInputs`），这里**不另造一个形状**。 */
export function callContext(inputs: OutboundInputs): Context {
  const facts = outboundContext(inputs)
  return { ...facts, clientId: currentClientId(), service: serviceBase() }
}

/** **按旧客户端对齐**（`packages/cui/openapi/chat/api.ts:170`）：用它告诉后端"要 CUI 格式"。
 *  `cui-web` 是旧代码的取值；**桌面的取值待与后端确认**（先按 `cui-desk` 走）。
 *  **CSRF 不在这里**：`15 §4` 定了前端不碰令牌；若服务端仍要求，注入点只能在 `platform/transport/`。 */
export function contextHeaders(ctx: Context): Record<string, string> {
  return {
    'X-Yao-Accept': ctx.client === 'desktop' ? 'cui-desk' : 'cui-web',
    // 域专属的头（如聊天的 `X-Yao-Assistant` / `X-Yao-Chat`）由**该域**自己加，不塞进 ctx
    'Content-Type': 'application/json',
  }
}

/** **流式（SSE / WS）把上下文放 query —— 只能这么带**：
 *  `EventSource` 不能设自定义头，浏览器 `WebSocket` 握手也带不了自定义头；
 *  旧代码同样把语言放 query（`chat/api.ts` · `kb/api.ts:607`）。 */
export function contextQuery(ctx: Context): Record<string, string> {
  return { locale: ctx.locale }
}
