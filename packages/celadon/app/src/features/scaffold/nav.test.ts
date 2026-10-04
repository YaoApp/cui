import { describe, expect, it } from 'vitest'
import { navWithActive, SCAFFOLD_NAV } from './nav'

describe('navWithActive', () => {
  it('marks the item whose href is the current path', () => {
    const items = navWithActive('/scaffold/routing')
    expect(items.find((i) => i.href === '/scaffold/routing')?.active).toBe(true)
    expect(items.find((i) => i.href === '/')?.active).toBe(false)
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

  it('offers the scaffold pages and a way home', () => {
    expect(SCAFFOLD_NAV.map((i) => i.href)).toEqual([
      '/', '/scaffold', '/scaffold/routing', '/scaffold/bridge', '/scaffold/requests',
    ])
  })
})
