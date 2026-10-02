import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { APP_NAME, usePageTitle } from '@/platform/router/use-page-title'

describe('usePageTitle', () => {
  it('puts the route name in front of the app name', () => {
    renderHook(() => usePageTitle('World'))
    expect(document.title).toBe(`World · ${APP_NAME}`)
  })

  it('follows the route when it changes — a detail page shows the object', () => {
    const { rerender } = renderHook(({ title }) => usePageTitle(title), { initialProps: { title: 'World' } })
    rerender({ title: 'Alpha 世界' })
    expect(document.title).toBe(`Alpha 世界 · ${APP_NAME}`)
  })

  it('falls back to the app name alone', () => {
    renderHook(() => usePageTitle())
    expect(document.title).toBe(APP_NAME)
  })
})
