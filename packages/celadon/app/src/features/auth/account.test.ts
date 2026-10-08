import { describe, expect, it } from 'vitest'
import { looksLikeAccount } from './account'

describe('the account shape', () => {
  it('accepts an email address with a local part, a domain and a dot', () => {
    expect(looksLikeAccount('max@example.com')).toBe(true)
    expect(looksLikeAccount('  max@example.com  ')).toBe(true)
  })

  it('accepts a phone number of six digits or more', () => {
    expect(looksLikeAccount('13800138000')).toBe(true)
    expect(looksLikeAccount('123456')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(looksLikeAccount('max@example')).toBe(false)
    expect(looksLikeAccount('12345')).toBe(false)
    expect(looksLikeAccount('max')).toBe(false)
    expect(looksLikeAccount('')).toBe(false)
  })
})
