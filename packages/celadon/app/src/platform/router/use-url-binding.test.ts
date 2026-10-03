import { describe, expect, it } from 'vitest'
import { sameParams } from '@/platform/router/use-url-binding'

/* 参数顺序不算差异 —— 顺序差异曾被误判成"变了"，多出一条历史，用户按后退像没反应。 */
describe('sameParams', () => {
  it('ignores the order of the parameters', () => {
    expect(sameParams(new URLSearchParams('b=2&a=1'), '?a=1&b=2')).toBe(true)
  })

  it('sees a different value as a difference', () => {
    expect(sameParams(new URLSearchParams('a=2'), '?a=1')).toBe(false)
  })

  it('sees a missing or extra parameter as a difference', () => {
    expect(sameParams(new URLSearchParams('a=1'), '?a=1&b=2')).toBe(false)
    expect(sameParams(new URLSearchParams('a=1&b=2'), '?a=1')).toBe(false)
    expect(sameParams(new URLSearchParams(''), '')).toBe(true)
  })
})
