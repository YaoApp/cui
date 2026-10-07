import { Icon, Select } from '@/components/base'
import { SUPPORTED_LOCALES, useTranslation, type I18nKey } from '@/platform/i18n'
import { useLocalePreference } from '@/platform/client'
import { resolvePreference } from '@/platform/i18n/locale.store'

export type LocaleSwitchProps = {
  /** 触发器形态：`plain` 纯文字档用于标题栏与工具条（默认），`field` 字段档用于需要边框的位置 */
  variant?: 'field' | 'plain'
  /** 触发器尺寸档，默认中档 */
  size?: 'small' | 'medium' | 'large'
}

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

/* 四种语言塞不进分段控件（按钮会挤成一条），用基础件下拉。
   行为与可访问性（role=combobox · 键盘 · 高亮）交给 components/base/select。
   形态照工具条上的做法：纯文字档，当前语言名在左，地球图标在**末尾**，关掉下拉指示器，
   由图标承担「这里可以换语言」的提示。切换经 store 的动作，组件不直接改字段。
   `system` 是默认且一等的选项：文案里带上当前解析出的语言名，用户显式选过语言后就不再跟随。 */
export function LocaleSwitch({ variant = 'plain', size = 'medium' }: LocaleSwitchProps) {
  const { t } = useTranslation()
  const { preference, setLocale } = useLocalePreference()

  const options = [
    {
      value: 'system',
      label: t('localeSwitch.system', { locale: t(endonymKey(resolvePreference('system'))) }),
    },
    ...SUPPORTED_LOCALES.map((value) => ({ value, label: t(endonymKey(value)) })),
  ]

  return (
    <Select
      className="locale-switch"
      aria-label={t('localeSwitch.label')}
      value={preference}
      onValueChange={setLocale}
      options={options}
      variant={variant}
      size={size}
      icon={<Icon name="i-globe" />}
      iconPosition="end"
      indicator={false}
    />
  )
}
