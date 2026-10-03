/* **能力开关**（15-platform.md §5）：feature 要用宿主能力就问这里，**不许自己判宿主**。
 *
 * Web 下按特性探测；桌面下宿主提供（`bridge/` 在 Web 下不存在，所以判断只发生在这里）。 */

import { clientKind } from './manifest'

export type Capabilities = {
  clipboard: boolean
  files: boolean
  notifications: boolean
  externalOpen: boolean
}

/** 一次探测，按客户端类型给开关。**唯一的分支点。** */
export function capabilities(): Capabilities {
  if (clientKind() === 'desktop') {
    return { clipboard: true, files: true, notifications: true, externalOpen: true }
  }
  const scope = globalThis as { isSecureContext?: boolean; Notification?: unknown; showOpenFilePicker?: unknown }
  const secure = scope.isSecureContext !== false
  return {
    clipboard: secure && typeof navigator !== 'undefined' && 'clipboard' in navigator,
    files: typeof scope.showOpenFilePicker === 'function',
    notifications: typeof scope.Notification === 'function',
    externalOpen: typeof globalThis.open === 'function',
  }
}
