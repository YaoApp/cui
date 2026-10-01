import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { useHelloStore } from '@/features/hello/hello-store'

/* 每个用例后：卸载 DOM + 重置 store。
   store 跨用例串味是最常见的 flaky 来源 —— 新增 store 时在这里补一行重置。 */
afterEach(() => {
  cleanup()
  useHelloStore.setState({ count: 0 })
})
