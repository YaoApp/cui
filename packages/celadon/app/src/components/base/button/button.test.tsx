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

  it('carries the semantic variants and the inverse variant through to their classes', () => {
    const cases = [
      ['soft', 'btn-primary'],
      ['warn', 'btn-warn'],
      ['success', 'btn-success'],
      ['danger', 'btn-danger'],
      ['inverse', 'button--inverse'],
    ] as const

    for (const [variant, expected] of cases) {
      const { unmount } = render(<Button variant={variant}>操作</Button>)
      expect(screen.getByRole('button', { name: '操作' })).toHaveClass(expected)
      unmount()
    }
  })

  it('carries each size step and the pill shape', () => {
    const { rerender } = render(<Button size="small">小</Button>)
    expect(screen.getByRole('button', { name: '小' })).toHaveClass('button--small')

    rerender(<Button size="large" shape="pill">大</Button>)
    expect(screen.getByRole('button', { name: '大' })).toHaveClass('button--large', 'button--pill')
  })

  it('spans the row only when the caller asks for it', () => {
    const { container, rerender } = render(<Button>默认</Button>)
    expect(container.querySelector('button')).not.toHaveClass('button--block')

    rerender(<Button block>整宽</Button>)
    expect(container.querySelector('button')).toHaveClass('button--block')
  })

  it('shows the ring and blocks interaction while loading', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>提交</Button>)
    const button = screen.getByRole('button', { name: '提交' })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('.spinner')).not.toBeNull()

    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('takes the static state class so one page can show several states side by side', () => {
    render(<Button state="focus">样例</Button>)

    expect(screen.getByRole('button', { name: '样例' })).toHaveClass('is-focus')
  })
})
