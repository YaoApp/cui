import { describe, expect, it } from 'vitest'
import { buildManifest } from './manifest'
import { currentOutbound, outboundContext } from './context'
import { useLocaleStore } from '../i18n/locale.store'
import { useThemeStore } from '../theme/theme.store'

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

describe('currentOutbound', () => {
  it('reads the resolved values from the platform stores, never "system"', () => {
    useLocaleStore.getState().setLocale('system')
    useThemeStore.getState().setPreference('dark')
    expect(currentOutbound()).toEqual({ locale: 'zh-CN', theme: 'dark' })   // 单测环境系统语言钉为 zh-CN
  })

  it('follows the stores as they change', () => {
    useLocaleStore.getState().setLocale('en-US')
    useThemeStore.getState().setPreference('light')
    expect(currentOutbound()).toEqual({ locale: 'en-US', theme: 'light' })
  })

  it('lets a caller override one field on top of the current value', () => {
    useLocaleStore.getState().setLocale('en-US')
    useThemeStore.getState().setPreference('dark')
    expect({ ...currentOutbound(), locale: 'ja' }).toEqual({ locale: 'ja', theme: 'dark' })
  })
})
