import './button.less'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
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

export function Button({ variant = 'soft', size = 'medium', className, children, ...rest }: ButtonProps) {
  const classes = ['button', `button--${size}`, VARIANT_CLASS[variant], className].filter(Boolean).join(' ')
  return (
    <button type="button" className={classes} {...rest}>
      <Label>{children}</Label>
    </button>
  )
}
