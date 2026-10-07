/* 人机验证控件：脚本只加载一次、令牌交回调用方、过期与出错都回空串。 */
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TurnstileField } from './turnstile-field'

type RenderOptions = {
  sitekey: string
  theme?: string
  callback?: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
}

/** 装一个假的全局接口：真实控件是第三方 iframe，这里只核我们与它的契约。 */
function stubTurnstile() {
  const remove = vi.fn()
  const renderWidget = vi.fn((_container: HTMLElement, options: RenderOptions) => {
    options.callback?.('token-1')
    return 'widget-1'
  })
  ;(window as unknown as { turnstile?: unknown }).turnstile = { render: renderWidget, remove }
  return { renderWidget, remove }
}

afterEach(() => {
  delete (window as unknown as { turnstile?: unknown }).turnstile
  document.querySelectorAll('script[src*="turnstile"]').forEach((script) => script.remove())
})

describe('the turnstile field', () => {
  it('renders the widget with the sitekey and hands the token to the caller', async () => {
    const { renderWidget } = stubTurnstile()
    const onTokenChange = vi.fn()
    render(<TurnstileField sitekey="site-1" label="人机验证" onTokenChange={onTokenChange} />)

    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1))
    expect(renderWidget.mock.calls[0][1].sitekey).toBe('site-1')
    /* 主题按根元素当前的 data-theme 定；用例不假定它一定是哪一档，按当前值核对 */
    const expectedTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    expect(renderWidget.mock.calls[0][1].theme).toBe(expectedTheme)
    await waitFor(() => expect(onTokenChange).toHaveBeenCalledWith('token-1'))
  })

  it('lets the caller force the theme', async () => {
    const { renderWidget } = stubTurnstile()
    render(<TurnstileField sitekey="site-1" label="人机验证" theme="light" onTokenChange={() => undefined} />)
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1))
    expect(renderWidget.mock.calls[0][1].theme).toBe('light')
  })

  it('gives an empty token back when the widget errors or expires', async () => {
    const { renderWidget } = stubTurnstile()
    const onTokenChange = vi.fn()
    render(<TurnstileField sitekey="site-1" label="人机验证" onTokenChange={onTokenChange} />)
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1))

    const options = renderWidget.mock.calls[0][1]
    onTokenChange.mockClear()
    options['error-callback']?.()
    options['expired-callback']?.()
    expect(onTokenChange).toHaveBeenNthCalledWith(1, '')
    expect(onTokenChange).toHaveBeenNthCalledWith(2, '')
  })

  it('takes the widget away when it unmounts', async () => {
    const { renderWidget, remove } = stubTurnstile()
    const { unmount } = render(<TurnstileField sitekey="site-1" label="人机验证" onTokenChange={() => undefined} />)
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(1))
    unmount()
    expect(remove).toHaveBeenCalledWith('widget-1')
  })

  it('shows the error text and carries the accessible name of the field', async () => {
    stubTurnstile()
    render(<TurnstileField sitekey="site-1" label="人机验证" error="请先完成人机验证" onTokenChange={() => undefined} />)
    expect(await screen.findByRole('group', { name: '人机验证' })).toBeTruthy()
    expect(screen.getByText('请先完成人机验证')).toBeTruthy()
    expect(document.querySelector('.turnstile-field')?.classList.contains('is-error')).toBe(true)
  })
})
