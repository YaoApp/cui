import './button.less'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { Label } from './parts/label'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'soft' | 'ghost' | 'inverse'
  size?: 'medium' | 'small'
  /** 整宽：原型里登录页的主操作 Next 就是整宽反色 */
  block?: boolean
  /** 加载中：禁用交互并显示指示器，对应原型的 `.is-loading` */
  loading?: boolean
  children: ReactNode
}

/* 视觉来自 design/tokens.less 里已定稿的 .btn-* 类（单一来源），组件不重新发明样式；
   button.less 只管设计类没有的：布局、尺寸档、反色档与加载态。
   反色档对应原型 Next 按钮的暗底，取值仍是 token，不写字面色值。 */
const VARIANT_CLASS = {
  solid: 'btn-primary is-solid',
  soft: 'btn-primary',
  ghost: 'btn-ghost',
  inverse: 'button--inverse',
} as const

/* 行为与无障碍（type=button · disabled · 键盘）交给 Base UI 的 Button —— 它渲染的是原生
   <button>，只把状态以 data-* 暴露给样式，没有自带主题系统。视觉仍是上面的设计类。 */
export function Button({
  variant = 'soft',
  size = 'medium',
  block = false,
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    'button',
    `button--${size}`,
    VARIANT_CLASS[variant],
    block ? 'button--block' : null,
    loading ? 'is-loading' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <BaseButton className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      <Label>{children}</Label>
    </BaseButton>
  )
}
