import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { OtpField, type OtpFieldProps } from '@/components/base/otp-field'

/* 受控包装：口令的值在调用方手里，组件只报变化。 */
function Harness(props: Partial<OtpFieldProps> = {}) {
  const [value, setValue] = useState('')
  return <OtpField id="otp" label="验证码" value={value} onValueChange={setValue} {...props} />
}

const cells = () => screen.getAllByRole('textbox') as HTMLInputElement[]

describe('OtpField', () => {
  it('splits the code into one box per digit', () => {
    render(<Harness length={4} />)
    expect(cells()).toHaveLength(4)
    expect(cells().every((cell) => cell.value === '')).toBe(true)
  })

  it('associates the label with the first box and names the others by position', () => {
    render(<Harness length={4} />)
    expect(screen.getByLabelText('验证码 1')).toBe(cells()[0])
    expect(screen.getByLabelText('验证码 4')).toBe(cells()[3])
  })

  it('takes a named cell-label function when the caller supplies one', () => {
    render(<Harness length={3} cellLabel={(index) => `第 ${index + 1} 位`} />)
    expect(screen.getByLabelText('第 2 位')).toBe(cells()[1])
  })

  it('fills from left to right and moves the focus along', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(cells()[0], '1')
    expect(cells()[0]).toHaveValue('1')
    expect(cells()[1]).toHaveFocus()
  })

  it('takes only digits', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Harness onValueChange={onValueChange} />)
    await user.type(cells()[0], 'a')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('ignores a letter instead of treating it as a clear', async () => {
    const user = userEvent.setup()
    render(<Harness length={3} />)
    await user.click(cells()[0])
    await user.keyboard('12')
    /* 往已填的格子里敲字母：口令不动，格子里也不留字母 */
    await user.keyboard('a')
    expect(cells().map((cell) => cell.value)).toEqual(['1', '2', ''])
  })

  it('reports the whole code as it grows and completes once', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    /* 受控父组件同时记录每次变化：只挂 spy 会让值一直为空，不是真实用法 */
    const seen: string[] = []
    function Recording() {
      const [value, setValue] = useState('')
      return (
        <OtpField
          id="otp"
          label="验证码"
          length={3}
          value={value}
          onValueChange={(next) => {
            seen.push(next)
            setValue(next)
          }}
          onComplete={onComplete}
        />
      )
    }
    render(<Recording />)

    /* 键盘事件跟着焦点走：点第一格后逐位敲，正是真实输入的路径 */
    await user.click(cells()[0])
    await user.keyboard('12')
    expect(seen.at(-1)).toBe('12')
    expect(onComplete).not.toHaveBeenCalled()
    await user.keyboard('3')
    expect(seen.at(-1)).toBe('123')
    expect(onComplete).toHaveBeenCalledWith('123')
  })

  it('keeps the code at the requested length', async () => {
    const user = userEvent.setup()
    render(<Harness length={2} />)
    await user.click(cells()[0])
    await user.keyboard('1234')
    /* 满码后光标停在最后一格，继续敲就是替换那一格：长度不越界，值仍是两位数字 */
    expect(cells()).toHaveLength(2)
    expect(cells().map((cell) => cell.value).join('')).toMatch(/^\d{2}$/)
    expect(cells()[0]).toHaveValue('1')
  })

  it('clears the box and the ones after it on backspace', async () => {
    const user = userEvent.setup()
    render(<Harness length={4} />)
    await user.click(cells()[0])
    await user.keyboard('1234')
    await user.click(cells()[1])
    await user.keyboard('{Backspace}')
    expect(cells().map((cell) => cell.value)).toEqual(['1', '', '', ''])
  })

  it('walks with the arrow keys and with Home / End', async () => {
    const user = userEvent.setup()
    render(<Harness length={4} />)
    await user.click(cells()[0])
    await user.keyboard('12')
    expect(cells()[2]).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(cells()[1]).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(cells()[2]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(cells()[0]).toHaveFocus()
    await user.keyboard('{End}')
    expect(cells()[2]).toHaveFocus()
  })

  it('spreads a pasted code over the boxes', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Harness length={6} onComplete={onComplete} />)
    await user.click(cells()[0])
    await user.paste('123 456')
    expect(cells().map((cell) => cell.value).join('')).toBe('123456')
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  it('shows the message and marks the boxes when the code is wrong', () => {
    render(<Harness error="口令不正确" hint="六位数字" />)
    expect(screen.getByText('口令不正确')).toBeInTheDocument()
    expect(screen.getByText('六位数字')).toBeInTheDocument()
    expect(cells()[0]).toHaveAttribute('aria-invalid', 'true')
    expect(cells()[0]).toHaveAttribute('aria-describedby', 'otp-hint otp-error')
    expect(cells()[0]).toHaveClass('is-error')
  })

  it('locks the boxes when disabled and keeps them readable when read-only', () => {
    const { rerender } = render(<Harness disabled />)
    expect(cells().every((cell) => cell.disabled)).toBe(true)

    rerender(<OtpField id="otp" label="验证码" value="12" onValueChange={() => {}} readOnly />)
    expect(cells().every((cell) => cell.readOnly)).toBe(true)
    expect(cells()[0]).toHaveValue('1')
  })

  it('carries the step class and the static state class', () => {
    const { container } = render(<Harness size="large" state="focus" />)
    expect(container.querySelector('.otp-field--large')).toBeInTheDocument()
    expect(cells()[0]).toHaveClass('is-focus')
  })

  it('submits the whole code through a hidden field when given a name', () => {
    const { container } = render(<Harness name="verification_code" />)
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    expect(hidden).toHaveAttribute('name', 'verification_code')
    expect(hidden).toHaveValue('')
  })
})
