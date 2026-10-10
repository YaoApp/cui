import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Browser } from './browser'
import type { BrowserTab } from './browser'

const tabs: BrowserTab[] = [
  { key: 'browser-home:home', label: '首页', closable: false },
  { key: 'browser-web:example.com', label: 'example.com', closable: true },
]

function renderBrowser(props: Partial<Parameters<typeof Browser>[0]> = {}) {
  const onActivate = vi.fn()
  const onClose = vi.fn()
  const onNew = vi.fn()
  const onMove = vi.fn()
  const onCollapse = vi.fn()
  render(
    <Browser
      tabs={tabs}
      activeKey="browser-home:home"
      side="right"
      onActivate={onActivate}
      onClose={onClose}
      onNew={onNew}
      onMove={onMove}
      onCollapse={onCollapse}
      {...props}
    >
      <p>首页内容</p>
    </Browser>,
  )
  return { onActivate, onClose, onNew, onMove, onCollapse }
}

describe('Browser', () => {
  it('draws the tab strip, the three actions and the current page', () => {
    renderBrowser()
    expect(screen.getByRole('tablist', { name: '标签浏览器' })).toBeVisible()
    expect(screen.getByRole('tab', { name: '首页' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: '新建标签' })).toBeVisible()
    expect(screen.getByRole('button', { name: '换到另一侧' })).toBeVisible()
    expect(screen.getByRole('button', { name: '收掉这一栏' })).toBeVisible()
    expect(screen.getByText('首页内容')).toBeVisible()
  })

  it('never offers a close key on the home tab', () => {
    renderBrowser()
    const home = screen.getByRole('tab', { name: '首页' }).closest('.browser__tab')
    expect(home?.querySelectorAll('button')).toHaveLength(1)
  })

  it('activates and closes pages through the caller', async () => {
    const { onActivate, onClose } = renderBrowser()
    await userEvent.click(screen.getByRole('tab', { name: 'example.com' }))
    expect(onActivate).toHaveBeenCalledWith('browser-web:example.com')
    await userEvent.click(screen.getByRole('button', { name: '关闭这个标签' }))
    expect(onClose).toHaveBeenCalledWith('browser-web:example.com')
  })

  it('reports its side and the three actions', async () => {
    const { onNew, onMove, onCollapse } = renderBrowser({ side: 'left' })
    expect(screen.getByRole('complementary')).toHaveAttribute('data-side', 'left')
    await userEvent.click(screen.getByRole('button', { name: '新建标签' }))
    await userEvent.click(screen.getByRole('button', { name: '换到另一侧' }))
    await userEvent.click(screen.getByRole('button', { name: '收掉这一栏' }))
    expect(onNew).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onCollapse).toHaveBeenCalledTimes(1)
  })
})
