import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Header } from '@/components/header'
import { LocaleSwitch } from '@/components/locale-switch'

/* 语言切换是一个下拉（四种语言塞不进分段控件）。断言用户看到什么 ——
   语言名都是可见选项，默认"跟随系统"并显示解析出的语言，选中后页面文案跟着换。 */
describe('LocaleSwitch', () => {
  it('offers following the system plus every discovered language', () => {
    render(<LocaleSwitch />)
    expect(screen.getByRole('combobox', { name: '语言' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '跟随系统（中文）' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '中文' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '繁體中文' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '日本語' })).toBeInTheDocument()
  })

  it('marks following the system as the selected option by default', () => {
    render(<LocaleSwitch />)
    expect(screen.getByRole('combobox', { name: '语言' })).toHaveValue('system')
  })

  it.each([
    ['zh-TW', '重新整理'],
    ['en-US', 'Refresh'],
    ['ja', '更新'],
  ])('switches the visible copy to %s', async (locale, refresh) => {
    render(
      <>
        <LocaleSwitch />
        <Header title="Hello" />
      </>,
    )

    await userEvent.selectOptions(screen.getByRole('combobox'), locale)

    expect(screen.getByRole('button', { name: refresh })).toBeInTheDocument()
  })

  it('leaves the previous language behind when switching away', async () => {
    render(
      <>
        <LocaleSwitch />
        <Header title="Hello" />
      </>,
    )
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByRole('combobox'), 'ja')

    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '刷新' })).not.toBeInTheDocument()
  })
})
