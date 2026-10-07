import { Button, Icon } from '@/components/base'
import { useTranslation, type I18nKey } from '@/platform/i18n'
import type { Theme } from '@/platform/theme/theme.store'

export type ThemeToggleProps = {
  /** 当前生效的主题 */
  theme: Theme
  /** 点击后切到的主题，始终与 `theme` 相反 */
  onSelect: (theme: Theme) => void
  /** 按钮尺寸档，默认中档（图标 16，大档 20） */
  size?: 'small' | 'medium' | 'large'
}

/* 图标表达的是**点击之后**会变成什么，所以与当前状态相反：当前浅色显示月亮，当前深色显示太阳。
   可访问名同样是动作（「切换到深色」），读屏听到的是按下去会发生什么，而不是现在是什么状态。
   外观取基础件 Button 的纯文字档：无底无框，悬停给浅底，只有键盘聚焦时画环。
   状态与写入归调用方（`useThemePreference`），组件只报下一步该切到哪一档。 */
export function ThemeToggle({ theme, onSelect, size = 'medium' }: ThemeToggleProps) {
  const { t } = useTranslation()
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  const action: I18nKey = next === 'dark' ? 'themeToggle.switchToDark' : 'themeToggle.switchToLight'

  return (
    <Button
      className="theme-toggle"
      variant="plain"
      size={size}
      iconOnly
      aria-label={t(action)}
      onClick={() => onSelect(next)}
    >
      <Icon name={next === 'dark' ? 'i-moon' : 'i-sun'} />
    </Button>
  )
}
