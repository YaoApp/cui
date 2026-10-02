import { SUPPORTED_LOCALES, useTranslation, type I18nKey } from '@/platform/i18n'
import { resolvePreference, useLocaleStore } from '@/platform/i18n/locale.store'

/* 语言名用**本语言自己的写法**（endonym），所以不参与翻译；
   其余语言包里出现同样的值是正确的（检查器里登记在 ALLOW_CJK）。 */
const LABEL_KEYS: Record<string, I18nKey> = {
  'zh-CN': 'localeSwitch.zhCN',
  'zh-TW': 'localeSwitch.zhTW',
  'en-US': 'localeSwitch.enUS',
  ja: 'localeSwitch.ja',
}

/** 未知语言退回英文名（新增语言但还没取 endonym 时兜底）。 */
const endonymKey = (locale: string): I18nKey => LABEL_KEYS[locale] ?? 'localeSwitch.enUS'

/* 四种语言塞不进原来的分段控件（按钮会挤成一条），换成下拉选择。
   `components/base/` 目前没有 select 基础件 —— 这里用最接近的形态：设计类的 `.input` 字段样式，
   可访问名走 `aria-label`（语言名本身就是可见文字）。切换经 store 的动作，组件不直接改字段。
   `system` 是默认且一等的选项：文案里带上当前解析出的语言名，用户显式选过语言后就不再跟随。 */
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
      <option value="system">
        {t('localeSwitch.system', { locale: t(endonymKey(resolvePreference('system'))) })}
      </option>
      {SUPPORTED_LOCALES.map((value) => (
        <option key={value} value={value}>
          {t(endonymKey(value))}
        </option>
      ))}
    </select>
  )
}
