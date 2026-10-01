import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Header } from '@/components/header'

describe('Header', () => {
  it('显示标题', () => {
    render(<Header title="Hello" />)
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument()
  })

  it('点刷新时把事件交给上层', async () => {
    const onRefresh = vi.fn()
    render(<Header title="Hello" onRefresh={onRefresh} />)
    await userEvent.click(screen.getByRole('button', { name: '刷新' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
