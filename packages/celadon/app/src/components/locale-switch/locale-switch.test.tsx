import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LocaleSwitch } from '@/components/locale-switch'
import { useTranslation } from '@/platform/i18n'

/* 语言切换是一个下拉（四种语言塞不进分段控件）。断言用户看到什么 ——
   语言名都是可见选项，默认"跟随系统"并显示解析出的语言，选中后页面文案跟着换。
   它现在是基础件 Select（Base UI 的 listbox），选项在展开后才渲染，所以先点开再选。 */
/** 翻译探针：只借它看"刷新"这个词随语言变 —— 页头现在归脚手架，组件测试不许向上引。 */
function RefreshProbe() {
  const { t } = useTranslation()
  return <button type="button">{t('header.refresh')}</button>
}

describe('LocaleSwitch', () => {
  it('offers following the system plus every discovered language', async () => {
    const user = userEvent.setup()
    render(<LocaleSwitch />)
    expect(screen.getByRole('combobox', { name: '语言' })).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: '语言' }))

    expect(await screen.findByRole('option', { name: '跟随系统（中文）' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '中文' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '繁體中文' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '日本語' })).toBeInTheDocument()
  })

  it('shows following the system, with the resolved language, as the default choice', () => {
    render(<LocaleSwitch />)
    expect(screen.getByRole('combobox', { name: '语言' })).toHaveTextContent('跟随系统（中文）')
  })

  it('wears the toolbar form: plain trigger, globe at the end, no dropdown indicator', () => {
    render(<LocaleSwitch />)
    const trigger = screen.getByRole('combobox', { name: '语言' })
    expect(trigger).toHaveClass('select-trigger--plain')

    /* 值在前、图标在后：触发器里最后一个孩子是图标槽，且不画下拉指示器（图标自己承担提示） */
    const lead = trigger.querySelector('.select__lead')
    expect(lead).toBeInTheDocument()
    expect(lead?.querySelector('use')?.getAttribute('href')).toBe('#i-globe')
    expect(trigger.lastElementChild).toBe(lead)
    expect(trigger.querySelector('.select-icon')).not.toBeInTheDocument()
  })

  it('switches to the field form on request', () => {
    render(<LocaleSwitch variant="field" size="large" />)
    const trigger = screen.getByRole('combobox', { name: '语言' })
    expect(trigger).not.toHaveClass('select-trigger--plain')
    expect(trigger).toHaveClass('select-trigger--large')
  })

  it.each([
    ['Traditional Chinese', '繁體中文', '重新整理'],
    ['English', 'English', 'Refresh'],
    ['Japanese', '日本語', '更新'],
  ])('switches the visible copy to %s', async (_label, option, refresh) => {
    const user = userEvent.setup()
    render(
      <>
        <LocaleSwitch />
        <RefreshProbe />
      </>,
    )

    await user.click(screen.getByRole('combobox', { name: '语言' }))
    await user.click(await screen.findByRole('option', { name: option }))

    expect(screen.getByRole('button', { name: refresh })).toBeInTheDocument()
  })

  it('leaves the previous language behind when switching away', async () => {
    const user = userEvent.setup()
    render(
      <>
        <LocaleSwitch />
        <RefreshProbe />
      </>,
    )
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: '语言' }))
    await user.click(await screen.findByRole('option', { name: '日本語' }))

    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '刷新' })).not.toBeInTheDocument()
  })
})
