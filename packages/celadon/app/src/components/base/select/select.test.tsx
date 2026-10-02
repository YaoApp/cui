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
    render(<Select aria-label="Theme" value="light" onChange={() => {}} options={OPTIONS} />)
    expect(screen.getByRole('combobox', { name: 'Theme' })).toBeInTheDocument()
  })

  it('shows the selected option label', () => {
    render(<Select aria-label="Theme" value="dark" onChange={() => {}} options={OPTIONS} />)
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveTextContent('Dark')
  })

  it('reports the picked value through onChange', async () => {
    const onChange = vi.fn()
    render(<Select aria-label="Theme" value="light" onChange={onChange} options={OPTIONS} />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Dark' }))

    expect(onChange).toHaveBeenCalledWith('dark')
  })

  it('opens and selects with the keyboard', async () => {
    const onChange = vi.fn()
    render(<Select aria-label="Theme" value="light" onChange={onChange} options={OPTIONS} />)

    await userEvent.tab()
    expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith('dark')
  })

  it('does not call back while disabled', async () => {
    const onChange = vi.fn()
    render(<Select aria-label="Theme" value="light" onChange={onChange} options={OPTIONS} disabled />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Theme' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})
