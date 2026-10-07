/* 页面级提示：两种色调对应两种读屏角色，重试按钮只在给了文案与回调时出现。 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StatusNotice } from './status-notice'

describe('the status notice', () => {
  it('reports a general hint politely and a failure as an alert', () => {
    const { unmount } = render(<StatusNotice text="已注册成功，请登录" />)
    expect(screen.getByRole('status').textContent).toContain('已注册成功，请登录')
    unmount()

    render(<StatusNotice tone="danger" text="验证码不正确" />)
    expect(screen.getByRole('alert').textContent).toContain('验证码不正确')
  })

  it('renders the retry button only when both the label and the handler are given', async () => {
    const onRetry = vi.fn()
    const { rerender } = render(<StatusNotice tone="danger" text="加载失败" retryLabel="重试" onRetry={onRetry} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(onRetry).toHaveBeenCalledTimes(1)

    rerender(<StatusNotice tone="danger" text="加载失败" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
