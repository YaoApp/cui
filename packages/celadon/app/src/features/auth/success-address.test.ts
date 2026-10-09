import { describe, expect, it, vi } from 'vitest'
import { goToSuccess } from './success-address'

/* 成功地址的去向：命名空间之内走路由，之外整页跳转。两个动作都按接缝换替身，判定的是调用。 */
describe('where the session goes after the sign-in finishes', () => {
  it('routes inside the app when the address is under the namespace', () => {
    const navigate = vi.fn()
    const assign = vi.fn()

    goToSuccess(navigate, '/app/done', 'app', assign)

    expect(navigate).toHaveBeenCalledWith('/done')
    expect(assign).not.toHaveBeenCalled()
  })

  it('leaves the app when the address is outside the namespace', () => {
    const navigate = vi.fn()
    const assign = vi.fn()

    goToSuccess(navigate, '/dashboard/inbox', 'app', assign)

    expect(assign).toHaveBeenCalledWith('/dashboard/inbox')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('takes every path as inside the app when there is no namespace', () => {
    const navigate = vi.fn()
    const assign = vi.fn()

    goToSuccess(navigate, '/done', '', assign)

    expect(navigate).toHaveBeenCalledWith('/done')
    expect(assign).not.toHaveBeenCalled()
  })

  it('routes the bare namespace itself to the app root', () => {
    const navigate = vi.fn()
    const assign = vi.fn()

    goToSuccess(navigate, '/app', 'app', assign)

    expect(navigate).toHaveBeenCalledWith('/')
    expect(assign).not.toHaveBeenCalled()
  })

  it('leaves through the current window when the caller gives no assign function', () => {
    /* jsdom 对哈希这一类同页变化会真的改地址：用它证明默认那一支确实发起了跳转 */
    goToSuccess(vi.fn(), '#success-address-check', 'app')

    expect(window.location.hash).toBe('#success-address-check')
  })
})
