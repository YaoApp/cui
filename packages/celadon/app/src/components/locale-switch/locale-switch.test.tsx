import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Header } from '@/components/header'
import { LocaleSwitch } from '@/components/locale-switch'

/* 分段控件：一组互斥语言。断言用户看到什么 —— 点选后页面文案跟着换。 */
describe('LocaleSwitch', () => {
  it('offers every discovered language', () => {
    render(<LocaleSwitch />)
    expect(screen.getByRole('button', { name: '中文' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
  })

  it('marks the current language, visually and for assistive tech', async () => {
    render(<LocaleSwitch />)
    expect(screen.getByRole('button', { name: '中文' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '中文' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches the visible copy to the chosen language', async () => {
    render(
      <>
        <LocaleSwitch />
        <Header title="Hello" />
      </>,
    )
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '刷新' })).not.toBeInTheDocument()
  })
})
