import { describe, expect, it } from 'vitest'
import { describeFailure, fail, isOk, ok, valueOr, type BridgeResult } from './result'

describe('BridgeResult', () => {
  it('carries a value when it succeeds', () => {
    const result = ok({ version: '2.0.0' })
    expect(isOk(result)).toBe(true)
    expect(valueOr(result, { version: '' }).version).toBe('2.0.0')
    expect(describeFailure(result)).toBe('')
  })

  it('carries a readable reason when it fails, and never throws', () => {
    const result: BridgeResult<{ version: string }> = fail('unavailable', 'no host bridge in this client')
    expect(isOk(result)).toBe(false)
    expect(describeFailure(result)).toBe('unavailable: no host bridge in this client')
  })

  it('falls back when there is no value, so a caller can still draw', () => {
    const fallback = { version: 'unknown' }
    expect(valueOr(fail('not-running', 'celadon_ping not found'), fallback)).toBe(fallback)
  })
})
