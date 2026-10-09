/* 密码输入：明文切换、可访问名与按下状态，错误与提示照常透传。 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@/platform/i18n'
import { PasswordInput } from './password-input'

const t = (key: string) => i18n.t(key as never) as unknown as string

const base = {
  id: 'password',
  label: 'Password',
  value: 'secret',
  onValueChange: () => undefined,
}

describe('the password input', () => {
  it('starts masked and switches to plain text through the toggle', async () => {
    const user = userEvent.setup()
    render(<PasswordInput {...base} />)
    const field = screen.getByLabelText('Password') as HTMLInputElement
    expect(field.type).toBe('password')

    const toggle = screen.getByRole('button', { name: t('auth.action.showPassword') })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    await user.click(toggle)

    expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe('text')
    expect(screen.getByRole('button', { name: t('auth.action.hidePassword') }).getAttribute('aria-pressed')).toBe('true')
  })

  it('reports every keystroke to the caller', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(<PasswordInput {...base} value="" onValueChange={onValueChange} />)
    await user.type(screen.getByLabelText('Password'), 'abc')
    expect(onValueChange.mock.calls.map(([value]) => value).join('')).toBe('abc')
  })

  it('shows the error and keeps the toggle clickable without taking a tab stop', async () => {
    const user = userEvent.setup()
    render(<PasswordInput {...base} error="必填" />)
    expect(screen.getByText('必填')).toBeTruthy()

    const toggle = screen.getByRole('button', { name: t('auth.action.showPassword') })
    /* 尾部辅助按钮不进 Tab 序列，但仍可点 */
    expect(toggle.tabIndex).toBe(-1)
    await user.click(toggle)
    expect((screen.getByLabelText('Password') as HTMLInputElement).type).toBe('text')
  })
})
