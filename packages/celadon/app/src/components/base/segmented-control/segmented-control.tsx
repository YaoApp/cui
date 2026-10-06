import type { KeyboardEvent, ReactNode } from 'react'

export type SegmentedOption = {
  value: string
  label: ReactNode
  /** 段内左侧图标（可选） */
  icon?: ReactNode
  disabled?: boolean
}

export type SegmentedControlProps = {
  options: readonly SegmentedOption[]
  value: string
  onValueChange: (value: string) => void
  /** 组的可访问名 */
  'aria-label': string
  /** 反色档：用于深底或品牌底（设计类 `.seg--inverse`） */
  inverse?: boolean
  /** 整组禁用 */
  disabled?: boolean
  /** 静态态：把设计类的 `is-*` 写在选中段上，供清单页与设计稿并排展示多态 */
  state?: 'hover' | 'focus'
  className?: string
}

/* 分段控件的观感全部来自设计类：外壳 `.seg`、段内按钮、选中段 `.is-on`、反色档 `.seg--inverse`、
   图标槽 `.seg__icon`。组件只给行为与无障碍：互斥选择、`aria-pressed`，以及左右方向键在段间
   移动并即时选中（单选组的惯例）。 */
export function SegmentedControl({
  options,
  value,
  onValueChange,
  'aria-label': ariaLabel,
  inverse = false,
  disabled,
  state,
  className,
}: SegmentedControlProps) {
  const classes = ['seg', inverse ? 'seg--inverse' : null, className].filter(Boolean).join(' ')

  /* 方向键：在可用的段之间循环移动焦点，并立即把选择带过去；被禁用的段不参与。 */
  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
    const index = buttons.findIndex((button) => button === document.activeElement)
    if (index < 0) return
    const step = event.key === 'ArrowRight' ? 1 : buttons.length - 1
    const next = buttons[(index + step) % buttons.length]
    event.preventDefault()
    next.focus()
    const option = options.find((item) => item.value === next.dataset.value)
    if (option) onValueChange(option.value)
  }

  return (
    <span className={classes} role="group" aria-label={ariaLabel} onKeyDown={handleKeyDown}>
      {options.map((option) => {
        const selected = option.value === value
        const buttonClasses = [selected ? 'is-on' : null, selected && state ? `is-${state}` : null]
          .filter(Boolean)
          .join(' ')
        return (
          <button
            key={option.value}
            type="button"
            data-value={option.value}
            className={buttonClasses || undefined}
            aria-pressed={selected}
            disabled={disabled || option.disabled}
            onClick={() => onValueChange(option.value)}
          >
            {option.icon ? (
              <span className="seg__icon" aria-hidden="true">
                {option.icon}
              </span>
            ) : null}
            {option.label}
          </button>
        )
      })}
    </span>
  )
}
