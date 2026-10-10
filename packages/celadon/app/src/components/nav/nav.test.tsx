import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Nav } from './nav'
import type { NavItem } from './nav.types'

const items: NavItem[] = [
  { key: 'new', icon: 'i-plus', labelKey: 'shell.navigation.item.new', to: '/inbox' },
  { key: 'inbox', icon: 'i-inbox', labelKey: 'shell.navigation.item.inbox', to: '/inbox', badge: 3, active: true },
  { key: 'board', icon: 'i-board', labelKey: 'shell.navigation.item.board', to: '/board' },
  { key: 'computer', icon: 'i-pc', labelKey: 'shell.navigation.item.computer', to: '/computer' },
]

const shortcuts = items.filter((item) => item.key === 'computer')

function renderNav(props: Partial<Parameters<typeof Nav>[0]> = {}) {
  const onSelect = props.onSelect ?? vi.fn()
  const onToggle = props.onToggle ?? vi.fn()
  const onToggleMain = props.onToggleMain ?? vi.fn()
  render(
    <MemoryRouter>
      <Nav
        items={items}
        shortcuts={shortcuts}
        scene="shell.navigation.scene.none"
        sceneIcon="i-inbox"
        accountName="Wren"
        collapsed={false}
        onToggle={onToggle}
        mainFolded={false}
        onToggleMain={onToggleMain}
        onSelect={onSelect}
        {...props}
      />
    </MemoryRouter>,
  )
  return { onSelect, onToggle, onToggleMain }
}

describe('Nav', () => {
  it('renders the entry list, the current row and the footer', () => {
    renderNav()
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeVisible()
    expect(screen.getByRole('link', { name: '看板' })).toBeVisible()
    /* 展开时两区之间是分割线，没有「当前」那一行 */
    expect(screen.queryByRole('button', { name: '无' })).toBeNull()
    expect(screen.getByText('Wren')).toBeVisible()
  })

  it('marks the current destination and shows the unread badge', () => {
    renderNav()
    expect(screen.getByRole('link', { name: '收件箱' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('3')).toBeVisible()
  })

  it('hands a plain click to the caller and leaves modified clicks to the browser', async () => {
    const { onSelect } = renderNav()
    await userEvent.click(screen.getByRole('link', { name: '看板' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    /* 带修饰键的点击交还浏览器：新标签、新窗口、下载都靠它 */
    fireEvent.click(screen.getByRole('link', { name: '看板' }), { metaKey: true })
    fireEvent.click(screen.getByRole('link', { name: '看板' }), { ctrlKey: true })
    fireEvent.click(screen.getByRole('link', { name: '看板' }), { button: 1 })
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('folds the main navigation and shows the current row with the unfold key', () => {
    renderNav({ mainFolded: true })
    expect(document.querySelector('.nav__main--folded')).not.toBeNull()
    /* 折叠才出现「当前」那一行与展开键，与展开互斥；行内是场景图标 + 场景名 + 向上图标 */
    const row = screen.getByRole('button', { name: '无' })
    expect(row).toBeVisible()
    expect(row).toHaveTextContent('无')
    expect(screen.getByRole('button', { name: '展开主导航' })).toBeVisible()
    /* 上区的折叠键让位 */
    expect(screen.queryByRole('button', { name: '折叠主导航' })).toBeNull()
  })

  it('collapses the whole column and hides the text labels', () => {
    renderNav({ collapsed: true })
    expect(document.querySelector('.nav--collapsed')).not.toBeNull()
  })

  it('calls both toggles from their own keys', async () => {
    const { onToggle, onToggleMain } = renderNav()
    await userEvent.click(screen.getByRole('button', { name: '收起导航' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: '折叠主导航' }))
    expect(onToggleMain).toHaveBeenCalledTimes(1)
  })

  it('renders the scene slot when the domain provides one', () => {
    renderNav({ children: <p>二级导航</p> })
    expect(screen.getByText('二级导航')).toBeVisible()
  })
})
