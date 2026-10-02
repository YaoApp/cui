import { describe, expect, it } from 'vitest'
import { resolveLocale } from '@/platform/i18n/resolve-locale'

/* 语言包目录里实际存在的语言（与 i18n.ts 的 SUPPORTED_LOCALES 一致）。 */
const AVAILABLE = ['en-US', 'ja', 'zh-CN', 'zh-TW']

describe('resolveLocale', () => {
  it.each([
    [['zh-CN'], 'zh-CN'],
    [['zh-Hant-TW'], 'zh-TW'],
    [['zh-TW'], 'zh-TW'],
    [['zh-HK'], 'zh-TW'],
    [['zh-MO'], 'zh-TW'],
    [['zh-Hant'], 'zh-TW'],
    [['zh-Hans-CN'], 'zh-CN'],
    [['zh'], 'zh-CN'],
    [['en-US'], 'en-US'],
    [['en-GB'], 'en-US'],
    [['en'], 'en-US'],
    [['ja-JP'], 'ja'],
    [['ja'], 'ja'],
    [['fr-FR'], 'zh-CN'],
    [['de'], 'zh-CN'],
  ])('maps %j to %s with the shipped languages', (systemLanguages, expected) => {
    expect(resolveLocale(systemLanguages, AVAILABLE)).toBe(expected)
  })

  it('is case-insensitive and tolerates script subtags', () => {
    expect(resolveLocale(['ZH-hant-TW'], AVAILABLE)).toBe('zh-TW')
    expect(resolveLocale(['zh-hAnS-cN'], AVAILABLE)).toBe('zh-CN')
    expect(resolveLocale(['JA-jp'], AVAILABLE)).toBe('ja')
    expect(resolveLocale(['EN-gb'], AVAILABLE)).toBe('en-US')
  })

  it('returns the canonical entry from available, not the input spelling', () => {
    expect(resolveLocale(['en-us'], AVAILABLE)).toBe('en-US')
    expect(resolveLocale(['ZH-tw'], AVAILABLE)).toBe('zh-TW')
  })

  it('honours the order of the system languages (first match wins)', () => {
    expect(resolveLocale(['fr-FR', 'ja-JP'], AVAILABLE)).toBe('ja')
    expect(resolveLocale(['ja-JP', 'en-US'], AVAILABLE)).toBe('ja')
    expect(resolveLocale(['en-GB', 'ja-JP'], AVAILABLE)).toBe('en-US')
  })

  it('falls back to the baseline when nothing matches', () => {
    expect(resolveLocale([], AVAILABLE)).toBe('zh-CN')
    expect(resolveLocale(['fr-FR', 'de-DE'], AVAILABLE)).toBe('zh-CN')
  })

  it('takes available as a parameter so tests can narrow the shipped set', () => {
    expect(resolveLocale(['en-GB'], ['zh-CN', 'ja'])).toBe('zh-CN')
    expect(resolveLocale(['ja-JP'], ['zh-CN', 'ja'])).toBe('ja')
  })
})
