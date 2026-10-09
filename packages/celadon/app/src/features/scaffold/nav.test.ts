import { describe, expect, it } from 'vitest'
import { navWithActive, SCAFFOLD_NAV } from './nav'

describe('navWithActive', () => {
  it('marks the item whose href is the current path', () => {
    const items = navWithActive('/scaffold/routing')
    expect(items.find((i) => i.href === '/scaffold/routing')?.active).toBe(true)
    expect(items.find((i) => i.href === '/scaffold/home')?.active).toBe(false)
  })

  it('keeps a parent from lighting up when a child is open — the longest match wins', () => {
    const items = navWithActive('/scaffold/routing/w1')
    expect(items.find((i) => i.href === '/scaffold/routing')?.active).toBe(true)
    expect(items.find((i) => i.href === '/scaffold')?.active).toBe(false)
  })

  it('does not treat a sibling with the same prefix as active', () => {
    const items = navWithActive('/scaffold/routingfoo', [{ label: 'nav.routing', href: '/scaffold/routing' }])
    expect(items[0].active).toBe(false)
  })

  it('keeps the longest match when a shorter one comes later', () => {
    const items = navWithActive('/scaffold/routing', [
      { label: 'nav.routing', href: '/scaffold/routing' },
      { label: 'nav.overview', href: '/scaffold' },
    ])
    expect(items.find((i) => i.href === '/scaffold/routing')?.active).toBe(true)
    expect(items.find((i) => i.href === '/scaffold')?.active).toBe(false)
  })

  it('lights nothing up when the path belongs to no item', () => {
    const items = navWithActive('/elsewhere')
    expect(items.every((i) => !i.active)).toBe(true)
  })

  it('offers the scaffold pages and the version page', () => {
    expect(SCAFFOLD_NAV.map((i) => i.href)).toEqual([
      '/scaffold/home', '/scaffold', '/scaffold/routing', '/scaffold/bridge', '/scaffold/requests',
    ])
  })
})
