import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

/** 基准语言：唯一手写的源（见 architecture/08-i18n.md §5）。 */
export const DEFAULT_LOCALE = 'zh-CN'

type LocaleModule = { default: Record<string, string> }

/* 语言包跟代码走 —— 三处路径按 locale 合并（见 architecture/08-i18n.md §2）：
   共用词在 app/src/locales/ · feature 私有的在 features/<域>/locales/ · 组件私有的在 components/<名>/locales/。
   新增一种语言 = 只加一个目录，这里不改。 */
const modules: Record<string, LocaleModule> = {
  ...import.meta.glob<LocaleModule>('../../locales/*.json', { eager: true }),
  ...import.meta.glob<LocaleModule>('../../features/*/locales/*.json', { eager: true }),
  ...import.meta.glob<LocaleModule>('../../components/*/locales/*.json', { eager: true }),
}

/** BCP-47 规范形式的 locale，从语言包文件名发现（`zh-CN.json` → `zh-CN`）。 */
const localeOf = (path: string) => path.split('/').pop()!.replace(/\.json$/, '')

const resources: Record<string, Record<string, string>> = {}
for (const [path, module] of Object.entries(modules)) {
  const locale = localeOf(path)
  resources[locale] = { ...resources[locale], ...module.default }
}

/** 已发现的语言，按字典序 —— 语言切换按钮据此渲染，新增语言不用改代码。 */
export const SUPPORTED_LOCALES = Object.keys(resources).sort()

/* key 是**平铺 + 点号分组**（`nav.theme`），所以关掉 i18next 的点号分隔：
   否则 `t('nav.theme')` 会去找嵌套的 nav → theme，而语言包里本来就是平铺的一行。
   initAsync: false —— 资源是 eager 载入的，同步初始化，首屏不会先闪 key。 */
i18next.use(initReactI18next).init({
  initAsync: false,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  resources: Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, { translation: resources[locale] }]),
  ),
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
})

export const i18n = i18next
