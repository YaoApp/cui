import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/base/button'

describe('Button', () => {
  it('渲染可见文字，并带上 design 的 variant 类与尺寸类', () => {
    render(<Button variant="solid" size="small">刷新</Button>)
    const button = screen.getByRole('button', { name: '刷新' })
    expect(button).toHaveClass('btn-primary', 'is-solid', 'button--small')
  })

  it('ghost 档走 design 的 .btn-ghost', () => {
    render(<Button variant="ghost">取消</Button>)
    expect(screen.getByRole('button', { name: '取消' })).toHaveClass('btn-ghost')
  })

  it('点击会回调一次', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>刷新</Button>)
    await userEvent.click(screen.getByRole('button', { name: '刷新' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('禁用时点不动', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>刷新</Button>)
    const button = screen.getByRole('button', { name: '刷新' })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
