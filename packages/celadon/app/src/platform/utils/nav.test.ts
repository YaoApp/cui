import { describe, expect, it } from 'vitest'
import { APP_NAV, navWithActive } from '@/platform/utils/nav'

describe('navWithActive', () => {
  it('marks the item whose destination is the current path', () => {
    const items = navWithActive('/app/world')
    expect(items.find((i) => i.href === '/app/world')?.active).toBe(true)
    expect(items.find((i) => i.href === '/app/hello')?.active).toBe(false)
  })

  it('keeps the item active on its children, so a detail page still shows where it is', () => {
    expect(navWithActive('/app/world/w1').find((i) => i.href === '/app/world')?.active).toBe(true)
  })

  it('does not match a sibling with the same prefix', () => {
    expect(navWithActive('/app/worldwide').find((i) => i.href === '/app/world')?.active).toBe(false)
  })

  it('ships two destinations', () => {
    expect(APP_NAV.map((i) => i.href)).toEqual(['/app/hello', '/app/world'])
  })
})
