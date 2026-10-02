import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { DEFAULT_LOCALE, i18n, SUPPORTED_LOCALES } from './i18n'

/** 界面语言，BCP-47 规范形式；允许值是 SUPPORTED_LOCALES（从语言包目录发现）。 */
export type Locale = string

type LocaleState = {
  /** 当前界面语言；`zh-CN` 是基准语言 */
  locale: Locale
  /** 动作：切换语言 —— 写 store 的唯一入口 */
  setLocale: (locale: Locale) => void
}

/* 语言是运行时的事，归平台层（见 architecture/06-state.md §1「宿主 / 外观 / 布局机制」）。
   选中的语言存 localStorage，刷新后还在；动作留名字，日志里能看出是谁改的。 */
export const useLocaleStore = create<LocaleState>()(
  devtools(
    persist(
      (set) => ({
        locale: DEFAULT_LOCALE,
        setLocale: (locale) => set({ locale }, false, 'i18n/setLocale'),
      }),
      { name: 'cui.locale' },
    ),
    { name: 'locale' },
  ),
)

/* 唯一的副作用：把当前语言同步到 i18n 实例。和主题一样写在订阅里 ——
   持久化水合、测试里整体复位都会经过这里；订阅只在变化时触发，
   所以初始值必须单独应用一次，否则"从没切过语言"时 i18n 还停在默认语言。 */
const apply = (locale: Locale) => {
  if (!SUPPORTED_LOCALES.includes(locale)) return
  if (i18n.language !== locale) void i18n.changeLanguage(locale)
}

apply(useLocaleStore.getState().locale)
useLocaleStore.subscribe((state) => apply(state.locale))
