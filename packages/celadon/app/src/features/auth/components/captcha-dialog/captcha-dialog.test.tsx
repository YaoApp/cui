/* 验证码弹窗：只验它自己的三件事 —— 关着不渲染、图形验证码能收能提交、取消会关。 */
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/platform/transport/fetch', () => ({ transportFetch: vi.fn() }))

import { transportFetch } from '@/platform/transport/fetch'
import { i18n } from '@/platform/i18n'
import { CaptchaDialog, type CaptchaDialogProps } from './captcha-dialog'

const t = (key: string) => i18n.t(key as never) as unknown as string

function json(value: unknown) {
  return { ok: true as const, value: new Response(JSON.stringify(value)) }
}

beforeEach(() => {
  vi.mocked(transportFetch).mockReset()
  vi.mocked(transportFetch).mockImplementation(async (url) => {
    const target = String(url)
    if (target.includes('/.well-known/yao')) return json({ name: 'Yao Dev', version: '1.0.0', openapi: '/v1' })
    if (target.includes('/user/entry/captcha')) return json({ captcha_id: 'captcha-1', captcha_image: 'data:image/gif;base64,R0lGOD' })
    return json({})
  })
})

/** 受控的宿主：值改在弹窗外面，与真实页面的用法一致。 */
function Harness(props: Partial<CaptchaDialogProps> = {}) {
  const [value, setValue] = useState('')
  const [, setCaptchaId] = useState('')
  return (
    <CaptchaDialog
      open
      onOpenChange={() => undefined}
      type="image"
      round={1}
      value={value}
      onValueChange={setValue}
      onCaptchaIdChange={setCaptchaId}
      pending={false}
      onSubmit={() => undefined}
      {...props}
    />
  )
}

describe('the captcha dialog', () => {
  it('renders nothing while it is closed', () => {
    render(<Harness open={false} />)
    expect(screen.queryByText(t('auth.dialog.captchaTitle'))).toBeNull()
  })

  it('collects the image captcha and submits the form', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<Harness onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(t('auth.captcha.label')), 'a1b2')
    await user.click(screen.getByRole('button', { name: t('auth.action.confirm') }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('closes through the cancel button', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: t('auth.action.cancel') }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders the turnstile widget when the configuration asks for it', async () => {
    render(<Harness type="turnstile" sitekey="site-key" />)
    expect(screen.getByRole('group', { name: t('auth.captcha.turnstile') })).toBeTruthy()
  })

  it('focuses the input for an image captcha', async () => {
    render(<Harness type="image" />)
    const input = await screen.findByLabelText(t('auth.captcha.label'))
    await waitFor(() => expect(document.activeElement).toBe(input))
  })

  it('leaves the focus alone for the turnstile widget', async () => {
    /* 焦点要留在打开它的那个控件上：只断言关闭钮没焦点不够 —— 焦点落到面板本身也会漏过（上游的默认行为） */
    function Opener() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            打开
          </button>
          <CaptchaDialog
            open={open}
            onOpenChange={setOpen}
            type="turnstile"
            sitekey="site-key"
            round={1}
            value=""
            onValueChange={() => undefined}
            onCaptchaIdChange={() => undefined}
            pending={false}
            onSubmit={() => undefined}
          />
        </>
      )
    }
    const user = userEvent.setup()
    render(<Opener />)
    const trigger = screen.getByRole('button', { name: '打开' })

    await user.click(trigger)
    await screen.findByRole('group', { name: t('auth.captcha.turnstile') })
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(document.activeElement).toBe(trigger)
  })

  it('closes through the dialog itself', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onOpenChange={onOpenChange} />)

    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
