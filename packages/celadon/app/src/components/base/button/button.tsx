import './button.less'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { Label } from './parts/label'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'soft' | 'ghost'
  size?: 'medium' | 'small'
  children: ReactNode
}

/* 视觉来自 design/tokens.less 里已定稿的 .btn-* 类（单一来源），组件不重新发明样式；
   button.less 只管设计类没有的：布局与尺寸档。 */
const VARIANT_CLASS = {
  solid: 'btn-primary is-solid',
  soft: 'btn-primary',
  ghost: 'btn-ghost',
} as const

/* 行为与无障碍（type=button · disabled · 键盘）交给 Base UI 的 Button —— 它渲染的是原生
   <button>，只把状态以 data-* 暴露给样式，没有自带主题系统。视觉仍是上面的设计类。 */
export function Button({ variant = 'soft', size = 'medium', className, children, ...rest }: ButtonProps) {
  const classes = ['button', `button--${size}`, VARIANT_CLASS[variant], className].filter(Boolean).join(' ')
  return (
    <BaseButton className={classes} {...rest}>
      <Label>{children}</Label>
    </BaseButton>
  )
}
