import './select.less'
import type { ReactNode } from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import { Icon } from '@/components/base/icon'

export type SelectOption = {
  value: string
  label: ReactNode
  /** 选项左侧图标 */
  icon?: ReactNode
  /** 第二行说明。给了就是两行选项（异形布局），行高按内容长高，不受单行档位限制。 */
  description?: ReactNode
  /** 右侧附加内容，例如徽标或快捷键 */
  trailing?: ReactNode
  disabled?: boolean
}

export type SelectGroup = {
  /** 分组标题，显示在组内选项之上 */
  label: ReactNode
  options: readonly SelectOption[]
}

export type SelectProps = {
  /** 受控值。`system` 之类的哨兵值由调用方定义，基础件不解释。 */
  value: string
  onValueChange: (value: string) => void
  /** 平铺选项。与 `groups` 二选一，给了 `groups` 就以它为准。 */
  options?: readonly SelectOption[]
  /** 分组选项。弹层里按组渲染，每组带一个组标题。 */
  groups?: readonly SelectGroup[]
  /** 可访问名，落在触发器上（Base UI 的 Trigger 渲染为 role=combobox 的按钮）。 */
  'aria-label': string
  id?: string
  /** 尺寸：小 24 · 中与输入框同高（约 34）· 大 40。尺寸档与圆角都由设计类 `.input--*` 给。 */
  size?: 'small' | 'medium' | 'large'
  /** 无选中项时显示的占位文字；一个选项都没有时也显示它。 */
  placeholder?: ReactNode
  /** 没有选项时弹层里的说明文字。组件不写文案，由调用方给四语文案。 */
  emptyText?: ReactNode
  /** 触发器左侧图标，与输入框的图标槽同位置同颜色 */
  icon?: ReactNode
  /** 错误态：边框与聚焦环走危险色，与输入框同一套规则（设计类 `.is-error`）。 */
  error?: boolean
  disabled?: boolean
  /** 静态态：把设计类的 `is-*` 写在触发器上，供清单页与设计稿并排展示多态。 */
  state?: 'hover' | 'focus'
  className?: string
}

/* 行为与无障碍（role=combobox · 键盘 · 高亮 · 受控值）交给 Base UI 的 Select；视觉全部走设计类：
   触发器用 `.input`，与输入框同一套字段观感、状态与尺寸；弹层用 `.select-popup` 与 `.select-list`，
   分组标题用 `.select-group-label`，选项用 `.select-item` 及其内部槽位；
   指示器与选中标记用**我们自己的图标**，不再使用上游自带的字形。
   Base UI 不参与配色、没有主题系统，它只用 data-* 暴露状态、用 CSS 变量暴露几何。 */
export function Select({
  value,
  onValueChange,
  options = [],
  groups,
  'aria-label': ariaLabel,
  id,
  size = 'medium',
  placeholder,
  emptyText,
  icon,
  error = false,
  disabled,
  state,
  className,
}: SelectProps) {
  const classes = [
    'input',
    'select__trigger',
    size === 'small' ? 'input--small' : null,
    size === 'large' ? 'input--large' : null,
    error ? 'is-error' : null,
    state ? `is-${state}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const flatOptions = groups ? groups.flatMap((group) => group.options) : options
  /* Base UI 用 items 解析选中项要显示的文字：分组时传分组结构，平铺时传平铺列表。 */
  const items = groups
    ? groups.map((group) => ({
        label: group.label,
        items: group.options.map((option) => ({ label: option.label, value: option.value })),
      }))
    : flatOptions.map((option) => ({ label: option.label, value: option.value }))

  const renderItem = (option: SelectOption) => (
    <BaseSelect.Item key={option.value} value={option.value} disabled={option.disabled} className="select-item">
      {option.icon ? (
        <span className="select-item__icon" aria-hidden="true">
          {option.icon}
        </span>
      ) : null}
      <span className="select-item__body">
        <BaseSelect.ItemText className="select-item__label">{option.label}</BaseSelect.ItemText>
        {option.description ? <span className="select-item__description">{option.description}</span> : null}
      </span>
      {option.trailing ? <span className="select-item__trailing">{option.trailing}</span> : null}
      <BaseSelect.ItemIndicator className="select-item__check">
        <Icon name="i-check" size={16} />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  )

  return (
    <BaseSelect.Root
      value={value}
      /* Base UI 在无选中项时会回传 null；这里的每个 option 都有值，null 不表达任何选择，忽略。 */
      onValueChange={(next) => {
        if (next != null) onValueChange(next)
      }}
      items={items}
      disabled={disabled}
    >
      <BaseSelect.Trigger id={id} className={classes} aria-label={ariaLabel}>
        {icon ? (
          <span className="select__lead" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <BaseSelect.Value className="select__value" placeholder={placeholder} />
        <Icon name="i-down" size={16} className="select-icon" />
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        {/* 间距归排布者：弹层与触发器的 4px 间隙由定位器给，组件样式里不带外边距（layout.md 第 3 节） */}
        <BaseSelect.Positioner className="select__positioner" alignItemWithTrigger={false} sideOffset={4}>
          <BaseSelect.Popup className="select-popup">
            {flatOptions.length === 0 ? (
              <div className="select-popup__empty">{emptyText}</div>
            ) : (
              <BaseSelect.List className="select-list">
                {groups
                  ? groups.map((group, index) => (
                      <BaseSelect.Group key={index}>
                        <BaseSelect.GroupLabel className="select-group-label">{group.label}</BaseSelect.GroupLabel>
                        {group.options.map(renderItem)}
                      </BaseSelect.Group>
                    ))
                  : flatOptions.map(renderItem)}
              </BaseSelect.List>
            )}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
