/* 弹窗页面：受控开关、标题与说明的关联、关闭钮的可访问名、底部操作区、宽度档与点遮罩不关。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DialogPage } from './dialog'

function Harness({ onOpenChange }: { onOpenChange?: (open: boolean) => void } = {}) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open again
      </button>
      <DialogPage
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          onOpenChange?.(next)
        }}
        title="标题"
        description="说明"
        closeLabel="关闭"
        footer={<button type="button">确定</button>}
      >
        <p>正文</p>
      </DialogPage>
    </>
  )
}

describe('the dialog page', () => {
  it('renders the shell with the title, the description and the footer wired to the role', async () => {
    render(<Harness />)
    const dialog = await screen.findByRole('dialog')
    expect(dialog.classList.contains('dialog')).toBe(true)
    /* 宽度档默认是表单档，页面档要显式传 */
    expect(dialog.classList.contains('dialog--page')).toBe(false)
    const title = screen.getByText('标题')
    const description = screen.getByText('说明')
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id)
    expect(dialog.getAttribute('aria-describedby')).toBe(description.id)
    expect(screen.getByRole('button', { name: '关闭' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '确定' })).toBeTruthy()
    expect(screen.getByText('正文')).toBeTruthy()
  })

  it('closes from the close button and reports the change', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onOpenChange={onOpenChange} />)
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: '关闭' }))
    /* 上游回调带第二个参数（事件详情），只断言开关值 */
    await waitFor(() => expect(onOpenChange.mock.calls[0]?.[0]).toBe(false))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('keeps the dialog open on a backdrop click when the caller asks for it', async () => {
    const user = userEvent.setup()
    render(
      <DialogPage open onOpenChange={() => undefined} title="标题" closeLabel="关闭" disablePointerDismissal>
        <p>正文</p>
      </DialogPage>,
    )
    await screen.findByRole('dialog')
    const scrim = document.querySelector('.dialog__scrim') as HTMLElement
    await user.click(scrim)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('renders the page width class when the caller asks for it', async () => {
    render(
      <DialogPage open onOpenChange={() => undefined} title="标题" closeLabel="关闭" size="page">
        <p>正文</p>
      </DialogPage>,
    )
    const dialog = await screen.findByRole('dialog')
    expect(dialog.classList.contains('dialog--page')).toBe(true)
  })

  it('renders without a description or a footer', async () => {
    render(
      <DialogPage open onOpenChange={() => undefined} title="标题" closeLabel="关闭">
        <p>正文</p>
      </DialogPage>,
    )
    const dialog = await screen.findByRole('dialog')
    expect(dialog.getAttribute('aria-describedby')).toBeNull()
    expect(document.querySelector('.dialog__foot')).toBeNull()
  })

  it('puts the initial focus on the panel itself, not on the close button', async () => {
    render(
      <DialogPage open onOpenChange={() => undefined} title="标题" closeLabel="关闭">
        <p>正文</p>
      </DialogPage>,
    )
    const dialog = await screen.findByRole('dialog')
    /* 上游默认聚焦第一个可聚焦元素，也就是头部的关闭钮；本组件改为聚焦面板本身。
       聚焦发生在挂载后的副作用里，因此用 waitFor 等它落定。 */
    await waitFor(() => expect(document.activeElement).toBe(dialog))
    expect(dialog.getAttribute('tabindex')).toBe('-1')
    expect(screen.getByRole('button', { name: '关闭' })).not.toBe(document.activeElement)
  })

  it('lets the caller pick a different initial target', async () => {
    render(
      <DialogPage open onOpenChange={() => undefined} title="标题" closeLabel="关闭" initialFocus={false}>
        <p>正文</p>
      </DialogPage>,
    )
    await screen.findByRole('dialog')
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: '关闭' }))
  })

  it('reports the completed transition to the caller', async () => {
    const onOpenChangeComplete = vi.fn()
    render(
      <DialogPage
        open
        onOpenChange={() => undefined}
        onOpenChangeComplete={onOpenChangeComplete}
        title="标题"
        closeLabel="关闭"
      >
        <p>正文</p>
      </DialogPage>,
    )
    await screen.findByRole('dialog')
    await waitFor(() => expect(onOpenChangeComplete.mock.calls.some(([value]) => value === true)).toBe(true))
  })
})
