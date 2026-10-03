import { describe, expect, it } from 'vitest'
import { REDACTED, shouldRedact } from './redact'

describe('shouldRedact', () => {
  it('hides what would leak a secret', () => {
    expect(shouldRedact('credential.read')).toBe(true)
  })

  it('leaves everything else printable', () => {
    for (const label of ['credential.list', 'credential.write', 'credential.remove', 'transport.probe', 'ping', 'appInfo']) {
      expect(shouldRedact(label)).toBe(false)
    }
  })

  it('the stand-in carries nothing of the value', () => {
    expect(REDACTED).not.toMatch(/[0-9a-zA-Z]/)   // 只有符号，抄不走任何东西
  })
})
