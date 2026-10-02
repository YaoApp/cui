import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { discoveredStores } from './stores'

/* 单测环境把系统语言固定为基准 zh-CN —— store 默认 `'system'` 才能稳定复现；
   要测"跟随系统"的用例自己覆盖 navigator.languages（每个用例前后都会复位）。 */
function pinSystemLocale() {
  Object.defineProperty(window.navigator, 'language', { value: 'zh-CN', configurable: true })
  Object.defineProperty(window.navigator, 'languages', { value: ['zh-CN', 'zh'], configurable: true })
}

/* store 的发现与初始状态登记在 ./stores.ts（自动、跨层，见那里的说明和 stores.test.ts 的断言）。
   状态存**副本**，复位时再传一份新副本 —— zustand 对同一个对象引用不会触发订阅，
   而语言 / 主题的副作用正是挂在订阅上的，必须每次都真的通知一次。 */
const initial = new Map(
  discoveredStores.map((entry) => [entry.store, { ...(entry.store.getState() as Record<string, unknown>) }] as const),
)

function resetStores() {
  for (const [store, state] of initial) store.setState({ ...state }, true)
}

/* 每个用例前/后：先把系统语言与所有 store 复位，副作用（i18n · data-theme · <html lang>）
   才会在确定的起点上重建 —— 首个用例也不会读到 jsdom 默认的 en-US。 */
beforeEach(() => {
  pinSystemLocale()
  resetStores()
})

afterEach(() => {
  cleanup()
  pinSystemLocale()
  resetStores()
  window.localStorage.clear()
})
