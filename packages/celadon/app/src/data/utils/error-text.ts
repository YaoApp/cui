/* **把数据层的失败翻成界面文案**：按 `code` 去应用语言包取 `data.error.<code>`。
 *
 * 与桥的 `bridgeErrorText` 同一套规矩（`08-i18n.md`）：**宿主/引擎给码，应用翻译** ——
 * 渲染一律走"按码翻译"，`message` 只是兜底，不是用户文案（否则四语就废了）。
 * 语言包里没有对应 key 时**不静默**：回退到英文诊断并记一条警告，提醒补翻译。 */

import { codeToKey } from '@/platform/i18n/code-key'
import type { Failure } from '../types'

type Translate = (key: string, options?: Record<string, unknown>) => string

/** 数据层失败的文案 key（`data.error.` + camelCase 的码）。 */
export function dataErrorKey(code: string): string {
  return `data.error.${codeToKey(code)}`
}

export function dataErrorText(t: Translate, failure: Failure): string {
  const key = dataErrorKey(failure.code)
  const text = t(key, failure.params)
  if (!text || text === key) {
    console.warn(`[data] missing translation for ${key}; showing the diagnostic message`)
    return failure.message
  }
  return text
}
