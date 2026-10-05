import './input.less'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Field } from '@base-ui/react/field'
import { Input as BaseInput } from '@base-ui/react/input'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** 必给：标签与错误文本都用它拼 id，保证 htmlFor 与 aria-describedby 对得上。 */
  id: string
  label?: string
  hint?: string
  error?: string
  /** 左侧图标，对应原型里的 `.field__icon`。 */
  icon?: ReactNode
  /** 右侧附加内容（例如密码的可见性切换），对应原型里的 `.field__trail`。 */
  trailing?: ReactNode
  className?: string
}

/* 行为与无障碍（受控值 · 键盘 · 禁用 · 表单联动）交给 Base UI 的 Field 与 Input；
   视觉照设计：字段是 `.field` 容器加 `.input` 本体，左右两个槽位，颜色与间距一律取 token。
   用户名、邮箱与密码都用它，靠 `type` 与校验规则区分。 */
export function Input({ id, label, hint, error, icon, trailing, className, disabled, ...rest }: InputProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <Field.Root
      className={['field', className].filter(Boolean).join(' ')}
      disabled={disabled}
      invalid={Boolean(error)}
    >
      {label ? (
        <Field.Label className="field__label" htmlFor={id}>
          {label}
        </Field.Label>
      ) : null}
      <div className={['field__box', error ? 'is-error' : null].filter(Boolean).join(' ')}>
        {icon ? (
          <span className="field__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <BaseInput id={id} className="input" disabled={disabled} aria-describedby={describedBy} {...rest} />
        {trailing ? <span className="field__trail">{trailing}</span> : null}
      </div>
      {/* 消息位始终存在并占一行：没有消息时留空。
          否则同一行里有消息的字段比没消息的高，网格行高按最高的算，矮的格子底下会空出一段，
          看上去就像"间距比四周还大"（用户两次指出的那一处）。预留下方一行也是表单的常规做法。 */}
      <div className="field__message">
        {hint ? (
          <Field.Description id={hintId} className="field__hint">
            {hint}
          </Field.Description>
        ) : null}
        {error ? (
          /* 错误来自服务端，不是浏览器原生校验，所以显式用 match 让它渲染。
             颜色用设计类 .hint-error（危险色的文字档，--danger-ink），不在组件里另取名。 */
          <Field.Error id={errorId} className="hint-error" match={Boolean(error)}>
            {error}
          </Field.Error>
        ) : null}
      </div>
    </Field.Root>
  )
}
