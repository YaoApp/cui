import { describe, expect, it } from 'vitest'
import { toPage } from './paging'

const fallback = { page: 1, pageSize: 20 }

describe('toPage', () => {
  it('normalizes the agent/chat shape (pagesize + pagecount)', () => {
    expect(toPage<string>({ data: ['a'], page: 2, pagesize: 10, pagecount: 3 }, fallback)).toEqual({
      items: ['a'], page: 2, pageSize: 10, hasMore: true,
    })
  })

  it('normalizes the file shape (total + totalPages)', () => {
    expect(toPage<string>({ data: ['a'], total: 5, page: 1, pageSize: 5 }, fallback)).toEqual({
      items: ['a'], page: 1, pageSize: 5, total: 5, hasMore: false,
    })
  })

  it('accepts a bare array, and says nothing it cannot know', () => {
    expect(toPage<string>(['a', 'b'], fallback)).toEqual({ items: ['a', 'b'], page: 1, pageSize: 20 })
  })

  it('does not invent a total when the service did not give one', () => {
    expect(toPage<string>({ data: [] }, fallback).total).toBeUndefined()
  })
})
