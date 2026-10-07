import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from '@/components/theme-toggle'

/* 主题切换件是一个图标按钮，图标表达**点击之后**会变成什么：当前浅色显示月亮、当前深色显示太阳。
   可访问名同样是动作（「切换到深色」），读屏听到的是按下去会发生什么，而不是现在是什么状态。 */
const iconOf = () => document.querySelector('use')?.getAttribute('href')

describe('ThemeToggle', () => {
  it('shows the theme the click switches to, not the current one', () => {
    const { rerender } = render(<ThemeToggle theme="light" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: '切换到深色' })).toBeInTheDocument()
    expect(iconOf()).toBe('#i-moon')

    rerender(<ThemeToggle theme="dark" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: '切换到浅色' })).toBeInTheDocument()
    expect(iconOf()).toBe('#i-sun')
  })

  it('is an icon-only button with no visible text', () => {
    render(<ThemeToggle theme="light" onSelect={() => {}} />)
    const button = screen.getByRole('button', { name: '切换到深色' })
    expect(button).toHaveClass('button--icon')
    expect(button).toHaveTextContent('')
    expect(button.querySelector('svg.icon')).toBeInTheDocument()
  })

  it('switches to the opposite theme when clicked', async () => {
    const onSelect = vi.fn()
    const { rerender } = render(<ThemeToggle theme="light" onSelect={onSelect} />)

    await userEvent.click(screen.getByRole('button', { name: '切换到深色' }))
    expect(onSelect).toHaveBeenCalledWith('dark')

    rerender(<ThemeToggle theme="dark" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: '切换到浅色' }))
    expect(onSelect).toHaveBeenCalledWith('light')
  })

  it('takes the size step it is given, like the buttons beside it', () => {
    render(<ThemeToggle theme="light" onSelect={() => {}} size="small" />)
    expect(screen.getByRole('button', { name: '切换到深色' })).toHaveClass('button--small')
  })
})
