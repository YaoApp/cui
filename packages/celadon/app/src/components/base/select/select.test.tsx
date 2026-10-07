import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select } from '@/components/base/select'

/* 基础件只保证行为与可访问性：受控值、回调、可访问名、键盘。
   视觉（.input / 弹层）不在这里断言 —— 那是浏览器与拟人层的事。 */
const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Follow system' },
]

describe('Select', () => {
  it('exposes an accessible name on the combobox', () => {
    render(<Select aria-label="Theme" value="light" onValueChange={() => {}} options={OPTIONS} />)
    expect(screen.getByRole('combobox', { name: 'Theme' })).toBeInTheDocument()
  })

  it('shows the selected option label', () => {
    render(<Select aria-label="Theme" value="dark" onValueChange={() => {}} options={OPTIONS} />)
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveTextContent('Dark')
  })

  it('reports the picked value through onValueChange', async () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="Theme" value="light" onValueChange={onValueChange} options={OPTIONS} />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Dark' }))

    expect(onValueChange).toHaveBeenCalledWith('dark')
  })

  it('opens and selects with the keyboard', async () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="Theme" value="light" onValueChange={onValueChange} options={OPTIONS} />)

    await userEvent.tab()
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')

    expect(onValueChange).toHaveBeenCalledWith('dark')
  })

  it('does not call back while disabled', async () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="Theme" value="light" onValueChange={onValueChange} options={OPTIONS} disabled />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))

    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('shows the placeholder when nothing is selected', () => {
    render(
      <Select aria-label="Theme" value="" onValueChange={() => {}} options={OPTIONS} placeholder="Pick one" />,
    )
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveTextContent('Pick one')
  })

  it('shows the empty text when there are no options', async () => {
    render(
      <Select
        aria-label="Theme"
        value=""
        onValueChange={() => {}}
        options={[]}
        placeholder="Pick one"
        emptyText="No options"
      />,
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    expect(await screen.findByText('No options')).toBeInTheDocument()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('carries the static state, error and size classes on the trigger', () => {
    render(
      <Select
        aria-label="Theme"
        value="light"
        onValueChange={() => {}}
        options={OPTIONS}
        size="small"
        error
        state="focus"
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Theme' })
    expect(trigger).toHaveClass('select-trigger', 'select-trigger--small', 'is-error', 'is-focus')
  })

  it('renders grouped options with their group labels', async () => {
    render(
      <Select
        aria-label="Theme"
        value="light"
        onValueChange={() => {}}
        groups={[
          { label: 'Appearance', options: [{ value: 'light', label: 'Light' }] },
          { label: 'Language', options: [{ value: 'en', label: 'English' }, { value: 'ja', label: '日本語' }] },
        ]}
      />,
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    expect(await screen.findByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Language')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('renders an option icon, a second line and a trailing slot', async () => {
    render(
      <Select
        aria-label="Theme"
        value="reading"
        onValueChange={() => {}}
        options={[
          {
            value: 'reading',
            label: 'Reading',
            icon: <span data-testid="option-icon" />,
            description: 'Narrow column',
            trailing: '⌘1',
          },
        ]}
      />,
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    /* 触发器现在也画选中项的图标，同一个节点因此出现两份：这里限定在选项行内查 */
    const option = await screen.findByRole('option', { name: /Reading/ })
    expect(within(option).getByTestId('option-icon')).toBeInTheDocument()
    expect(within(option).getByText('Narrow column')).toBeInTheDocument()
    expect(within(option).getByText('⌘1')).toBeInTheDocument()
    /* 选中项的标记：给了值的那一项要画出选中标记 */
    expect(document.querySelectorAll('.select-item__check').length).toBeGreaterThan(0)
  })

  it('renders the trigger icon in its own slot', () => {
    render(
      <Select
        aria-label="Theme"
        value="light"
        onValueChange={() => {}}
        options={OPTIONS}
        icon={<span data-testid="trigger-icon" />}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Theme' })
    expect(trigger.querySelector('[data-testid="trigger-icon"]')).not.toBeNull()
    expect(trigger.querySelector('.select__lead')).not.toBeNull()
  })

  /* 触发器图标默认取当前选中项的 `option.icon`，调用方显式传 `icon` 时以它为准；
     多选取第一个选中项的图标，没有选中项就不显示。 */
  it('takes the trigger icon from the selected option', () => {
    render(
      <Select
        aria-label="Theme"
        value="dark"
        onValueChange={() => {}}
        options={[
          { value: 'light', label: 'Light', icon: <span data-testid="light-icon" /> },
          { value: 'dark', label: 'Dark', icon: <span data-testid="dark-icon" /> },
        ]}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Theme' })

    expect(trigger.querySelector('[data-testid="dark-icon"]')).not.toBeNull()
    expect(trigger.querySelector('[data-testid="light-icon"]')).toBeNull()
  })

  it('takes the trigger icon from a grouped option', () => {
    render(
      <Select
        aria-label="Theme"
        value="ja"
        onValueChange={() => {}}
        groups={[
          { label: 'Language', options: [{ value: 'ja', label: '日本語', icon: <span data-testid="ja-icon" /> }] },
        ]}
      />,
    )

    expect(
      screen.getByRole('combobox', { name: 'Theme' }).querySelector('[data-testid="ja-icon"]'),
    ).not.toBeNull()
  })

  it('lets the icon prop win over the selected option icon', () => {
    render(
      <Select
        aria-label="Theme"
        value="dark"
        onValueChange={() => {}}
        options={[{ value: 'dark', label: 'Dark', icon: <span data-testid="dark-icon" /> }]}
        icon={<span data-testid="trigger-icon" />}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Theme' })

    expect(trigger.querySelector('[data-testid="trigger-icon"]')).not.toBeNull()
    expect(trigger.querySelector('[data-testid="dark-icon"]')).toBeNull()
  })

  it('takes one trigger icon per picked option while multiple', () => {
    render(
      <Select
        multiple
        aria-label="Theme"
        value={['dark', 'light']}
        onValueChange={() => {}}
        options={[
          { value: 'light', label: 'Light', icon: <span data-testid="light-icon" /> },
          { value: 'dark', label: 'Dark', icon: <span data-testid="dark-icon" /> },
        ]}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Theme' })
    const icons = [...trigger.querySelectorAll('.select__lead-icon')]

    /* 多选时每个选中项各占一个图标槽，按选中顺序排 */
    expect(icons).toHaveLength(2)
    expect(icons[0].querySelector('[data-testid="dark-icon"]')).not.toBeNull()
    expect(icons[1].querySelector('[data-testid="light-icon"]')).not.toBeNull()
  })

  it('shows no trigger icon while nothing is selected', () => {
    render(
      <Select
        aria-label="Theme"
        value=""
        onValueChange={() => {}}
        options={[{ value: 'light', label: 'Light', icon: <span data-testid="light-icon" /> }]}
        placeholder="Pick one"
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Theme' }).querySelector('.select__lead')).toBeNull()
  })

  it('skips the disabled option when moving with the keyboard', async () => {
    const onValueChange = vi.fn()
    render(
      <Select
        aria-label="Theme"
        value="light"
        onValueChange={onValueChange}
        options={[...OPTIONS, { value: 'auto', label: 'Auto', disabled: true }]}
      />,
    )

    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')

    /* 第三项是禁用的 Auto，键盘不停留，落到第四项之外仍是已到末项，不产生禁用值 */
    expect(onValueChange).not.toHaveBeenCalledWith('auto')
  })

  it('reports an array of values while multiple', async () => {
    const onValueChange = vi.fn()
    render(
      <Select
        multiple
        aria-label="Theme"
        value={['light']}
        onValueChange={onValueChange}
        options={OPTIONS}
      />,
    )

    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Dark' }))

    expect(onValueChange).toHaveBeenCalled()
    expect(Array.isArray(onValueChange.mock.calls[0]?.[0])).toBe(true)
  })

  it('filters the options with the search box and reports no match', async () => {
    render(
      <Select
        searchable
        aria-label="Theme"
        searchLabel="Search options"
        noMatchText="No matches"
        value="light"
        onValueChange={() => {}}
        options={OPTIONS}
      />,
    )

    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    expect(await screen.findAllByRole('option')).toHaveLength(3)

    /* 筛选词直接派发 change：输入框是受控的，只需要 onChange 一个事件；
       逐字符输入会与弹层的过渡计时器抢时序，偶发丢字，这里不测打字本身 */
    const search = screen.getByRole('textbox', { name: 'Search options' })
    fireEvent.change(search, { target: { value: 'dark' } })
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1))
    expect(screen.getByRole('option', { name: 'Dark' })).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'zzz' } })
    /* 0 命中时列表整块换成空态说明：等空态出现后再断言没有选项 */
    expect(await screen.findByText('No matches')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('marks the popup as searchable and keeps one list container', async () => {
    /* 箭头的可见性由布局决定，jsdom 里不会渲染，因此这里只断言类契约，可见性在浏览器用例里核 */
    render(<Select searchable aria-label="Theme" value="light" onValueChange={() => {}} options={OPTIONS} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    await screen.findByRole('option', { name: 'Light' })
    expect(document.querySelector('.select-popup--search')).not.toBeNull()
    expect(document.querySelectorAll('.select-list')).toHaveLength(1)
  })

  it('keeps the popup without the search modifier when the search is off', async () => {
    render(<Select aria-label="Theme" value="light" onValueChange={() => {}} options={OPTIONS} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    await screen.findByRole('option', { name: 'Light' })
    expect(document.querySelector('.select-popup--search')).toBeNull()
  })

  it('clears the choice with a null item', async () => {
    const onValueChange = vi.fn()
    render(
      <Select
        aria-label="Theme"
        value="light"
        onValueChange={onValueChange}
        options={[...OPTIONS, { value: null, label: 'Clear choice' }]}
      />,
    )

    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Clear choice' }))

    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('carries the inverse class', () => {
    render(<Select inverse aria-label="Theme" value="light" onValueChange={() => {}} options={OPTIONS} />)
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveClass('select-trigger', 'select-trigger--inverse')
  })

  it('clears the choice when the selected option is picked again', async () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="Theme" value="light" onValueChange={onValueChange} options={OPTIONS} />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Light' }))

    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('keeps the field look in its own class instead of borrowing the input class', () => {
    /* 触发器与输入框共用字段外观（同一批 token），但不共用类与行为：见 select.less 顶部说明。 */
    render(<Select aria-label="Theme" value="light" onValueChange={() => {}} options={OPTIONS} />)
    const trigger = screen.getByRole('combobox', { name: 'Theme' })

    expect(trigger).toHaveClass('select-trigger', 'select__trigger')
    expect(trigger).not.toHaveClass('input')
    expect(trigger).not.toHaveClass('input--trigger')
  })

  it('carries the plain form and each size step', () => {
    const { rerender } = render(
      <Select variant="plain" size="small" aria-label="Theme" value="light" onValueChange={() => {}} options={OPTIONS} />,
    )
    const trigger = screen.getByRole('combobox', { name: 'Theme' })

    expect(trigger).toHaveClass('select-trigger--plain', 'select-trigger--small')

    rerender(<Select size="large" aria-label="Theme" value="light" onValueChange={() => {}} options={OPTIONS} />)
    expect(trigger).toHaveClass('select-trigger--large')
  })

  it('carries the loading state class', () => {
    render(<Select state="loading" aria-label="Theme" value="light" onValueChange={() => {}} options={OPTIONS} />)

    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveClass('is-loading')
  })
})
