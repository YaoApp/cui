import { describe, expect, it } from 'vitest'
import { buildManifest } from './manifest'
import { outboundContext } from './context'

describe('outboundContext', () => {
  it('carries resolved values only, never "system"', () => {
    const context = outboundContext({ locale: 'zh-CN', theme: 'dark' })
    expect(context.locale).toBe('zh-CN')
    expect(context.theme).toBe('dark')
    expect(context.client).toBe(buildManifest().client)
    expect(context.locale).not.toBe('system')
  })

  it('reads the timezone when asked, so a system change is seen', () => {
    expect(outboundContext({ locale: 'en-US', theme: 'light' }).timezone).toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    )
  })
})
