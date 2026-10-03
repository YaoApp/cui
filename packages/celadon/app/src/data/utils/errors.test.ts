import { describe, expect, it } from 'vitest'
import { toFailure } from './errors'

describe('toFailure', () => {
  it('reads the engine\'s oauth shape', () => {
    expect(toFailure(401, { error: 'invalid_token', error_description: 'token expired' }, 'fallback')).toMatchObject({
      code: 'invalid_token', params: { status: 401 }, message: 'token expired',
    })
  })

  it('carries the scopes the engine reports', () => {
    const failure = toFailure(403, { error: 'insufficient_scope', required_scopes: ['kb:read'], missing_scopes: ['kb:read'] }, 'fallback')
    expect(failure).toMatchObject({ code: 'insufficient_scope', requiredScopes: ['kb:read'], missingScopes: ['kb:read'] })
  })

  it('tolerates the interfaces that answer with a nested or bare error', () => {
    expect(toFailure(400, { error: { code: 'llm.bad_model', message: 'no such model' } }, 'fallback').code).toBe('llm.bad_model')
    expect(toFailure(400, { error: 'bad_request' }, 'fallback').code).toBe('bad_request')
  })

  it('falls back when the service says nothing useful', () => {
    expect(toFailure(500, '', 'user.list_failed')).toMatchObject({ code: 'user.list_failed', message: 'the service answered 500' })
  })
})
