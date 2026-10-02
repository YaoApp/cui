import type { Theme } from '@/platform/theme/theme.store'

export type ThemeToggleProps = {
  theme: Theme
  onChange: (theme: Theme) => void
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '暗色' },
]

/* 纯组件：状态从 props 来，不知道主题存在哪儿、也不知道怎么应用。
   视觉用设计系统里的 .seg（分段控件，选中项 .is-on）—— 这是设计页里主题切换件的形态，
   不是自造的样式，也不是浏览器的原生按钮长相。 */
export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  return (
    <span className="seg theme-toggle" role="group" aria-label="主题">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={theme === option.value ? 'is-on' : undefined}
          aria-pressed={theme === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </span>
  )
}
