import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { useHelloStore } from '@/features/hello/hello-store'
import { useThemeStore } from '@/platform/theme/theme-store'

/* 每个用例后：卸载 DOM + 重置 store。
   store 跨用例串味是最常见的 flaky 来源 —— 新增 store 时在这里补一行重置。 */
afterEach(() => {
  cleanup()
  useHelloStore.setState({ count: 0 })
  // setTheme 会一并写回根元素，避免上一个用例把 DOM 留在深色
  useThemeStore.getState().setTheme('light')
  window.localStorage.clear()
})
