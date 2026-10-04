/* **偏好的 React 面孔**（`15 §5.4`）：值 + 动作。订阅留在平台层 —— feature 与 component
 * 不 import 语言 / 主题 store。
 *
 * 为什么不给 `client.preferences` 加订阅：它是 getter，**每次读都是当前值**，但它不触发重渲染。
 * 会变的数据由这里的 hook 负责"值 + 订阅"；静态事实（kind / os / manifest / capabilities / host / id）
 * 永不变化，渲染里直接读 `client` 即可。 */

import { resolvePreference, useLocaleStore } from '../i18n/locale.store'
import { useThemeStore, type ThemePreference } from '../theme/theme.store'

/** 语言：`preference` 是用户选的（可能 `'system'`，切换器判断选中项要用它），`locale` 是解析后的值。 */
export function useLocalePreference() {
  const preference = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  return { preference, locale: resolvePreference(preference), setLocale }
}

/** 主题：`theme` 是解析后的浅 / 深（显示用），`setTheme` 收偏好（`'system'` / `'light'` / `'dark'`）。 */
export function useThemePreference() {
  const theme = useThemeStore((state) => state.theme)
  const setPreference = useThemeStore((state) => state.setPreference)
  return { theme, setTheme: (next: ThemePreference) => setPreference(next) }
}
