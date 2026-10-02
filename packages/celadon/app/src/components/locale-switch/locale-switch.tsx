import { Button } from '@/components/base/button'
import { SUPPORTED_LOCALES, useTranslation } from '@/platform/i18n'
import { useLocaleStore } from '@/platform/i18n/locale.store'

/* 语言名用**本语言自己的写法**（endonym），所以不参与翻译；
   其余语言包里出现同样的值是正确的（检查器里登记在 ALLOW_CJK）。 */
const LABEL_KEYS: Record<string, string> = {
  'zh-CN': 'localeSwitch.zhCN',
  'en-US': 'localeSwitch.enUS',
}

/* 分段控件：一组互斥语言，选中项用设计类 `.seg button.is-on` 标出来。
   按钮一律走基础件 `Button`，可访问名来自可见文字；切换经 store 的动作，组件不直接改字段。 */
export function LocaleSwitch() {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)

  return (
    <span className="seg locale-switch" role="group" aria-label={t('localeSwitch.label')}>
      {SUPPORTED_LOCALES.map((value) => (
        <Button
          key={value}
          variant="ghost"
          size="small"
          className={locale === value ? 'is-on' : undefined}
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
        >
          {t(LABEL_KEYS[value] ?? value)}
        </Button>
      ))}
    </span>
  )
}
