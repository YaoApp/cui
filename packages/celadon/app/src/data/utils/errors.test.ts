import { describe, expect, it } from 'vitest'
import { toFailure } from './errors'

describe('toFailure', () => {
  it('reads the old oauth shape', () => {
    expect(toFailure(401, { error: 'invalid_grant', error_description: 'bad code' }, 'fallback')).toMatchObject({
      code: 'invalid_grant', params: { status: 401 }, message: 'bad code',
    })
  })

  it('reads a nested error object', () => {
    expect(toFailure(400, { error: { code: 'user.bad_name', message: 'too long' } }, 'fallback')).toMatchObject({
      code: 'user.bad_name', message: 'too long',
    })
  })

  it('carries field-level issues, mapped to one shape', () => {
    const failure = toFailure(422, { code: 'user.invalid', fields: [{ field: 'name', code: 'too_long' }] }, 'fallback')
    expect(failure.fields).toEqual([{ path: 'name', code: 'too_long' }])
  })

  it('falls back when the service says nothing useful', () => {
    expect(toFailure(500, '', 'user.list_failed')).toMatchObject({ code: 'user.list_failed', message: 'the service answered 500' })
  })
})
