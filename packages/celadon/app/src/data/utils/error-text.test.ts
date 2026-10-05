import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Failure } from '../types'
import { dataErrorKey, dataErrorText } from './error-text'

const failure = (over: Partial<Failure> = {}): Failure => ({
  code: 'transport.status',
  params: { status: 500 },
  message: 'transport: status',
  ...over,
})

/** 语言包取值的替身：命中时返回句子，未命中时**与 i18next 一样**把 key 原样返回。 */
const pack: Record<string, string> = {
  'data.error.transport.status': '服务端返回了 {{status}}',
}
const t = (key: string, options?: Record<string, unknown>) => {
  const raw = pack[key]
  if (raw === undefined) return key
  return Object.entries(options ?? {}).reduce((acc, [name, value]) => acc.replace(`{{${name}}}`, String(value)), raw)
}

afterEach(() => vi.restoreAllMocks())

describe('the data error key', () => {
  it('turns a snake_case code into the language pack key', () => {
    expect(dataErrorKey('transport.cross_origin')).toBe('data.error.transport.crossOrigin')
    expect(dataErrorKey('token_missing')).toBe('data.error.tokenMissing')
    expect(dataErrorKey('get_failed')).toBe('data.error.getFailed')
  })
})

describe('the data error text', () => {
  it('resolves by code and interpolates the params', () => {
    expect(dataErrorText(t, failure())).toBe('服务端返回了 500')
  })

  it('falls back to the diagnostic message, and says so, when the key is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const missing = failure({ code: 'engine.unknown_code', params: {}, message: 'engine: unknown code' })
    expect(dataErrorText(t, missing)).toBe('engine: unknown code')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('data.error.engine.unknownCode')
  })

  it('treats an empty translation as missing too', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const empty = failure({ code: 'empty.one', params: {}, message: 'empty: one' })
    expect(dataErrorText(() => '', empty)).toBe('empty: one')
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
