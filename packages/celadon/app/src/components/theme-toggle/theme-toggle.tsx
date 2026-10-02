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
   视觉用设计系统里的 .seg（分段控件，选中项 .is-on）—— 这是设计页里主题切换件的形态，
   不是自造的样式，也不是浏览器的原生按钮长相。文案走语言包，两个主题名不写死在组件里。 */
export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const { t } = useTranslation()

  return (
    <span className="seg theme-toggle" role="group" aria-label={t('themeToggle.label')}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={theme === option.value ? 'is-on' : undefined}
          aria-pressed={theme === option.value}
          onClick={() => onChange(option.value)}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </span>
  )
}
