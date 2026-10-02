/* 按**实际绘制的背景**算对比度，并给出可读替代色（见 architecture/09-theme.md §6）。
   纯函数：不碰 DOM，不读 token —— 调用方把已经算出来的颜色传进来。 */

/** 解析 `#rgb` / `#rrggbb` / `rgb(r g b)` / `rgb(r, g, b)`；认不出来时返回 null。 */
export function parseColor(input: string): [number, number, number] | null {
  const s = input.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s)
  if (hex) {
    const h = hex[1]
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ]
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(s)
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null
}

const channel = (c: number): number => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/** WCAG 相对亮度。认不出的颜色按黑处理（对比度算出来会很极端，容易被发现）。 */
export function relativeLuminance(color: string): number {
  const rgb = parseColor(color)
  if (!rgb) return 0
  const [r, g, b] = rgb.map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 对比度（1–21）。同色为 1。 */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** 正文可读的阈值（WCAG AA）。大字号可放宽到 3。 */
export const READABLE_MIN = 4.5

/** 前景色在给定背景上够不够读？不够就换成黑或白里更可读的那个。 */
export function readableColorOn(
  foreground: string,
  background: string,
  min: number = READABLE_MIN,
): string {
  if (contrastRatio(foreground, background) >= min) return foreground
  return contrastRatio('#000000', background) >= contrastRatio('#ffffff', background)
    ? '#000000'
    : '#ffffff'
}
