import './theme-toggle.less'
import { Button } from '@/components/base/button'
import { useTranslation, type I18nKey } from '@/platform/i18n'
import type { Theme } from '@/platform/theme/theme.store'

export type ThemeToggleProps = {
  theme: Theme
  onChange: (theme: Theme) => void
}

const OPTIONS: { value: Theme; labelKey: I18nKey }[] = [
  { value: 'light', labelKey: 'themeToggle.toLight' },
  { value: 'dark', labelKey: 'themeToggle.toDark' },
]

/* 纯组件：状态从 props 来，不知道主题存在哪儿、也不知道怎么应用。
   两个选项是基础件 Button（行为与无障碍交给 Base UI），但外观仍由设计系统的 .seg 决定 ——
   分段控件里选中项是 .is-on，所以这里传 `variant="ghost"`（.seg 会盖掉按钮自己的底色）。
   文案走语言包，两个主题名不写死在组件里。 */
export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const { t } = useTranslation()

  return (
    <span className="seg theme-toggle" role="group" aria-label={t('themeToggle.label')}>
      {OPTIONS.map((option) => {
        const selected = theme === option.value
        return (
          <Button
            key={option.value}
            variant="ghost"
            size="small"
            className={selected ? 'is-on' : undefined}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {t(option.labelKey)}
          </Button>
        )
      })}
    </span>
  )
}
