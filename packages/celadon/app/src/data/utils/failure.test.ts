import { describe, expect, it } from 'vitest'
import { failure } from './failure'

describe('failure', () => {
  it('reads the engine\'s oauth shape', () => {
    expect(failure(401, { error: 'invalid_token', error_description: 'token expired' }, 'fallback')).toMatchObject({
      code: 'invalid_token', params: { status: 401 }, rawMessage: 'token expired',
    })
  })

  it('carries the scopes the engine reports', () => {
    const result = failure(403, { error: 'insufficient_scope', required_scopes: ['kb:read'], missing_scopes: ['kb:read'] }, 'fallback')
    expect(result).toMatchObject({ code: 'insufficient_scope', requiredScopes: ['kb:read'], missingScopes: ['kb:read'] })
  })

  it('tolerates the interfaces that answer with a nested or bare error', () => {
    expect(failure(400, { error: { code: 'llm.bad_model', rawMessage: 'no such model' } }, 'fallback').code).toBe('llm.bad_model')
    expect(failure(400, { error: 'bad_request' }, 'fallback').code).toBe('bad_request')
  })

  it('falls back when the service says nothing useful', () => {
    expect(failure(500, '', 'user.list_failed')).toMatchObject({ code: 'user.list_failed', rawMessage: 'the service answered 500' })
  })
})
