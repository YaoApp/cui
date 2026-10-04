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

/** @param fetcher 收到 `AbortSignal`（转交给 `send()` 的 `signal`）
 *  @param key 这份数据的**身份**：变了就重跑（SWR / TanStack 同叫 `key`，也留作将来缓存的键）
 *  （叫 `fetcher` 是 SWR 的说法；TanStack 叫 `queryFn` —— 这里查询与提交共用，所以取前者那种中性词）
 *  @param options `manual: true` → **挂载不跑**，等调用方 `reload()`（提交/按钮那种用法）；
 *                  不传 → 挂载即跑（查询那种用法）。**两种都走这一个钩子**，别在外面直接 `send()`。 */
export function useRequest<T>(
  fetcher: (signal: AbortSignal) => Promise<Result<T>>,
  key: readonly unknown[],
  options?: { manual?: boolean },
): { state: RequestState<T>; reload: () => Promise<void> } {
  const [state, setState] = useState<RequestState<T>>({ status: 'idle' })
  const [attempt, setAttempt] = useState(0)
  const latest = useRef(0)
  const settle = useRef<(() => void) | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (options?.manual && attempt === 0) return // 手动模式：挂载不跑，等 reload()
    const controller = new AbortController()
    const id = ++latest.current
    setState({ status: 'loading' })
    void fetcherRef.current(controller.signal).then((result) => {
      if (id !== latest.current) return // 晚到的结果丢掉（依赖已变或已卸载）
      setState(result.ok ? { status: 'ok', value: result.value } : { status: 'error', failure: result })
    }).finally(() => {
      settle.current?.()
      settle.current = null
    })
    return () => {
      latest.current += 1 // 让在途结果失效
      controller.abort()
      settle.current?.() // 这次被顶掉了：放行等待者，别悬着
      settle.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...key, attempt])

  /* 落定 = **state 已提交**（所以放在 effect 里，而不是 fetch 的 finally）：`await reload()` 之后读到的就是新 state ✓ */
  useEffect(() => {
    if (state.status === 'loading') return
    settle.current?.()
    settle.current = null
  }, [state])

  const reload = useCallback(
    () => new Promise<void>((resolve) => {
      settle.current = resolve
      setAttempt((one) => one + 1)
    }),
    [],
  )
  return { state, reload }
}
