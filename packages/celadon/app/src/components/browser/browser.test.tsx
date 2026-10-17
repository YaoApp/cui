import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Browser } from './browser'
import type { BrowserTab } from './browser'

const tabs: BrowserTab[] = [
  { key: 'home', label: '首页', closable: false, icon: 'i-home' },
  { key: 'page-1', label: 'example.com', closable: true },
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
      activeKey="home"
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
  it('draws the tab strip, the more key, the window keys and the current page', () => {
    renderBrowser()
    expect(screen.getByRole('tablist', { name: '主栏标签' })).toBeVisible()
    expect(screen.getByRole('tab', { name: '首页' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: '新建标签' })).toBeVisible()
    // 新建键不在 tablist 里：它不是一个标签，读屏不该把它念成标签
    expect(screen.getByRole('tablist', { name: '主栏标签' })).not.toContainElement(
      screen.getByRole('button', { name: '新建标签' })
    )
    // 分屏收进下拉，顶栏只留新建、下拉与后段两颗窗口键
    expect(screen.queryByRole('button', { name: '左右分栏' })).toBeNull()
    expect(screen.queryByRole('button', { name: '上下分栏' })).toBeNull()
    expect(screen.getByRole('button', { name: '更多' })).toBeVisible()
    expect(screen.getByRole('button', { name: '面板独占窗口' })).toBeVisible()
    expect(screen.getByRole('button', { name: '收掉这一栏' })).toBeVisible()
    expect(screen.getByText('首页内容')).toBeVisible()
  })

  it('draws every tab from the model and keeps the close key off the home page', () => {
    renderBrowser()
    const home = screen.getByRole('tab', { name: '首页' }).closest('.browser__tab')
    // 还是首页那一页：不画关闭键；图形由模型给
    expect(home?.querySelectorAll('.browser__tab-close')).toHaveLength(0)
    expect(home?.querySelector('.browser__tab-main')).not.toBeNull()
    expect(home?.querySelector('svg use')?.getAttribute('href')).toBe('#i-home')
    // 普通一页有关闭键
    const page = screen.getByRole('tab', { name: 'example.com' }).closest('.browser__tab')
    expect(page?.querySelectorAll('.browser__tab-close')).toHaveLength(1)
  })

  it('activates and closes pages through the caller', async () => {
    const { onActivate, onClose } = renderBrowser()
    await userEvent.click(screen.getByRole('tab', { name: 'example.com' }))
    expect(onActivate).toHaveBeenCalledWith('page-1')
    await userEvent.click(screen.getByRole('button', { name: '关闭这个标签' }))
    expect(onClose).toHaveBeenCalledWith('page-1')
  })

  it('reports its side, the four keys and the three menu actions', async () => {
    const onMove = vi.fn()
    const onCollapse = vi.fn()
    const onExclusive = vi.fn()
    const onSplit = vi.fn()
    const { onNew } = renderBrowser({
      side: 'left',
      width: 800,
      onMove,
      onCollapse,
      onExclusive,
      onSplit,
    })
    expect(screen.getByRole('complementary')).toHaveAttribute('data-side', 'left')
    await userEvent.click(screen.getByRole('button', { name: '新建标签' }))
    expect(onNew).toHaveBeenCalledTimes(1)

    // 后段两颗键：最大化/恢复与关闭，不再进菜单
    await userEvent.click(screen.getByRole('button', { name: '面板独占窗口' }))
    expect(onExclusive).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: '收掉这一栏' }))
    expect(onCollapse).toHaveBeenCalledTimes(1)

    // 菜单里的三项：换到另一侧 · 左右分栏 · 上下分栏
    await userEvent.click(screen.getByRole('button', { name: '更多' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: '换到另一侧' }))
    expect(onMove).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: '更多' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: '左右分栏' }))
    expect(onSplit).toHaveBeenCalledWith('columns')
    await userEvent.click(screen.getByRole('button', { name: '更多' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: '上下分栏' }))
    expect(onSplit).toHaveBeenCalledWith('rows')
  })
})
