import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useLocaleStore } from '../i18n/locale.store'
import { useThemeStore } from '../theme/theme.store'
import { useLocalePreference, useThemePreference } from './use-preferences'

/* 偏好是**会变**的数据：hook 负责"值 + 订阅"，静态事实不需要订阅。 */
afterEach(() => {
  useLocaleStore.getState().setLocale('system')
  useThemeStore.getState().setPreference('system')
})

describe('the preference hooks', () => {
  it('follows a locale change, and keeps the raw preference for the switcher', () => {
    const { result } = renderHook(() => useLocalePreference())

    act(() => useLocaleStore.getState().setLocale('ja'))
    expect(result.current.locale).toBe('ja')
    expect(result.current.preference).toBe('ja')

    act(() => useLocaleStore.getState().setLocale('system'))
    expect(result.current.preference).toBe('system')
    expect(result.current.locale).not.toBe('system') // 解析过的值
  })

  it('follows a theme change, and takes a preference through setTheme', () => {
    const { result } = renderHook(() => useThemePreference())

    act(() => result.current.setTheme('dark'))
    expect(result.current.theme).toBe('dark')

    act(() => result.current.setTheme('light'))
    expect(result.current.theme).toBe('light')
  })
})
