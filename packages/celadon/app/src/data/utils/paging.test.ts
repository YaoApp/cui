import { describe, expect, it } from 'vitest'
import { paginate } from './paging'

const fallback = { page: 1, pageSize: 20 }

describe('paginate', () => {
  it('normalizes the agent/chat shape (pagesize + pagecount)', () => {
    expect(paginate<string>({ data: ['a'], page: 2, pagesize: 10, pagecount: 3 }, fallback)).toEqual({
      items: ['a'], page: 2, pageSize: 10, hasMore: true,
    })
  })

  it('normalizes the file shape (total + totalPages)', () => {
    expect(paginate<string>({ data: ['a'], total: 5, page: 1, pageSize: 5 }, fallback)).toEqual({
      items: ['a'], page: 1, pageSize: 5, total: 5, hasMore: false,
    })
  })

  it('accepts a bare array, and says nothing it cannot know', () => {
    expect(paginate<string>(['a', 'b'], fallback)).toEqual({ items: ['a', 'b'], page: 1, pageSize: 20 })
  })

  it('does not invent a total when the service did not give one', () => {
    expect(paginate<string>({ data: [] }, fallback).total).toBeUndefined()
  })
})
