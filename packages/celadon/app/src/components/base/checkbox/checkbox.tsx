import './checkbox.less'
import type { ReactNode } from 'react'
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Icon } from '@/components/base/icon'

export type CheckboxProps = {
  /** 必给：标签的 htmlFor 与消息的 id 都按它拼，与 Input 一致。 */
  id: string
  /** 标签；点标签等于点方框（htmlFor 关联到上游渲染的原生控件）。 */
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** 不确定态：既非选中也非未选，用于"部分选中"。底与选中同一处理，标记换成一条横杠。 */
  indeterminate?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  value?: string
  /** 方框尺寸：中档 16 · 大档 20（都由间距刻度推出）。 */
  size?: 'medium' | 'large'
  /** 静态态：把设计类的 `is-*` 写在**整行容器**上，供清单页并排展示多态。
      悬停画的是整行的浅底，所以状态类落在整行而不是方框上；选中、不确定、禁用、只读、错误都用真实属性与真实取值。 */
  state?: 'hover' | 'focus' | 'error' | 'loading'
  className?: string
}

/* 行为与无障碍（键盘 · 可访问角色 · 隐藏的原生控件 · required 与 readOnly · 表单联动）交给上游的 Checkbox；
   视觉照设计：方框加勾，**选中底取反色族**（`--background-inverse` 与 `--text-inverse`），不取品牌色。
   选中是持续状态，要像"已填写"那样自己成立，而不是交互中的临时高亮；品牌色留给悬停与聚焦这类临时反馈。
   未选中的方框边界取达标档 `--border-control-strong`：复选框属 1.4.11 覆盖的控件，边界要 ≥ 3:1。
   类全部自包含，不借输入框的类：字段外观只是同一批 token，结构与行为各写各的（见 checkbox.less）。 */
export function Checkbox({
  id,
  label,
  hint,
  error,
  checked,
  defaultChecked,
  onCheckedChange,
  indeterminate,
  disabled,
  readOnly,
  required,
  name,
  value,
  size = 'medium',
  state,
  className,
}: CheckboxProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div
      className={[
        'checkbox',
        `checkbox--${size}`,
        error ? 'is-error' : null,
        state ? `is-${state}` : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="checkbox__row">
        <BaseCheckbox.Root
          id={id}
          className="checkbox__box"
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          indeterminate={indeterminate}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          name={name}
          value={value}
          aria-describedby={describedBy}
          aria-busy={state === 'loading' || undefined}
        >
          {/* 勾与横杠都是装饰：选中与否由控件的可访问状态表达，标记不进无障碍树 */}
          <BaseCheckbox.Indicator className="checkbox__mark">
            {indeterminate ? (
              <span className="checkbox__dash" />
            ) : (
              <Icon name="i-check" size={size === 'large' ? 16 : 14} />
            )}
          </BaseCheckbox.Indicator>
        </BaseCheckbox.Root>
        {label ? (
          /* 标签带 `-label` 的 id：上游把 `aria-labelledby="{id}-label"` 写在方框上，标签没有这个 id 就念不出名字。
             `htmlFor` 同时关联到上游渲染的原生控件，点标签等于点控件。 */
          <label className="checkbox__label" id={`${id}-label`} htmlFor={id}>
            {label}
          </label>
        ) : null}
      </div>
      {hint || error ? (
        <div className="checkbox__message">
          {hint ? (
            <span id={hintId} className="checkbox__hint">
              {hint}
            </span>
          ) : null}
          {error ? (
            <span id={errorId} className="checkbox__error">
              {error}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
