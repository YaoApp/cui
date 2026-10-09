import { describe, expect, it } from 'vitest'
import { hasAny, profileUser, userInfo } from './user-info'

describe('the user information of a session', () => {
  it('takes the user id the response carries, with the account that was used', () => {
    expect(userInfo({ user_id: 'u-1' }, 'max@example.com')).toEqual({
      userId: 'u-1',
      account: 'max@example.com',
      name: undefined,
      email: undefined,
    })
  })

  it('falls back to the user id in the claims when the response has none', () => {
    expect(userInfo({}, '', { 'yao:user_id': '853237951145' }).userId).toBe('853237951145')
    expect(userInfo({}, '', { sub: '2637731346623841' }).userId).toBe('2637731346623841')
  })

  it('takes the display name and email from the claims', () => {
    expect(userInfo({}, '', { name: 'Wren', email: 'max@example.com' })).toMatchObject({
      name: 'Wren',
      email: 'max@example.com',
    })
    expect(userInfo({}, '', { 'yao:member': { display_name: 'Mock OAuth User' } }).name).toBe('Mock OAuth User')
  })

  it('drops the fields that are absent or empty', () => {
    expect(userInfo({}, '')).toEqual({ userId: undefined, account: undefined, name: undefined, email: undefined })
    expect(userInfo({ user_id: '' }, '', { name: 42, email: '' })).toEqual({
      userId: undefined,
      account: undefined,
      name: undefined,
      email: undefined,
    })
  })

  it('ignores a member claim that is not an object', () => {
    expect(userInfo({}, '', { 'yao:member': null }).name).toBeUndefined()
    expect(userInfo({}, '', { 'yao:member': 'Wren' }).name).toBeUndefined()
  })
})

describe('the user information of a profile fetch', () => {
  it('takes the id, name and email the profile carries', () => {
    expect(profileUser({ 'yao:user_id': '853296684128', name: 'Wren', email: 'max@example.com' })).toEqual({
      userId: '853296684128',
      name: 'Wren',
      email: 'max@example.com',
    })
  })

  it('falls back to the standard subject when the namespaced id is absent', () => {
    expect(profileUser({ sub: '3694776944429602' })?.userId).toBe('3694776944429602')
  })

  it('keeps the id when the name and email are absent: the identity is always shown', () => {
    expect(profileUser({ 'yao:user_id': '853296684128' })).toEqual({ userId: '853296684128' })
    expect(hasAny(profileUser({ 'yao:user_id': '853296684128' })!)).toBe(true)
  })

  it('gives nothing back when there is a response with no displayable field', () => {
    expect(profileUser({})).toBeUndefined()
    expect(profileUser({ name: '', email: '', 'yao:user_id': '' })).toBeUndefined()
    expect(profileUser(undefined)).toBeUndefined()
  })
})
