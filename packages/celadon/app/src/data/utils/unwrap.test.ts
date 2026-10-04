import { describe, expect, it } from 'vitest'
import { unwrap } from './unwrap'

describe('unwrap', () => {
  it('takes the value out of an envelope', () => {
    expect(unwrap<{ id: string }>({ data: { id: 'a' }, status: 200 })).toEqual({ id: 'a' })
  })

  it('leaves an entity that merely owns a data field alone', () => {
    const entity = { data: 'payload', name: 'real' }   // 键不止信封词汇 → 是实体
    expect(unwrap(entity)).toBe(entity)
  })

  it('passes arrays and primitives through', () => {
    expect(unwrap<string[]>(['a'])).toEqual(['a'])
    expect(unwrap<string>('a')).toBe('a')
  })
})
