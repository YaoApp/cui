/* 弹窗宿主：注册表到页面的映射、open/close/isOpen、参数传递、标题走语言包、关闭钮可访问名统一给。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ModalPageHost, useModalPage, type ModalPageRegistry } from './modal-host'
import { Button } from '@/components/base/button'

const registry = {
  captcha: {
    titleKey: 'base.dialog.title',
    descriptionKey: 'base.dialog.description',
    body: ({ params }: { params: { username: string } }) => <p>code for {params.username}</p>,
    footer: ({ close }: { close: () => void }) => (
      <Button type="button" variant="inverse" onClick={close}>
        ok
      </Button>
    ),
  },
  page: {
    titleKey: 'base.dialog.pageTitle',
    size: 'page' as const,
    body: () => <p>page body</p>,
  },
} as unknown as ModalPageRegistry

function Harness() {
  return (
    <ModalPageHost registry={registry}>
      <Opener />
    </ModalPageHost>
  )
}

function Opener() {
  const { open, current } = useModalPage()
  return (
    <>
      <button type="button" onClick={() => open('captcha', { username: 'max' })}>
        open captcha
      </button>
      <button type="button" onClick={() => open('page')}>
        open page
      </button>
      <button type="button" onClick={() => open('missing')}>
        open missing
      </button>
      <span data-testid="state">{current ?? 'none'}</span>
    </>
  )
}

describe('the modal page host', () => {
  it('opens a registered page with its title from the language pack and its params', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'open captcha' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain('编辑资料')
    expect(dialog.textContent).toContain('code for max')
    expect(screen.getByRole('button', { name: '关闭' })).toBeTruthy()
  })

  it('closes from the footer action', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'open captcha' }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'ok' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('takes the page width from the registry entry', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'open page' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog.classList.contains('dialog--page')).toBe(true)
  })

  it('does not render anything before a page is opened', () => {
    render(<Harness />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('ignores a name that is not in the registry', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'open missing' }))
    /* 没登记的名字既不打开面板，也不能让 isOpen 说成打开 */
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('state').textContent).toBe('none')
  })

  it('passes the params of the opened page to its body', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'open captcha' }))
    expect((await screen.findByRole('dialog')).textContent).toContain('code for max')
  })
})
