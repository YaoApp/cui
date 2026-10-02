import { describe, expect, it } from 'vitest'
import { i18n } from '@/platform/i18n'
import { resolvePreference, useLocaleStore } from '@/platform/i18n/locale.store'

/* 语言只做一件事：把**解析后的**语言同步到 i18n 实例与 `<html lang>`。store 是唯一写它的地方。
   单测环境的系统语言被 test-support 固定为基准 zh-CN（见那里的说明）。 */
describe('locale store', () => {
  it('starts by following the system and applies the resolved language', () => {
    expect(useLocaleStore.getState().locale).toBe('system')
    expect(resolvePreference('system')).toBe('zh-CN')
    expect(i18n.language).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
  })

  it('follows the system language it resolves to', () => {
    Object.defineProperty(navigator, 'languages', { value: ['ja-JP', 'ja'], configurable: true })

    // 真实场景里是首次加载或切回"跟随系统"时重新解析
    useLocaleStore.getState().setLocale('system')

    expect(resolvePreference('system')).toBe('ja')
    expect(i18n.language).toBe('ja')
    expect(document.documentElement.lang).toBe('ja')
  })

  it('switches the interface language through the i18n instance', () => {
    useLocaleStore.getState().setLocale('en-US')
    expect(useLocaleStore.getState().locale).toBe('en-US')
    expect(i18n.language).toBe('en-US')
    expect(i18n.t('nav.hello')).toBe('Hello')
    expect(document.documentElement.lang).toBe('en-US')

    useLocaleStore.getState().setLocale('zh-CN')
    expect(i18n.language).toBe('zh-CN')
    expect(i18n.t('nav.hello')).toBe('你好')
  })

  it('switches to the added languages too', () => {
    useLocaleStore.getState().setLocale('zh-TW')
    expect(i18n.language).toBe('zh-TW')
    expect(i18n.t('header.refresh')).toBe('重新整理')

    useLocaleStore.getState().setLocale('ja')
    expect(i18n.language).toBe('ja')
    expect(i18n.t('nav.world')).toBe('ワールド')
  })

  it('stops following the system once the user picks a language', () => {
    useLocaleStore.getState().setLocale('en-US')

    // 系统语言变了也不再跟随：显式选择说了算
    Object.defineProperty(navigator, 'languages', { value: ['ja-JP', 'ja'], configurable: true })

    expect(resolvePreference(useLocaleStore.getState().locale)).toBe('en-US')
    expect(i18n.language).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')
  })

  it('remembers the choice', () => {
    useLocaleStore.getState().setLocale('en-US')
    expect(window.localStorage.getItem('cui.locale')).toContain('en-US')
  })
})

/* 这一条**故意依赖执行顺序**：上一条把语言设成了 en-US、系统语言也被改成过 ja，
   如果测试支持里的自动复位失效，这里就会读到 en-US / ja —— 于是它成了那张网自己是否还在的证明。 */
it('is reset between tests, so one test cannot leak a locale into the next', () => {
  expect(useLocaleStore.getState().locale).toBe('system')
  expect(i18n.language).toBe('zh-CN')
  expect(document.documentElement.lang).toBe('zh-CN')
})
