/* 确认框与抽屉：同一套面板样式，只核对各自的行为差别（确认框不可点遮罩关闭、抽屉的停靠边）。 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AlertDialog } from '@/components/base/alert-dialog'
import { Drawer } from '@/components/base/drawer'

describe('the alert dialog', () => {
  it('renders the confirmation with both actions and no close button', async () => {
    render(
      <AlertDialog
        open
        onOpenChange={() => undefined}
        title="删除这个工作空间？"
        description="删除后无法恢复。"
        confirm="删除"
        cancel="取消"
      />,
    )
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog.textContent).toContain('删除这个工作空间？')
    expect(screen.getByRole('button', { name: '删除' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '取消' })).toBeTruthy()
    /* 出口只有底部两个操作，界面上没有关闭钮 */
    expect(screen.queryByRole('button', { name: '关闭' })).toBeNull()
  })

  it('does not close on a backdrop click', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<AlertDialog open onOpenChange={onOpenChange} title="标题" confirm="好" cancel="取消" />)
    await screen.findByRole('alertdialog')
    await user.click(document.querySelector('.dialog__scrim') as HTMLElement)
    expect(screen.getByRole('alertdialog')).toBeTruthy()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closes from the cancel action', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<AlertDialog open onOpenChange={onOpenChange} title="标题" confirm="好" cancel="取消" />)
    await screen.findByRole('alertdialog')
    await user.click(screen.getByRole('button', { name: '取消' }))
    await waitFor(() => expect(onOpenChange.mock.calls[0]?.[0]).toBe(false))
  })
})

describe('the drawer', () => {
  it('renders on the start side by default and on the end side when asked', async () => {
    const { rerender } = render(
      <Drawer open onOpenChange={() => undefined} title="导航" closeLabel="关闭">
        <p>内容</p>
      </Drawer>,
    )
    const popup = await screen.findByRole('dialog')
    expect(popup.classList.contains('drawer')).toBe(true)
    expect(popup.classList.contains('drawer--end')).toBe(false)

    rerender(
      <Drawer open onOpenChange={() => undefined} title="筛选" closeLabel="关闭" side="end">
        <p>内容</p>
      </Drawer>,
    )
    expect((await screen.findByRole('dialog')).classList.contains('drawer--end')).toBe(true)
  })

  it('closes from the close button and puts the initial focus on the panel', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Drawer open onOpenChange={onOpenChange} title="导航" closeLabel="关闭">
        <p>内容</p>
      </Drawer>,
    )
    const panel = await screen.findByRole('dialog')
    /* 与弹窗同一条约定：焦点交给面板本身，不落在关闭钮上 */
    await waitFor(() => expect(document.activeElement).toBe(panel))
    await user.click(screen.getByRole('button', { name: '关闭' }))
    await waitFor(() => expect(onOpenChange.mock.calls[0]?.[0]).toBe(false))
  })
})
