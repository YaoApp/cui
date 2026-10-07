/* 锁定后的账号行：只读、回调、禁用、可访问名。 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LockedAccount } from './locked-account'

function renderRow(props: Partial<React.ComponentProps<typeof LockedAccount>> = {}) {
  return render(
    <LockedAccount
      id="row-account"
      value="max@example.com"
      label="邮箱或手机号"
      changeLabel="修改"
      onChange={() => undefined}
      {...props}
    />,
  )
}

describe('the locked account row', () => {
  it('shows the account read-only with its accessible name', () => {
    renderRow()
    const field = screen.getByLabelText('邮箱或手机号') as HTMLInputElement
    expect(field.value).toBe('max@example.com')
    expect(field.getAttribute('readonly')).toBe('')
  })

  it('calls back when the change action is pressed', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderRow({ onChange })
    await user.click(screen.getByRole('button', { name: '修改' }))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('disables both the field and the change action when asked', () => {
    renderRow({ disabled: true })
    expect((screen.getByLabelText('邮箱或手机号') as HTMLInputElement).disabled).toBe(true)
    expect(screen.getByRole('button', { name: '修改' })).toBeDisabled()
  })

  it('puts the change action in the same row as the field', () => {
    renderRow()
    const row = document.querySelector('.locked-account') as HTMLElement
    /* 一行两个元素，且第一个是字段容器 */
    expect(row.children).toHaveLength(2)
    expect((row.children[0] as HTMLElement).className).toContain('field')
    expect((row.children[1] as HTMLElement).tagName.toLowerCase()).toBe('button')
  })
})
