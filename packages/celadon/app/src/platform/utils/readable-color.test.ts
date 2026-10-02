import { describe, expect, it } from 'vitest'
import {
  contrastRatio,
  parseColor,
  readableColorOn,
  relativeLuminance,
} from '@/platform/utils/readable-color'

describe('parseColor', () => {
  it('reads hex in both lengths and rgb()', () => {
    expect(parseColor('#fff')).toEqual([255, 255, 255])
    expect(parseColor('#2A7B7B')).toEqual([42, 123, 123])
    expect(parseColor('rgb(42, 123, 123)')).toEqual([42, 123, 123])
    expect(parseColor('rgb(42 123 123)')).toEqual([42, 123, 123])
  })

  it('returns null for colours it cannot read', () => {
    expect(parseColor('rebeccapurple')).toBeNull()
    expect(parseColor('')).toBeNull()
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#2A7B7B', '#2A7B7B')).toBeCloseTo(1, 5)
  })

  it('does not care about order', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(contrastRatio('#000', '#fff'), 5)
  })

  it('matches a known value', () => {
    // 品牌青 #2A7B7B 在近白底上约 5.0:1（正文可读）
    expect(contrastRatio('#2A7B7B', '#FFFFFF')).toBeGreaterThan(4.5)
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 3)
  })
})

describe('readableColorOn', () => {
  it('keeps a foreground that already reads', () => {
    expect(readableColorOn('#000000', '#FFFFFF')).toBe('#000000')
  })

  it('replaces a foreground that does not', () => {
    expect(readableColorOn('#FFFFFF', '#FFFFFF')).toBe('#000000')
    expect(readableColorOn('#000000', '#000000')).toBe('#ffffff')
  })

  it('always returns something that reads on that background', () => {
    for (const bg of ['#FFFFFF', '#000000', '#2A7B7B', '#F4F1EA', '#121110']) {
      expect(contrastRatio(readableColorOn('#999999', bg), bg)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
