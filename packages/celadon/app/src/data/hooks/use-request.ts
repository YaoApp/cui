/* **取数钩子**：`send()` 的 React 薄壳 —— 四态 · 取消 · 重跑，**唯一实现**（`05 §4`）。
 *
 * 只做"React 的那部分"：挂载时跑、卸载时取消、依赖变了重跑、晚到的结果丢掉。
 * **取数本身在 `request/send.ts`**；**重试由调用方决定**（`17 §2.1`：策略在出口之上）。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Failure, Result } from '../types'

export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; value: T }
  | { status: 'error'; failure: Failure }

/** @param fetcher 收到 `AbortSignal`（转交给 `send()` 的 `signal`）· @param deps 依赖变了就重跑
 *  （叫 `fetcher` 是 SWR 的说法；TanStack 叫 `queryFn` —— 这里查询与提交共用，所以取前者那种中性词） */
export function useRequest<T>(
  fetcher: (signal: AbortSignal) => Promise<Result<T>>,
  deps: readonly unknown[],
): { state: RequestState<T>; reload: () => void } {
  const [state, setState] = useState<RequestState<T>>({ status: 'idle' })
  const [attempt, setAttempt] = useState(0)
  const latest = useRef(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    const controller = new AbortController()
    const id = ++latest.current
    setState({ status: 'loading' })
    void fetcherRef.current(controller.signal).then((result) => {
      if (id !== latest.current) return // 晚到的结果丢掉（依赖已变或已卸载）
      setState(result.ok ? { status: 'ok', value: result.value } : { status: 'error', failure: result })
    })
    return () => {
      latest.current += 1 // 让在途结果失效
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const reload = useCallback(() => setAttempt((one) => one + 1), [])
  return { state, reload }
}
