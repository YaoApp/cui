/* **出站上下文**（15-platform.md §5.1）：供后端做本地化与展示决策。
 * 平台层只保证值**随时可取**；载体（请求头 / 查询参数 / 请求体）在接口封装时定。
 * **不另存一份**：只汇总，不复制状态、不额外持久化；拿不到就不带。 */

import { clientKind } from './manifest'

export type OutboundContext = {
  locale: string
  timezone: string
  theme: 'light' | 'dark'
  client: 'web' | 'desktop'
}

export type OutboundInputs = {
  /** `i18n/` 的**解析结果**，不传 `'system'` */
  locale: string
  /** `theme/` 的**解析结果**，不传 `'system'` */
  theme: 'light' | 'dark'
}

/** 组装出站上下文。时区**调用时读**（用户可能改了系统时区）。 */
export function outboundContext(inputs: OutboundInputs): OutboundContext {
  return {
    locale: inputs.locale,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    theme: inputs.theme,
    client: clientKind(),
  }
}
