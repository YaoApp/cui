import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HelloPage } from '@/features/hello'

/* 这条走的是完整链路：base/button → header → feature store → 私有组件 foo-bar */
describe('HelloPage', () => {
  it('点刷新，页面上的次数跟着涨', async () => {
    render(<HelloPage />)
    expect(screen.getByText('已刷新 0 次')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '刷新' }))

    expect(screen.getByText('已刷新 1 次')).toBeInTheDocument()
  })
})
