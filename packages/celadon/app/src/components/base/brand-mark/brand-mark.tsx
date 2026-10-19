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
  /* 当前主标是 Ghost 主标的 SVG（863 × 995，等比放在方形槽里），浅色用渐变版，
     深色用 Cream 版；旧的机器人标仍留在 `design/reference/logo-previous.svg` 与 sprite 里，不删。 */
  if (name === 'brand-yao-agents') {
    return (
      <span
        className={`${classes} brand-mark--image`}
        style={{ width: size, height: size }}
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
      >
        <img
          className='brand-mark__img brand-mark__img--light'
          src={`${import.meta.env.BASE_URL}brand/yao-agents-ghost.svg`}
          alt=''
          aria-hidden='true'
          draggable={false}
        />
        <img
          className='brand-mark__img brand-mark__img--dark'
          src={`${import.meta.env.BASE_URL}brand/yao-agents-ghost-dark.svg`}
          alt=''
          aria-hidden='true'
          draggable={false}
        />
      </span>
    )
  }
  return (
    <svg
      className={classes}
      width={size}
      height={size}
      /* 与设计页 brandTile 的 svg 逐字一致 */
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
