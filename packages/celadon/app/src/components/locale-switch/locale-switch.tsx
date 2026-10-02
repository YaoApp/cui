import { SUPPORTED_LOCALES, useTranslation, type I18nKey } from '@/platform/i18n'
import { useLocaleStore } from '@/platform/i18n/locale.store'

/* 语言名用**本语言自己的写法**（endonym），所以不参与翻译；
   其余语言包里出现同样的值是正确的（检查器里登记在 ALLOW_CJK）。 */
const LABEL_KEYS: Record<string, I18nKey> = {
  'zh-CN': 'localeSwitch.zhCN',
  'zh-TW': 'localeSwitch.zhTW',
  'en-US': 'localeSwitch.enUS',
  ja: 'localeSwitch.ja',
}

/* 四种语言塞不进原来的分段控件（按钮会挤成一条），换成下拉选择。
   `components/base/` 目前没有 select 基础件 —— 这里用最接近的形态：设计类的 `.input` 字段样式，
   可访问名走 `aria-label`（语言名本身就是可见文字）。切换经 store 的动作，组件不直接改字段。 */
export function LocaleSwitch() {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)

  return (
    <select
      className="input locale-switch"
      value={locale}
      aria-label={t('localeSwitch.label')}
      onChange={(event) => setLocale(event.target.value)}
    >
      {SUPPORTED_LOCALES.map((value) => (
        <option key={value} value={value}>
          {t(LABEL_KEYS[value] ?? 'localeSwitch.enUS')}
        </option>
      ))}
    </select>
  )
}
