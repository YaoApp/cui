import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from '@/components/theme-toggle'

describe('ThemeToggle', () => {
  it('says what the next theme will be', () => {
    render(<ThemeToggle theme="light" onToggle={() => {}} />)
    expect(screen.getByRole('button', { name: '切到深色' })).toBeInTheDocument()
  })

  it('offers the way back when the theme is dark', () => {
    render(<ThemeToggle theme="dark" onToggle={() => {}} />)
    expect(screen.getByRole('button', { name: '切到浅色' })).toBeInTheDocument()
  })

  it('reports the current state to assistive tech', () => {
    const { rerender } = render(<ThemeToggle theme="light" onToggle={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    rerender(<ThemeToggle theme="dark" onToggle={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls back once per click', async () => {
    const onToggle = vi.fn()
    render(<ThemeToggle theme="light" onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
