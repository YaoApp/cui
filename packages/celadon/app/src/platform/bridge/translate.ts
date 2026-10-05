/* **把桥的失败翻成界面文案**：按 `code` 去应用语言包取 `bridge.error.<code>`。
 *
 * 约定（`08-i18n.md`）：**宿主给码，应用翻译**。语言包里没有对应 key 时**不静默** ——
 * 回退到英文诊断并记一条警告，提醒补翻译（`check-i18n` 的缺 key 门禁也会报）。 */

import type { BridgeFailure } from './result'
import { i18n } from '../i18n'
import { codeToKey } from '../i18n/code-key'

export { codeToKey } from '../i18n/code-key'

type Translate = (key: string, options?: Record<string, unknown>) => string

/** 机器码 → 语言包 key：**码是 snake_case，key 是 lowerCamelCase**（`check-i18n` 的命名约定）。
 *  `theme.expected_light_or_dark` → `theme.expectedLightOrDark`；前缀 `bridge.error.` 由调用处加。 */

/** i18next 取不到 key 时会把 key 原样返回（或用 `defaultValue`），据此判断缺翻译。 */
export function bridgeErrorText(t: Translate, failure: BridgeFailure): string {
  const key = `bridge.error.${codeToKey(failure.code)}`
  const text = t(key, failure.params)
  if (!text || text === key) {
    console.warn(`[bridge] missing translation for ${key}; showing the diagnostic message`)
    return failure.message || failure.code
  }
  return text
}

/** 一句可直接上屏的失败文案：用**平台 i18n 实例**调 `bridgeErrorText`，调用方不再各自造取词适配器。
 *
 *  收的是 `{ code, params, message }`（桥的失败与数据层的 `Failure` 同形），React 之外也能用；
 *  缺翻译时仍是 `bridgeErrorText` 的回退（英文诊断 + 警告）。 */
export function failureText(failure: { code: string; params: Record<string, unknown>; message: string }): string {
  const translate = (key: string, options?: Record<string, unknown>) =>
    i18n.t(key as never, options as never) as unknown as string
  return bridgeErrorText(translate, { ok: false, ...failure })
}
