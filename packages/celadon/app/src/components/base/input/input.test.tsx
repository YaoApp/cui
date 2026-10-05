import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Input } from '@/components/base/input'

/* 基础件只保证行为与可访问性：标签关联、错误关联、受控回调与禁用。
   视觉（`.input` 的六态）不在这里断言，那是浏览器层与拟人层的事。 */
describe('Input', () => {
  it('associates the label with the control and carries the design class', () => {
    render(<Input id="account" label="账号" value="" onChange={() => {}} />)
    expect(screen.getByLabelText('账号')).toHaveClass('input')
  })

  it('links the error text through aria-describedby', () => {
    render(<Input id="account" label="账号" value="" onChange={() => {}} error="必填" />)
    expect(screen.getByLabelText('账号').getAttribute('aria-describedby')).toBe('account-error')
    expect(screen.getByText('必填')).toBeInTheDocument()
  })

  it('links both the hint and the error when both are present', () => {
    render(<Input id="account" label="账号" value="" onChange={() => {}} hint="用邮箱" error="必填" />)
    expect(screen.getByLabelText('账号').getAttribute('aria-describedby')).toBe('account-hint account-error')
  })

  it('calls back when the user types', async () => {
    const onChange = vi.fn()
    render(<Input id="account" label="账号" value="" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('账号'), 'a')
    expect(onChange).toHaveBeenCalled()
  })

  it('does not accept input when disabled', () => {
    render(<Input id="account" label="账号" value="" onChange={() => {}} disabled />)
    expect(screen.getByLabelText('账号')).toBeDisabled()
  })
})
