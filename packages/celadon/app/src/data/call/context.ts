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

/** **草稿**：与后端对齐后固化（`X-Yao-*` 沿用旧服务的习惯）。 */
export function contextHeaders(ctx: Context): Record<string, string> {
  return {
    'Accept-Language': ctx.locale,
    'X-Yao-Client': ctx.clientId,
    'X-Yao-Theme': ctx.theme,
    'X-Yao-Timezone': ctx.timezone,
  }
}

/** 少数接口把语言放 query（旧代码的 chat 就是这样）。 */
export function contextQuery(ctx: Context): Record<string, string> {
  return { locale: ctx.locale }
}
