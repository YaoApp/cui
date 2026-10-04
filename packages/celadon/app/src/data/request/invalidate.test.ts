import { describe, expect, it, vi } from 'vitest'
import type { Request } from './send'
import { invalidate, keyOf, subscribe } from './invalidate'

const REQUEST = { method: 'GET', path: '/things' } as Request

describe('keyOf', () => {
  it('is method and path when no family is given', () => {
    expect(keyOf(REQUEST)).toEqual(['GET', '/things'])
  })

  it('puts the family prefix first, so a domain root matches by prefix', () => {
    expect(keyOf(REQUEST, ['helloworld', 'public'])).toEqual(['helloworld', 'public', 'GET', '/things'])
  })
})

describe('invalidate', () => {
  it('reruns every subscription the prefix matches, and no other', () => {
    const get = vi.fn()
    const post = vi.fn()
    const offGet = subscribe(keyOf(REQUEST, ['helloworld']), get)
    const offPost = subscribe(keyOf({ method: 'POST', path: '/things' } as Request, ['helloworld']), post)

    invalidate(['helloworld', 'GET'])
    expect(get).toHaveBeenCalledOnce()
    expect(post).not.toHaveBeenCalled()

    offGet()
    offPost()
    invalidate([]) // 空前缀命中全部 —— 但两条都已注销
    expect(get).toHaveBeenCalledOnce()
    expect(post).not.toHaveBeenCalled()
  })
})
