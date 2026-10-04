/* **取数钩子**：把一份接口**声明**跑成一次请求 —— 四态 · 取消 · 重跑，**唯一实现**（`05 §4`）。
 *
 * 只做"React 的那部分"：挂载时跑、卸载时取消、key 变了重跑、晚到的结果丢掉、失败按码翻译。
 * **取数本身在 `request/send.ts`**；**重试由调用方决定**（`17 §2.1`：策略在出口之上）；
 * 失效广播在 `request/invalidate.ts`（同一套 `keyOf`）。
 *
 * **不做**：缓存 · 去重（同一份数据两处用由调用方提升共享）· 焦点/重连再取 · 乐观更新 ·
 * 重试（重试是出口之上的策略，见 `17 §2.1`）。 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { failureText } from '@/platform/bridge'
import type { Failure } from '../types'
import type { Request } from '../request/send'
import { send } from '../request/send'
import { keyOf, subscribe } from '../request/invalidate'

export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; value: T }
  /** 失败已按码翻译：`text` 是可直接上屏的一句话 */
  | { status: 'error'; failure: Failure & { text: string } }

export type RequestOptions<Input> = {
  /** 这份数据的身份；不传就由声明推出（`[method, path]`）。传了就是**参数化**（同一个接口不同身份）*/
  key?: readonly unknown[]
  /** 提交这一次的输入（包体）*/
  body?: Input
  /** true → 挂载不跑，等 `run()` */
  manual?: boolean
}

/** @param request 接口声明（方法 · 路径 · 进出类型）—— 取数只经 `send()`
 *  @param options 身份 / 包体 / 是否手动；见 `RequestOptions`
 *
 *  **查询与提交共用这一个钩子**：查询不传 `body`、挂载即跑；提交传 `body`、`manual: true` 等 `run()`。
 *  **`run(body?)` 返回的 Promise 在这一次的 state 提交之后 resolve** —— `await run()` 读完即新值。 */
/** 取数的两种写法：直接给**声明**，或给域层的 **query 对象**（`{ key, request }`，见 `data/<域>/queries.ts`）。
 *  query 对象让 key 由域层收口（族前缀 → `invalidate(keys.all)` 才能命中）。 */
export type RequestSource<Input, Output> =
  | Request<Input, Output>
  | { key: readonly unknown[]; request: Request<Input, Output> }

export function useRequest<Input = void, Output = void>(
  source: RequestSource<Input, Output>,
  options: RequestOptions<Input> = {},
): { state: RequestState<Output>; run: (body?: Input) => Promise<void>; reset: () => void } {
  const request = 'request' in source ? source.request : source
  const declaredKey = 'request' in source ? source.key : undefined
  const [state, setState] = useState<RequestState<Output>>({ status: 'idle' })
  const [attempt, setAttempt] = useState(0)
  const latest = useRef(0)
  const settle = useRef<(() => void) | null>(null)
  const requestRef = useRef(request)
  requestRef.current = request
  // `options.body` 是默认包体；`run(body)` 为这一次覆盖它。身份没变就不覆盖 `run` 的选择。
  const bodyRef = useRef<Input | undefined>(options.body)
  const defaultBodyRef = useRef(options.body)
  if (!Object.is(defaultBodyRef.current, options.body)) {
    defaultBodyRef.current = options.body
    bodyRef.current = options.body
  }
  const key = options.key ?? declaredKey ?? keyOf(request)
  const keyRef = useRef(key)
  keyRef.current = key

  /* 改 key 或 `run()` 都只做一件事：让下面的 effect 再跑一次（真正的请求在 effect 里发）。 */
  const run = useCallback(
    (body?: Input) => new Promise<void>((resolve) => {
      if (body !== undefined) bodyRef.current = body
      settle.current = resolve
      setAttempt((one) => one + 1)
    }),
    [],
  )

  useEffect(() => {
    if (options.manual && attempt === 0) return // 手动模式：挂载不跑，等 run()
    const controller = new AbortController()
    const id = ++latest.current
    // 每次跑之前登记：失效侧按同一套 key 前缀命中就再跑一次（unmount 时注销）
    const unsubscribe = subscribe(keyRef.current, () => { void run() })
    setState({ status: 'loading' })
    void send(requestRef.current, {
      ...(bodyRef.current === undefined ? {} : { body: bodyRef.current }),
      signal: controller.signal,
    }).then((result) => {
      if (id !== latest.current) return // 晚到的结果丢掉（依赖已变或已卸载）
      setState(result.ok
        ? { status: 'ok', value: result.value }
        : { status: 'error', failure: { ...result, text: failureText(result) } })
    }).finally(() => {
      settle.current?.()
      settle.current = null
    })
    return () => {
      unsubscribe()
      latest.current += 1 // 让在途结果失效
      controller.abort()
      settle.current?.() // 这次被顶掉了：放行等待者，别悬着
      settle.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...key, attempt])

  /* 落定 = **state 已提交**（所以放在 effect 里，而不是 fetch 的 finally）：`await run()` 之后读到的就是新 state ✓ */
  useEffect(() => {
    if (state.status === 'loading') return
    settle.current?.()
    settle.current = null
  }, [state])

  /** 清回 `idle`（放下上次的结果，例如退出后要重新登录）。 */
  const reset = useCallback(() => {
    latest.current += 1
    settle.current?.()
    settle.current = null
    setState({ status: 'idle' })
  }, [])

  return { state, run, reset }
}
