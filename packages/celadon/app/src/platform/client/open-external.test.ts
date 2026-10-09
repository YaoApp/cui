import { describe, expect, it, vi } from 'vitest'
import { openExternal } from './open-external'

describe('opening an external address', () => {
  it('navigates the current window to the address', () => {
    const navigate = vi.fn()

    openExternal('https://accounts.example.com/auth', navigate)

    expect(navigate).toHaveBeenCalledWith('https://accounts.example.com/auth')
  })

  it('uses the current window when the caller gives no navigate function', () => {
    /* jsdom 对哈希这一类同页变化会真的改地址：用它证明默认那一支确实发起了导航 */
    openExternal('#open-external-check')
    expect(window.location.hash).toBe('#open-external-check')
  })
})
