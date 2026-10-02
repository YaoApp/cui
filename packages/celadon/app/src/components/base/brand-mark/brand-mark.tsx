import './brand-mark.less'
import type { IconId } from '@/platform/icons'

/** 品牌标识的 id（`brand-` 前缀）。与界面图标**分开**：见 design/icons.md §1。 */
export type BrandId = Extract<IconId, `brand-${string}`>

export type BrandMarkProps = {
  /** 只整体使用；**最小 16px**（再小用 App Icon） */
  name: BrandId
  size?: number
  /** 无障碍名；品牌标识是有含义的，不传则按装饰处理 */
  label?: string
  className?: string
}

export function BrandMark({ name, size = 24, label, className }: BrandMarkProps) {
  const classes = ['brand-mark', className].filter(Boolean).join(' ')
  return (
    <svg
      className={classes}
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <use href={`#${name}`} />
    </svg>
  )
}
