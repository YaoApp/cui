import './select.less'
import type { ReactNode } from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'

export type SelectOption = {
  value: string
  label: ReactNode
  disabled?: boolean
}

export type SelectProps = {
  /** 受控值。`system` 之类的哨兵值由调用方定义，基础件不解释。 */
  value: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  /** 可访问名，落在触发器上（Base UI 的 Trigger 渲染为 role=combobox 的按钮）。 */
  'aria-label': string
  id?: string
  disabled?: boolean
  className?: string
}

/* 行为与无障碍（role=combobox · 键盘 · 高亮 · 受控值）交给 Base UI 的 Select；
   视觉照旧：触发器沿用设计类 `.input`（和原来裸 <select className="input"> 同一套字段观感），
   弹层是 portal 出来的自定义结构，设计系统没有对应类，select.less 里只按 token 补它。
   Base UI 不参与配色、没有主题系统 —— 它只用 data-* 暴露状态、用 CSS 变量暴露几何。 */
export function Select({ value, onValueChange, options, 'aria-label': ariaLabel, id, disabled, className }: SelectProps) {
  return (
    <BaseSelect.Root
      value={value}
      /* Base UI 在无选中项时会回传 null；这里的每个 option 都有值，null 不表达任何选择，忽略。 */
      onValueChange={(next) => {
        if (next != null) onValueChange(next)
      }}
      items={options}
      disabled={disabled}
    >
      <BaseSelect.Trigger
        id={id}
        className={['input', 'select__trigger', className].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
      >
        <BaseSelect.Value />
        {/* Base UI 自带的指示器：aria-hidden，内容 ▼ —— 用它就不必自绘图标（见 architecture/10）。 */}
        <BaseSelect.Icon className="select__indicator" />
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="select__positioner" alignItemWithTrigger={false}>
          <BaseSelect.Popup className="select__popup">
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="select__item"
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
