import './icon.less'
import type { IconId } from '@/platform/icons'

/** 尺寸档（见 architecture/10-icons.md §1）：产品默认 16，小档按比例变细。 */
export type IconSize = 14 | 16 | 18 | 20 | 24

export type IconProps = {
  /** 与 `design/icons/manifest.json` 一一对应；写错名字由类型拦下 */
  name: IconId
  size?: IconSize
  /** 有语义时传它（做成 role="img" + 可访问名）；纯装饰不传 */
  label?: string
  className?: string
}

export function Icon({ name, size = 16, label, className }: IconProps) {
  const classes = ['icon', className].filter(Boolean).join(' ')
  return (
    <svg
      className={classes}
      width={size}
      height={size}
      /* **与设计页 design/icons.html 的 icon() 逐字一致**：缩放到目标尺寸、描边固定 2（24 网格）。 */
      viewBox="0 0 24 24"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <use href={`#${name}`} />
    </svg>
  )
}
