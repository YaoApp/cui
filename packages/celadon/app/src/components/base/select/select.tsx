import './select.less'
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import { Icon } from '@/components/base/icon'

export type SelectOption = {
  /** 选项值；`null` 是**清除项**（上游的空值项），选中它即取消选择，触发器回到占位文字。 */
  value: string | null
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

type SelectBaseProps = {
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
  /** 一个选项都没有时弹层里的说明文字。组件不写文案，由调用方给四语。 */
  emptyText?: ReactNode
  /** 触发器左侧图标，与输入框的图标槽同位置同颜色 */
  icon?: ReactNode
  /** 错误态：边框与聚焦环走危险色，与输入框同一套规则（设计类 `.is-error`）。 */
  error?: boolean
  disabled?: boolean
  /** 静态态：把设计类的 `is-*` 写在触发器上，供清单页与设计稿并排展示多态。 */
  state?: 'hover' | 'focus'
  /** 顶部加筛选输入框，按选项标签文本过滤。标签不是字符串时按它的文本内容比较。 */
  searchable?: boolean
  /** 筛选输入框的可访问名与占位文字，由调用方给四语文案 */
  searchLabel?: string
  /** 筛选没有命中任何选项时的说明文字 */
  noMatchText?: ReactNode
  /** 自定义过滤规则；不给则用「标签文本不区分大小写包含查询」 */
  filterOption?: (option: SelectOption, query: string) => boolean
  /** 形态：`field` 是字段外观（默认）；`plain` 是纯文字档，不画字段底与边框，用于标题栏与工具条（设计类 `.input--plain`）。 */
  variant?: 'field' | 'plain'
  /** 触发器图标的位置：`start` 在值之前，`end` 在值之后。纯文字档常放在末尾，由图标承担提示。 */
  iconPosition?: 'start' | 'end'
  /** 是否显示右侧的下拉指示器。纯文字档配末尾图标时可关掉，避免指示器与图标重复。 */
  indicator?: boolean
  /** 反色档：用于深底或品牌底（设计类 `.input--inverse`），与按钮的反色档同一处理。 */
  inverse?: boolean
  /** 是否必须选一个值才能提交（上游同名属性，只管表单校验，与「能否清除」无关）。
      单选再次点选已选中项即取消；给一个 `value: null` 的空值项同样表示清除选中。 */
  required?: boolean
  className?: string
}

/** 单选：值是字符串；多选：值是字符串数组。两边都从 `value` 与 `onValueChange` 看类型。 */
export type SelectProps =
  | (SelectBaseProps & { multiple?: false; value: string; onValueChange: (value: string) => void })
  | (SelectBaseProps & { multiple: true; value: readonly string[]; onValueChange: (value: string[]) => void })

/* 行为与无障碍（role=combobox · 键盘 · 高亮 · 受控值 · 多选）交给 Base UI 的 Select；视觉全部走设计类：
   触发器用 `.input`，与输入框同一套字段观感、状态与尺寸；弹层用 `.select-popup` 与 `.select-list`，
   分组标题用 `.select-group-label`，选项用 `.select-item` 及其内部槽位，滚动箭头用 `.select-arrow`；
   指示器、选中标记与箭头用**我们自己的图标**，不使用上游自带的字形。
   Base UI 不参与配色、没有主题系统，它只用 data-* 暴露状态、用 CSS 变量暴露几何。 */
export function Select(props: SelectProps) {
  const {
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
    searchable = false,
    searchLabel,
    noMatchText,
    filterOption,
    variant = 'field',
    iconPosition = 'start',
    indicator = true,
    inverse = false,
    required = false,
    className,
  } = props
  const [query, setQuery] = useState('')

  const classes = [
    'input',
    'select__trigger',
    /* 触发器档：点击不加焦点环，只有键盘聚焦才加（与按钮同一规则，见 tokens.less 的 .input--trigger） */
    'input--trigger',
    variant === 'plain' ? 'input--plain' : null,
    inverse ? 'input--inverse' : null,
    size === 'small' ? 'input--small' : null,
    size === 'large' ? 'input--large' : null,
    error ? 'is-error' : null,
    state ? `is-${state}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const flatOptions = groups ? groups.flatMap((group) => group.options) : options
  /* Base UI 用 items 解析选中项要显示的文字：这里始终传**未过滤**的全部选项，
     否则被筛掉的已选项在触发器上会显示成原值。分组时传分组结构。 */
  const items = groups
    ? groups.map((group) => ({
        label: group.label,
        items: group.options.map((option) => ({ label: option.label, value: option.value })),
      }))
    : flatOptions.map((option) => ({ label: option.label, value: option.value }))

  const trimmed = query.trim()
  const matches = (option: SelectOption) => {
    if (!searchable || trimmed === '') return true
    if (filterOption) return filterOption(option, trimmed)
    const text = typeof option.label === 'string' ? option.label : String(option.label ?? '')
    return text.toLowerCase().includes(trimmed.toLowerCase())
  }
  const shownGroups = groups
    ?.map((group) => ({ ...group, options: group.options.filter(matches) }))
    .filter((group) => group.options.length > 0)
  const shownOptions = groups ? [] : flatOptions.filter(matches)
  const shownCount = groups ? (shownGroups?.reduce((total, group) => total + group.options.length, 0) ?? 0) : shownOptions.length

  /* 行序号写成自定义属性：选项依次进入的延迟由它推出（见 tokens.less 的 .select-item 动画） */
  const renderItem = (option: SelectOption, index: number) => (
    <BaseSelect.Item
      key={String(option.value)}
      value={option.value}
      disabled={option.disabled}
      className="select-item"
      style={{ '--select-item-index': index } as CSSProperties}
    >
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

  const content = (
    <>
      <BaseSelect.Trigger id={id} className={classes} aria-label={ariaLabel}>
        {icon && iconPosition === 'start' ? (
          <span className="select__lead" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <BaseSelect.Value className="select__value" placeholder={placeholder} />
        {icon && iconPosition === 'end' ? (
          <span className="select__lead" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {indicator ? <Icon name="i-down" size={16} className="select-icon" /> : null}
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        {/* 间距归排布者：弹层与触发器的 4px 间隙由定位器给，组件样式里不带外边距（layout.md 第 3 节） */}
        <BaseSelect.Positioner className="select__positioner" alignItemWithTrigger={false} sideOffset={4}>
          <BaseSelect.Popup className={['select-popup', searchable ? 'select-popup--search' : null].filter(Boolean).join(' ')}>
            {searchable ? (
              <div className="select-search">
                <Icon name="i-search" size={16} className="select-search__icon" />
                <input
                  className="input input--small select-search__input"
                  value={query}
                  aria-label={searchLabel}
                  onChange={(event) => setQuery(event.target.value)}
                  /* 打字与删除不该被当成选项导航；上下键、回车与 Escape 放行，
                     因此从输入框能直接走进列表，也能用 Escape 关掉弹层 */
                  onKeyDown={(event) => {
                    if (
                      event.key !== 'ArrowDown' &&
                      event.key !== 'ArrowUp' &&
                      event.key !== 'Enter' &&
                      event.key !== 'Escape'
                    ) {
                      event.stopPropagation()
                    }
                  }}
                />
              </div>
            ) : null}
            {shownCount === 0 ? (
              <div className="select-popup__empty">{flatOptions.length === 0 ? emptyText : noMatchText}</div>
            ) : (
              <>
                <BaseSelect.ScrollUpArrow className="select-arrow select-arrow--up">
                  <Icon name="i-up" size={16} />
                </BaseSelect.ScrollUpArrow>
                <BaseSelect.List className="select-list">
                  {groups
                    ? shownGroups?.map((group, index) => (
                        <BaseSelect.Group key={index}>
                          <BaseSelect.GroupLabel className="select-group-label">{group.label}</BaseSelect.GroupLabel>
                          {group.options.map(renderItem)}
                        </BaseSelect.Group>
                      ))
                    : shownOptions.map(renderItem)}
                </BaseSelect.List>
                <BaseSelect.ScrollDownArrow className="select-arrow">
                  <Icon name="i-down" size={16} />
                </BaseSelect.ScrollDownArrow>
              </>
            )}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </>
  )

  /* 打开与关闭时清掉筛选词：下次打开从完整列表开始 */
  const handleOpenChange = (open: boolean) => {
    if (!open) setQuery('')
  }

  if (props.multiple) {
    const { value, onValueChange } = props
    return (
      <BaseSelect.Root
        multiple
        value={value as string[]}
        onValueChange={(next) => onValueChange((next ?? []) as string[])}
        items={items}
        disabled={disabled}
        onOpenChange={handleOpenChange}
      >
        {content}
      </BaseSelect.Root>
    )
  }

  const { value, onValueChange } = props
  return (
    <BaseSelect.Root
      value={value as string}
      /* 单选：再次点选已选中项即取消，回传空串；空值项被选中时上游回传 null，也归一成空串。 */
      onValueChange={(next) => {
        if (next === value) {
          onValueChange('')
          return
        }
        onValueChange((next ?? '') as string)
      }}
      items={items}
      disabled={disabled}
      required={required}
      onOpenChange={handleOpenChange}
    >
      {content}
    </BaseSelect.Root>
  )
}
