import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Nav, type NavItem } from '@/features/scaffold/components/nav'

const ITEMS: NavItem[] = [
  { label: 'Hello', href: '/hello', icon: 'i-spark', active: true },
  { label: 'World', href: '/world', icon: 'i-ws' },
]

describe('Nav', () => {
  it('renders real links, so they can be copied and opened in a new tab', () => {
    render(<Nav items={ITEMS} label="应用导航" />)
    expect(screen.getByRole('link', { name: 'Hello' })).toHaveAttribute('href', '/hello')
  })

  it('marks the current one for assistive tech and with the design class', () => {
    render(<Nav items={ITEMS} label="应用导航" />)
    const hello = screen.getByRole('link', { name: 'Hello' })
    expect(hello).toHaveAttribute('aria-current', 'page')
    expect(hello).toHaveClass('nav-item', 'is-active')
    expect(screen.getByRole('link', { name: 'World' })).not.toHaveAttribute('aria-current')
  })

  it('shows each item\'s icon, and nothing when an item has none', () => {
    const { container } = render(
      <Nav items={[...ITEMS, { label: 'NoIcon', href: '/plain' }]} label="应用导航" />,
    )
    const links = [...container.querySelectorAll('a.nav__link')]
    expect(links[0].querySelector('use')?.getAttribute('href')).toBe('#i-spark')
    expect(links[1].querySelector('use')?.getAttribute('href')).toBe('#i-ws')
    expect(links[2].querySelector('svg')).toBeNull()
  })

  it('hands the click to the caller instead of reloading the page', async () => {
    const onSelect = vi.fn()
    render(<Nav items={ITEMS} label="应用导航" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('link', { name: 'World' }))
    expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
  })

  it('leaves a modified click to the browser instead of taking it over', () => {
    const onSelect = vi.fn()
    render(<Nav items={ITEMS} label="应用导航" onSelect={onSelect} />)

    // 修饰键点击是"新标签 / 新窗口"：调用方不许收到选中事件
    fireEvent.click(screen.getByRole('link', { name: 'World' }), { metaKey: true })
    expect(onSelect).not.toHaveBeenCalled()

    // 主键点击才归调用方
    fireEvent.click(screen.getByRole('link', { name: 'World' }))
    expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
  })
})
