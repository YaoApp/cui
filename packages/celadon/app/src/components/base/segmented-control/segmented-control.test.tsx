import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from '@/components/base/segmented-control'

/* 基础件只保证行为与无障碍：互斥选择、回调、`aria-pressed`、禁用、方向键。
   观感（`.seg` 外壳、反色档、图标槽）不在这里断言，那是浏览器与拟人层的事。 */
const OPTIONS = [
  { value: 'system', label: 'Follow system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

describe('SegmentedControl', () => {
  it('exposes an accessible name on the group and presses the selected segment', () => {
    render(<SegmentedControl aria-label="Theme" value="light" onValueChange={() => {}} options={OPTIONS} />)
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('reports the picked value', async () => {
    const onValueChange = vi.fn()
    render(<SegmentedControl aria-label="Theme" value="light" onValueChange={onValueChange} options={OPTIONS} />)

    await userEvent.click(screen.getByRole('button', { name: 'Dark' }))

    expect(onValueChange).toHaveBeenCalledWith('dark')
  })

  it('does not call back while the group or a segment is disabled', async () => {
    const onValueChange = vi.fn()
    const { unmount } = render(
      <SegmentedControl aria-label="Theme" value="light" onValueChange={onValueChange} options={OPTIONS} disabled />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }))
    expect(onValueChange).not.toHaveBeenCalled()
    unmount()

    render(
      <SegmentedControl
        aria-label="Theme"
        value="light"
        onValueChange={onValueChange}
        options={[OPTIONS[0], { ...OPTIONS[2], disabled: true }]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('carries the inverse class and the icon slot', () => {
    render(
      <SegmentedControl
        aria-label="Theme"
        value="system"
        onValueChange={() => {}}
        inverse
        options={[{ value: 'system', label: 'Follow system', icon: <span data-testid="seg-icon" /> }, ...OPTIONS.slice(1)]}
      />,
    )
    expect(screen.getByRole('group', { name: 'Theme' })).toHaveClass('seg', 'seg--inverse')
    expect(screen.getByTestId('seg-icon').closest('.seg__icon')).not.toBeNull()
  })

  it('moves and selects with the arrow keys', async () => {
    const onValueChange = vi.fn()
    render(<SegmentedControl aria-label="Theme" value="system" onValueChange={onValueChange} options={OPTIONS} />)

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Follow system' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith('light')
    expect(screen.getByRole('button', { name: 'Light' })).toHaveFocus()

    await userEvent.keyboard('{ArrowLeft}')
    expect(onValueChange).toHaveBeenLastCalledWith('system')
  })
})
