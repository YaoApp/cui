import { contrastRatio, READABLE_MIN } from '@/platform/utils/readable-color'

/* **开发期**自检：按实际绘制的背景（页面底色 token）检查正文色的对比度。
   只在 DEV 跑，生产构建会被 `import.meta.env.DEV` 折掉；出问题只告警，不打断使用。 */
export function assertThemeContrast(): void {
  if (!import.meta.env?.DEV) return
  /* `--background-app` 由 `.celadon` 定义（挂在 body）—— 读 `<html>` 会拿到空值，自检就成了死代码。 */
  const target = document.body ?? document.documentElement
  const style = getComputedStyle(target)
  const bg = (style.getPropertyValue('--background-app') || '').trim()
  const fg = (style.getPropertyValue('--text-primary') || '').trim()
  if (!bg || !fg) return
  const ratio = contrastRatio(fg, bg)
  if (ratio < READABLE_MIN) {
    console.warn(
      `[theme] text ${fg} on ${bg} is ${ratio.toFixed(2)}:1 (< ${READABLE_MIN}:1)` +
        ' — use readableColorOn() or pick a token that reads.',
    )
  }
}
