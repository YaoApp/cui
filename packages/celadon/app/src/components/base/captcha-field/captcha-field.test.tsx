import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/* 基础件只保证行为与可访问性：标签关联、值回传、禁用、错误上屏、取图三态与 captcha_id 的交接。
   取图环境照 `features/scaffold/requests/requests.test.tsx` 的现行做法：换掉平台出口
   `@/platform/transport/fetch`，于是走的是真的 `send`（服务信息 → 地址 → 出口 → 解包裹）。
   视觉（图片本身、控件几何）不在这里断言，那是浏览器层的事。 */

const SERVICE = { name: 'Yao Agents', version: '1.0.0', openapi: '/v1' }
const CAPTCHA = { captcha_id: 'captcha-one', captcha_image: 'data:image/png;base64,AAAA' }
const REFRESH = '换一张'

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))

import { transportFetch } from '@/platform/transport/fetch'
import { resetServiceInfo } from '@/platform/service'
import { CaptchaField } from './captcha-field'

function json(value: unknown, status = 200) {
  return { ok: true as const, value: new Response(JSON.stringify(value), { status }) }
}

function failure(code: string, message: string) {
  return { ok: false as const, code, params: { url: '/v1/user/entry/captcha' }, message }
}

/** 这一次调用是不是取图（服务信息那条不算）。 */
const captchaCalls = () =>
  vi.mocked(transportFetch).mock.calls.filter(([url]) => String(url).includes('/user/entry/captcha'))

/** 默认的假出口：服务信息照常给，取图给一张成功回应。 */
function mockSuccess() {
  vi.mocked(transportFetch).mockImplementation(async (url) => {
    if (String(url).includes('/.well-known/yao')) return json(SERVICE)
    return json(CAPTCHA)
  })
}

function renderField(props: {
  id?: string
  label?: string
  value?: string
  onValueChange?: (value: string) => void
  onCaptchaIdChange?: (captchaId: string) => void
  error?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
} = {}) {
  const onValueChange = props.onValueChange ?? vi.fn()
  render(
    <CaptchaField
      id="captcha"
      label="图形验证码"
      value=""
      onValueChange={onValueChange}
      refreshLabel={REFRESH}
      imageAlt="图形验证码图片"
      {...props}
    />,
  )
  return { onValueChange }
}

describe('CaptchaField', () => {
  beforeEach(() => {
    vi.mocked(transportFetch).mockReset()
    resetServiceInfo()
    mockSuccess()
  })

  it('associates the label with the input and keeps the design class', async () => {
    renderField()

    const input = screen.getByLabelText('图形验证码')
    expect(input).toHaveClass('input')
    expect(input).toHaveAttribute('id', 'captcha')
    /* 取图真的发了出去：受控包装要能真取图 */
    await waitFor(() => expect(captchaCalls().length).toBeGreaterThan(0))
  })

  it('gives the refresh control an accessible name', async () => {
    renderField()

    const control = screen.getByRole('button', { name: REFRESH })
    expect(control).toHaveClass('captcha-field__control')
    await waitFor(() => expect(captchaCalls().length).toBeGreaterThan(0))
  })

  it('hands the typed value back to the caller', async () => {
    const { onValueChange } = renderField()
    await screen.findByRole('img')

    await userEvent.type(screen.getByLabelText('图形验证码'), 'ab')
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange).toHaveBeenLastCalledWith('b')
  })

  it('disables both the input and the refresh control', async () => {
    renderField({ disabled: true })

    expect(screen.getByLabelText('图形验证码')).toBeDisabled()
    expect(screen.getByRole('button', { name: REFRESH })).toBeDisabled()
    await waitFor(() => expect(captchaCalls().length).toBeGreaterThan(0))
  })

  it('shows the caller error and links it to the control', async () => {
    renderField({ error: '验证码不正确' })
    await screen.findByRole('img')

    expect(screen.getByLabelText('图形验证码')).toHaveAttribute('aria-describedby', 'captcha-error')
    expect(screen.getByText('验证码不正确')).toHaveClass('hint-error')
  })

  it('shows the failure message and a clickable retry when the fetch fails', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      if (String(url).includes('/.well-known/yao')) return json(SERVICE)
      return failure('transport.network', 'request failed')
    })
    renderField()

    /* 取图失败由组件自己上屏：按码翻成用户文案，控件上给可点的重试文字 */
    expect(await screen.findByText(/网络不通/)).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: REFRESH })
    expect(retry).toBeEnabled()
    expect(retry).toHaveTextContent(REFRESH)

    /* 点重试就是再发一次取图 */
    const before = captchaCalls().length
    await userEvent.click(retry)
    await waitFor(() => expect(captchaCalls().length).toBeGreaterThan(before))
  })

  it('hands the captcha id to the caller after a successful fetch', async () => {
    const onCaptchaIdChange = vi.fn()
    renderField({ onCaptchaIdChange })

    await waitFor(() => expect(onCaptchaIdChange).toHaveBeenCalledWith(CAPTCHA.captcha_id))
  })

  it('renders the returned image with the given alternative text', async () => {
    renderField()

    const image = await screen.findByRole('img')
    expect(image).toHaveClass('captcha-field__picture')
    expect(image).toHaveAttribute('src', CAPTCHA.captcha_image)
    expect(image).toHaveAttribute('alt', '图形验证码图片')
  })

  it('sends another request when the refresh control is clicked', async () => {
    renderField()
    await screen.findByRole('img')
    const before = captchaCalls().length

    await userEvent.click(screen.getByRole('button', { name: REFRESH }))

    await waitFor(() => expect(captchaCalls().length).toBe(before + 1))
  })

  it('prefers the caller error over the component failure message', async () => {
    vi.mocked(transportFetch).mockImplementation(async (url) => {
      if (String(url).includes('/.well-known/yao')) return json(SERVICE)
      return failure('transport.network', 'request failed')
    })
    renderField({ error: '验证码不正确' })

    expect(await screen.findByText('验证码不正确')).toBeInTheDocument()
    expect(screen.queryByText(/网络不通/)).toBeNull()
  })
})
