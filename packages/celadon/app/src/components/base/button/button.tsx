import './button.less'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { Spinner } from '@/components/base/spinner'
import { Label } from './parts/label'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'soft' | 'ghost' | 'warn' | 'success' | 'danger' | 'inverse'
  size?: 'small' | 'medium' | 'large'
  /** 形态：常规圆角（`--radius-small`，规范 F3 给按钮与输入框的那一档）与全圆角胶囊（`--radius-pill`）。
      整宽档只用于常规圆角的主操作，胶囊形态用于工具栏、标签式操作与紧凑排布。 */
  shape?: 'rounded' | 'pill'
  /** 整宽：原型里登录页的主操作 Next 就是整宽反色 */
  block?: boolean
  /** 加载中：禁用交互并显示指示器，对应原型的 `.is-loading` */
  loading?: boolean
  /** 静态态：把设计类的 `is-*` 直接写在按钮上，供清单页与设计稿并排展示同一个按钮的多种状态。
      真实交互仍由伪类驱动，这里只解决"一张图上要同时看到多态"的问题。 */
  state?: 'hover' | 'active' | 'focus'
  children: ReactNode
}

/* 视觉来自 design/tokens.less 里已定稿的 .btn-* 类（单一来源），组件不重新发明样式；
   button.less 只管设计类没有的：布局、尺寸档、反色档与加载态。
   反色档对应原型 Next 按钮的暗底，取值仍是 token，不写字面色值。 */
const VARIANT_CLASS = {
  solid: 'btn-primary is-solid',
  soft: 'btn-primary',
  ghost: 'btn-ghost',
  warn: 'btn-warn',
  success: 'btn-success',
  danger: 'btn-danger',
  inverse: 'button--inverse',
} as const

/* 行为与无障碍（type=button · disabled · 键盘）交给 Base UI 的 Button —— 它渲染的是原生
   <button>，只把状态以 data-* 暴露给样式，没有自带主题系统。视觉仍是上面的设计类。 */
export function Button({
  variant = 'soft',
  size = 'medium',
  shape = 'rounded',
  block = false,
  loading = false,
  state,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    'button',
    `button--${size}`,
    shape === 'pill' ? 'button--pill' : null,
    VARIANT_CLASS[variant],
    block ? 'button--block' : null,
    loading ? 'is-loading' : null,
    state ? `is-${state}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <BaseButton className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner /> : null}
      <Label>{children}</Label>
    </BaseButton>
  )
}
