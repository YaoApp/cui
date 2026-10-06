import { render, screen, waitFor } from '@testing-library/react'
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

  /* 抖动是可选的一次性反馈：错误在身也不许自己抖，只有调用方明确要求才抖 */
  it('keeps the shake off unless the caller asks for it', () => {
    render(<Input id="account" label="账号" value="" onChange={() => {}} error="必填" />)
    expect(screen.getByLabelText('账号')).not.toHaveClass('is-shake')
  })

  /* 触发值到达时挂上设计类。连续错误的重播属于动画行为，由浏览器层断言（jsdom 不跑动画） */
  it('applies the shake class when the caller triggers it', async () => {
    const props = { id: 'account', label: '账号', value: '', onChange: () => {}, error: '必填' }
    const { rerender } = render(<Input {...props} shake={1} />)
    const control = screen.getByLabelText('账号')
    await waitFor(() => expect(control).toHaveClass('is-shake'))

    rerender(<Input {...props} shake={2} />)
    await waitFor(() => expect(control).toHaveClass('is-shake'))
  })

  it('carries the size class on the control, on the same ladder as the button', () => {
    const small = render(<Input id="account" label="小" size="small" />)
    expect(small.container.querySelector('.input')).toHaveClass('input--small')

    const large = render(<Input id="mail" label="大" size="large" />)
    expect(large.container.querySelector('.input')).toHaveClass('input--large')
  })

  it('puts the static state class on the control, not on the field frame', () => {
    /* 设计类的规则都写在 `.input` 上；加在字段框上不会生效（这是清单页并排展示多态的前提）。 */
    render(<Input id="account" label="账号" state="hover" />)
    const control = screen.getByLabelText('账号')

    expect(control).toHaveClass('input', 'is-hover')
    expect(control.closest('.field__box')).not.toHaveClass('is-hover')
  })

  it('marks the field frame when it carries an error, and the control keeps the error class', () => {
    render(<Input id="account" label="账号" error="账号已被占用" />)
    const control = screen.getByLabelText('账号')

    expect(control).toHaveClass('is-error')
    expect(control.closest('.field__box')).toHaveClass('is-error')
    expect(screen.getByText('账号已被占用')).toHaveClass('hint-error')
  })

  it('draws the left icon slot as decoration and keeps it out of the accessibility tree', () => {
    const { container } = render(<Input id="account" label="账号" icon={<span data-testid="lead" />} />)
    const slot = container.querySelector('.field__icon')

    expect(slot).not.toBeNull()
    expect(slot).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows the ring in the right slot while loading and marks the control busy', () => {
    const { container } = render(<Input id="account" label="账号" state="loading" />)
    const control = screen.getByLabelText('账号')
    const slot = container.querySelector('.field__trail')

    expect(control).toHaveAttribute('aria-busy', 'true')
    expect(slot).not.toBeNull()
    expect(slot?.querySelector('.spinner')).not.toBeNull()
  })

  it('keeps the caller trailing slot instead of stacking a second one', () => {
    const { container } = render(
      <Input id="account" label="账号" state="loading" trailing={<button type="button">显示</button>} />,
    )
    const slots = container.querySelectorAll('.field__trail')

    expect(slots).toHaveLength(1)
    expect(slots[0].querySelector('.spinner')).toBeNull()
    expect(screen.getByRole('button', { name: '显示' })).toBeInTheDocument()
  })
})
