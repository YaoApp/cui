/* **能力开关**（15-platform.md §5）：feature 要用宿主能力就问这里，**不许自己判宿主**。
 *
 * Web 下按特性探测；桌面下宿主提供（`bridge/` 在 Web 下不存在，所以判断只发生在这里）。 */

import { clientKind } from './manifest'

export type Capabilities = {
  clipboard: boolean
  files: boolean
  notifications: boolean
  externalOpen: boolean
  /** 这台客户端**自己持有**服务地址（用户填、跨重启还在）—— 只有桌面为真。 */
  serviceAddress: boolean
}

/** 一次探测，按客户端类型给开关。**唯一的分支点。** */
export function capabilities(): Capabilities {
  if (clientKind() === 'desktop') {
    return {
      clipboard: true,
      files: true,
      notifications: true,
      externalOpen: true,
      serviceAddress: true,
    }
  }
  const scope = globalThis as { isSecureContext?: boolean; Notification?: unknown; showOpenFilePicker?: unknown }
  const secure = scope.isSecureContext !== false
  return {
    clipboard: secure && typeof navigator !== 'undefined' && 'clipboard' in navigator,
    files: typeof scope.showOpenFilePicker === 'function',
    notifications: typeof scope.Notification === 'function',
    externalOpen: typeof globalThis.open === 'function',
    // 浏览器不能换服务地址：地址由服务端 / 构建期决定，页面没有可写的地方
    serviceAddress: false,
  }
}
