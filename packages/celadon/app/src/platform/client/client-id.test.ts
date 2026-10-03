import { beforeEach, describe, expect, it } from 'vitest'
import { clientId } from './client-id'

describe('clientId', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('is a UUID v4', () => {
    expect(clientId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('does not change within the same installation', () => {
    expect(clientId()).toBe(clientId())
  })

  it('keeps the value it stored, so it survives a reload', () => {
    const first = clientId()
    expect(localStorage.getItem('celadon.client_id')).toBe(first)
  })
})
