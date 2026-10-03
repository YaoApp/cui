import { describe, expect, it } from 'vitest'
import { APP_NAV, navWithActive } from '@/platform/utils/nav'

describe('navWithActive', () => {
  it('marks the item whose destination is the current path', () => {
    const items = navWithActive('/world')
    expect(items.find((i) => i.href === '/world')?.active).toBe(true)
    expect(items.find((i) => i.href === '/hello')?.active).toBe(false)
  })

  it('keeps the item active on its children, so a detail page still shows where it is', () => {
    expect(navWithActive('/world/w1').find((i) => i.href === '/world')?.active).toBe(true)
  })

  it('does not match a sibling with the same prefix', () => {
    expect(navWithActive('/worldwide').find((i) => i.href === '/world')?.active).toBe(false)
  })

  it('ships the destinations the application has', () => {
    // 加页面就加在这里 —— 这条断言的意义是"导航不是随手长的"
    expect(APP_NAV.map((i) => i.href)).toEqual(['/hello', '/world', '/verify'])
  })

  it('gives every destination an icon and a translation key', () => {
    for (const item of APP_NAV) {
      expect(item.icon, item.href).toBeTruthy()
      expect(item.label).toMatch(/^nav\./)
    }
  })
})
