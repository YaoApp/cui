import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Nav, type NavItem } from '@/components/nav'

const ITEMS: NavItem[] = [
  { label: 'Hello', href: '/main/hello', active: true },
  { label: 'World', href: '/main/world' },
]

describe('Nav', () => {
  it('renders real links, so they can be copied and opened in a new tab', () => {
    render(<Nav items={ITEMS} label="应用导航" />)
    expect(screen.getByRole('link', { name: 'Hello' })).toHaveAttribute('href', '/main/hello')
  })

  it('marks the current one for assistive tech and with the design class', () => {
    render(<Nav items={ITEMS} label="应用导航" />)
    const hello = screen.getByRole('link', { name: 'Hello' })
    expect(hello).toHaveAttribute('aria-current', 'page')
    expect(hello).toHaveClass('nav-item', 'is-active')
    expect(screen.getByRole('link', { name: 'World' })).not.toHaveAttribute('aria-current')
  })

  it('hands the click to the caller instead of reloading the page', async () => {
    const onSelect = vi.fn()
    render(<Nav items={ITEMS} label="应用导航" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('link', { name: 'World' }))
    expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
  })

  it('leaves a plain click alone when nobody intercepts it', async () => {
    const onSelect = vi.fn()
    render(<Nav items={ITEMS} label="应用导航" />)
    await userEvent.click(screen.getByRole('link', { name: 'World' }))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
