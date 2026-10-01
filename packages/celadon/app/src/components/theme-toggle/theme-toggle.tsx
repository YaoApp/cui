import type { Theme } from '@/platform/theme/theme-store'
import { Button } from '@/components/base/button'

export type ThemeToggleProps = {
  theme: Theme
  onToggle: () => void
}

/* 纯组件：状态从 props 来，不知道主题存在哪儿、也不知道怎么应用 ——
   这样它能被任何 feature 用，也能在单测里独立验。视觉全走 base/button（不新增 .less）。 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const next = theme === 'dark' ? '浅色' : '深色'
  return (
    <Button variant="ghost" size="small" aria-pressed={theme === 'dark'} onClick={onToggle}>
      切到{next}
    </Button>
  )
}
