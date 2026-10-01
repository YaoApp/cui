import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from '@/components/theme-toggle'

/* 设计里的主题切换件是一个分段控件（.seg + 选中项 .is-on），不是单个按钮。 */
describe('ThemeToggle', () => {
  it('offers both themes', () => {
    render(<ThemeToggle theme="light" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '浅色' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '暗色' })).toBeInTheDocument()
  })

  it('marks the current theme, visually and for assistive tech', () => {
    const { rerender } = render(<ThemeToggle theme="light" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '浅色' })).toHaveClass('is-on')
    expect(screen.getByRole('button', { name: '浅色' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '暗色' })).not.toHaveClass('is-on')

    rerender(<ThemeToggle theme="dark" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: '暗色' })).toHaveClass('is-on')
    expect(screen.getByRole('button', { name: '浅色' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('picks the theme that was clicked', async () => {
    const onChange = vi.fn()
    render(<ThemeToggle theme="light" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '暗色' }))
    expect(onChange).toHaveBeenCalledWith('dark')
  })
})
