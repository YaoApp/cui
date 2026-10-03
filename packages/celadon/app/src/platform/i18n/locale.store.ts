import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { i18n, SUPPORTED_LOCALES } from './i18n'
import { resolveLocale } from './resolve-locale'

/** 界面语言，BCP-47 规范形式；允许值是 SUPPORTED_LOCALES（从语言包目录发现）。 */
export type Locale = string
/** 语言偏好：`'system'` 跟随系统语言，或用户显式选定的一个 Locale。 */
export type LocalePreference = 'system' | Locale

type LocaleState = {
  /** 当前偏好；首次访问（无持久化）是 `'system'` */
  locale: LocalePreference
  /** 动作：切换语言偏好 —— 写 store 的唯一入口 */
  setLocale: (locale: LocalePreference) => void
}

/** 浏览器报告的系统语言，按优先级排序（`navigator.languages` 已经是优先序）。 */
const systemLanguages = (): readonly string[] => {
  if (typeof navigator === 'undefined') return []
  const languages = navigator.languages
  if (languages && languages.length > 0) return languages
  return navigator.language ? [navigator.language] : []
}

/** 校验一个持久化值是否是合法偏好；非法一律回落 `'system'`。 */
export const coerceLocalePreference = (value: unknown): LocalePreference =>
  value === 'system' || (typeof value === 'string' && SUPPORTED_LOCALES.includes(value))
    ? (value as LocalePreference)
    : 'system'

/** 把偏好解析成实际语言：`'system'` 跟随 navigator，显式选择不再跟随。 */
export const resolvePreference = (preference: LocalePreference): Locale =>
  preference === 'system' ? resolveLocale(systemLanguages(), SUPPORTED_LOCALES) : preference

/* 语言是运行时的事，归平台层（见 architecture/06-state.md §1「宿主 / 外观 / 布局机制」）。
   选中的偏好存 localStorage，刷新后还在；默认 `'system'`，用户显式选过才固定下来。
   动作留名字，日志里能看出是谁改的。 */
export const useLocaleStore = create<LocaleState>()(
  devtools(
    persist(
      (set) => ({
        locale: 'system',
        setLocale: (locale) => set({ locale }, false, 'i18n/setLocale'),
      }),
      {
        name: 'cui.locale',
        /* 水合时**校验**：存储可能来自旧版本或被手改，非法值不许进入 UI 与 <html lang>。 */
        merge: (persisted, current) => ({
          ...current,
          locale: coerceLocalePreference((persisted as { locale?: unknown } | undefined)?.locale),
        }),
      },
    ),
    { name: 'locale' },
  ),
)

/* 唯一的副作用：把**解析后**的语言同步到 i18n 实例与 `<html lang>`。和主题一样写在订阅里 ——
   持久化水合、测试里整体复位都会经过这里；但订阅只在变化时触发，
   所以初始值必须单独应用一次，否则"从没切过语言"时 i18n 还停在默认语言。 */
const apply = (preference: LocalePreference) => {
  const locale = resolvePreference(preference)
  if (!SUPPORTED_LOCALES.includes(locale)) return
  if (i18n.language !== locale) void i18n.changeLanguage(locale)
  document.documentElement.lang = locale
}

apply(useLocaleStore.getState().locale)
useLocaleStore.subscribe((state) => apply(state.locale))
