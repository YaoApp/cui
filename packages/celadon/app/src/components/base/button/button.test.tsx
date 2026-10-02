import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/base/button'

describe('Button', () => {
  it('renders its label and carries the design variant and size classes', () => {
    render(<Button variant="solid" size="small">刷新</Button>)
    const button = screen.getByRole('button', { name: '刷新' })
    expect(button).toHaveClass('btn-primary', 'is-solid', 'button--small')
  })

  it('the ghost variant uses the design .btn-ghost class', () => {
    render(<Button variant="ghost">取消</Button>)
    expect(screen.getByRole('button', { name: '取消' })).toHaveClass('btn-ghost')
  })

  it('calls back once when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>刷新</Button>)
    await userEvent.click(screen.getByRole('button', { name: '刷新' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire while disabled', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>刷新</Button>)
    const button = screen.getByRole('button', { name: '刷新' })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('fires from the keyboard when focused', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>刷新</Button>)

    await userEvent.tab()
    const button = screen.getByRole('button', { name: '刷新' })
    expect(button).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)

    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
