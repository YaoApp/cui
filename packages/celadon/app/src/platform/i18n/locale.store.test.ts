import { describe, expect, it } from 'vitest'
import { i18n } from '@/platform/i18n'
import { useLocaleStore } from '@/platform/i18n/locale.store'

/* 语言只做一件事：把选中的语言同步到 i18n 实例。store 是唯一写它的地方。 */
describe('locale store', () => {
  it('starts on the baseline language and applies it', () => {
    expect(useLocaleStore.getState().locale).toBe('zh-CN')
    expect(i18n.language).toBe('zh-CN')
  })

  it('switches the interface language through the i18n instance', () => {
    useLocaleStore.getState().setLocale('en-US')
    expect(useLocaleStore.getState().locale).toBe('en-US')
    expect(i18n.language).toBe('en-US')
    expect(i18n.t('nav.hello')).toBe('Hello')

    useLocaleStore.getState().setLocale('zh-CN')
    expect(i18n.language).toBe('zh-CN')
    expect(i18n.t('nav.hello')).toBe('你好')
  })

  it('remembers the choice', () => {
    useLocaleStore.getState().setLocale('en-US')
    expect(window.localStorage.getItem('cui.locale')).toContain('en-US')
  })
})

/* 这一条**故意依赖执行顺序**：上一条把语言设成了 en-US，如果测试支持里的自动复位失效，
   这里就会读到 en-US —— 于是它成了那张网自己是否还在的证明。 */
it('is reset between tests, so one test cannot leak a locale into the next', () => {
  expect(useLocaleStore.getState().locale).toBe('zh-CN')
  expect(i18n.language).toBe('zh-CN')
})
