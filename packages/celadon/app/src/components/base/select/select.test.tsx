import { render, screen } from '@testing-library/react'
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
    expect(trigger).toHaveClass('input', 'input--small', 'is-error', 'is-focus')
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
    expect(await screen.findByTestId('option-icon')).toBeInTheDocument()
    expect(screen.getByText('Narrow column')).toBeInTheDocument()
    expect(screen.getByText('⌘1')).toBeInTheDocument()
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
})
