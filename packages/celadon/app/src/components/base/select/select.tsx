import './select.less'
import { useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Select as BaseSelect } from '@base-ui/react/select'
import { Icon } from '@/components/base/icon'
import { Input } from '@/components/base/input'

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
  /** 尺寸：小 24 · 中 32 · 大 40，与输入框、按钮、复选框同一条梯子。整高由 `min-block-size` 定，圆角按档位取同名 token。 */
  size?: 'small' | 'medium' | 'large'
  /** 无选中项时显示的占位文字；一个选项都没有时也显示它。 */
  placeholder?: ReactNode
  /** 一个选项都没有时弹层里的说明文字。组件不写文案，由调用方给四语。 */
  emptyText?: ReactNode
  /** 触发器图标，与输入框的图标槽同位置同颜色。
      不传时取当前选中项的 `option.icon`（在 `options` 与 `groups` 里按 `value` 找）；
      显式传了就一律以它为准。多选不派生图标（一个图标代表不了多项，此时只有显式传的 `icon` 显示）；
      没有选中项时不显示图标。 */
  icon?: ReactNode
  /** 错误态：边框与聚焦环走危险色，与输入框同一套规则（设计类 `.is-error`）。 */
  error?: boolean
  disabled?: boolean
  /** 静态态：把设计类的 `is-*` 写在触发器上，供清单页与设计稿并排展示多态。
      `loading` 只把指针换成进行中，不动底色与文字。 */
  state?: 'hover' | 'focus' | 'loading'
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
   触发器用自己的 `.select-trigger`，与输入框取同一批字段 token（底、描边、圆角、尺寸档），行为各写各的；弹层用 `.select-popup` 与 `.select-list`，
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
  /* 筛选框的 id：输入框基础件的 `id` 是必填（标签关联用），筛选框自身不带标签，
     但仍然要一个稳定的 id，交给 `useId` 生成，多个选择器同页也不冲突。 */
  const searchId = useId()
  /* 弹层宽度在进场动画结束时量下来并记住，退场期间不再跟随触发器。
     选中新值会改触发器宽度，若弹层继续跟随，就会一边淡出一边改宽改位；记住宽度后弹层原地淡出。
     下一次打开时（onOpenChange(true)）解除记忆，重新按当时的触发器宽度量。 */
  const [frozenWidth, setFrozenWidth] = useState<number | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  /* 单选：选中后先把值挂起，等弹层完全消失再回传给调用方。
     触发器标签因此不会在退场过程中改宽，弹层既不跳宽也不跳位。 */
  const [pendingValue, setPendingValue] = useState<string | null>(null)
  const popupOpen = useRef(false)
  const commitValue = useRef<((next: string) => void) | null>(null)

  const classes = [
    /* 触发器是选择器自己的设计类（见 select.less），不挂输入框的类：
       字段外观取同一批 token，行为各写各的（按钮语义，点击不加环、聚焦不改底色） */
    'select-trigger',
    'select__trigger',
    variant === 'plain' ? 'select-trigger--plain' : null,
    inverse ? 'select-trigger--inverse' : null,
    size === 'small' ? 'select-trigger--small' : null,
    size === 'large' ? 'select-trigger--large' : null,
    error ? 'is-error' : null,
    state ? `is-${state}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const flatOptions = groups ? groups.flatMap((group) => group.options) : options

  /* 触发器图标：调用方显式传 `icon` 时以它为准；否则按选中项派生。
     多选时图标**跟着各自的选项标签走**（`[图标] 项一, [图标] 项二`），因此多选的值自己渲染，见下面的 value。
     选项可能来自 `options` 或 `groups`，`flatOptions` 已把两处合成一份，按 `value` 找即可。 */
  const selectedValues = props.multiple ? props.value : props.value ? [props.value] : []
  const selectedOptions = selectedValues
    .map((selected) => flatOptions.find((option) => option.value === selected))
    .filter((option): option is SelectOption => option !== undefined)
  /* 多选且调用方没给 `icon` 时，值按选项逐个渲染，图标紧挨自己的标签；此时开头的图标槽不再放图标 */
  const renderValueItems = Boolean(props.multiple) && !icon && selectedOptions.length > 0
  const triggerIcons = icon
    ? [icon]
    : renderValueItems
      ? []
      : selectedOptions
          .map((option) => option.icon)
          .filter((node): node is ReactNode => node !== undefined && node !== null)
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

  const renderItem = (option: SelectOption) => (
    <BaseSelect.Item key={String(option.value)} value={option.value} disabled={option.disabled} className="select-item">
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
        {triggerIcons.length > 0 && iconPosition === 'start' ? (
          <span className="select__lead" aria-hidden="true">
            {triggerIcons.map((node, index) => (
              <span key={index} className="select__lead-icon">
                {node}
              </span>
            ))}
          </span>
        ) : null}
        {renderValueItems ? (
          /* 多选：每个选中项渲染「图标 + 标签」，项间用逗号加空格分隔，图标因此跟着各自的标签走 */
          <span className="select__value select__value--items">
            {selectedOptions.map((option, index) => (
              <span key={String(option.value)} className="select__value-item">
                {index > 0 ? <span className="select__value-sep">, </span> : null}
                {option.icon ? (
                  <span className="select__lead-icon" aria-hidden="true">
                    {option.icon}
                  </span>
                ) : null}
                <span className="select__value-label">{option.label}</span>
              </span>
            ))}
          </span>
        ) : (
          <BaseSelect.Value className="select__value" placeholder={placeholder} />
        )}
        {triggerIcons.length > 0 && iconPosition === 'end' ? (
          <span className="select__lead" aria-hidden="true">
            {triggerIcons.map((node, index) => (
              <span key={index} className="select__lead-icon">
                {node}
              </span>
            ))}
          </span>
        ) : null}
        {indicator ? <Icon name="i-down" size={16} className="select-icon" /> : null}
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        {/* 间距归排布者：弹层与触发器的 4px 间隙由定位器给，组件样式里不带外边距（layout.md 第 3 节） */}
        <BaseSelect.Positioner className="select__positioner" align="start" alignItemWithTrigger={false} sideOffset={4}>
          <BaseSelect.Popup
            ref={popupRef}
            className={['select-popup', searchable ? 'select-popup--search' : null].filter(Boolean).join(' ')}
            style={frozenWidth === null ? undefined : { inlineSize: `${frozenWidth}px` }}
            /* 进场结束时记住宽度，退场结束时解除；只认透明度事件，避免位移事件重复触发。
               挂起的新值不在这里回传：上游在弹层完全消失后另有回调（见 handleOpenChangeComplete）。 */
            onTransitionEnd={(event) => {
              if (event.propertyName !== 'opacity') return
              const element = event.currentTarget
              if (element.hasAttribute('data-ending-style')) setFrozenWidth(null)
              else setFrozenWidth(element.offsetWidth)
            }}
          >
            {searchable ? (
              /* 筛选框走「图标输入框」形态：图标用输入框自己的左侧槽位，落在控件边框以内，
                 不另写「图标加输入框并排」那种把图标留在框外的排法 */
              <div className="select-search">
                <Input
                  className="select-search__field"
                  id={searchId}
                  size="small"
                  icon={<Icon name="i-search" size={16} />}
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

  /* 打开与关闭时清掉筛选词：下次打开从完整列表开始；
     打开时解除上一轮记住的宽度，关闭后重新量一次（见弹层的 frozenWidth） */
  const handleOpenChange = (open: boolean) => {
    popupOpen.current = open
    if (open) setFrozenWidth(null)
    else setQuery('')
  }

  /* 弹层完全打开或完全消失之后上游才回调：关闭完成时把挂起的新值交给调用方，
     触发器标签与宽度因此都在弹层看不见之后才变，弹层不会跟着跳 */
  const handleOpenChangeComplete = (open: boolean) => {
    if (open || pendingValue === null) return
    commitValue.current?.(pendingValue)
    setPendingValue(null)
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
        onOpenChangeComplete={handleOpenChangeComplete}
      >
        {content}
      </BaseSelect.Root>
    )
  }

  const { value, onValueChange } = props
  commitValue.current = (next: string) => onValueChange(next)
  return (
    <BaseSelect.Root
      value={value as string}
      /* 单选：弹层打开着就先把新值挂起，等它完全消失再回传，触发器宽度因此不在退场中变化。
         再次点选已选中项与空值项都归一成空串。 */
      onValueChange={(next) => {
        const normalized = next === value ? '' : ((next ?? '') as string)
        if (popupOpen.current) setPendingValue(normalized)
        else onValueChange(normalized)
      }}
      items={items}
      disabled={disabled}
      required={required}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
    >
      {content}
    </BaseSelect.Root>
  )
}
