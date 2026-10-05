/* **取数钩子**：把一份接口**声明**跑成一次请求 —— 四态 · 取消 · 重跑，**唯一实现**（`05 §4`）。
 *
 * 只做"React 的那部分"：挂载时跑、卸载时取消、key 变了重跑、晚到的结果丢掉、失败按码翻译。
 * **取数本身在 `request/send.ts`**；**重试由调用方决定**（`17 §2.1`：策略在出口之上）；
 * 失效广播在 `request/invalidate.ts`（同一套 `keyOf`）。
 *
 * **不做**：缓存 · 去重（同一份数据两处用由调用方提升共享）· 焦点/重连再取 · 乐观更新 ·
 * 重试（重试是出口之上的策略，见 `17 §2.1`）。 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { i18n } from '@/platform/i18n'
import { dataErrorText } from '../utils/error-text'
import type { Failure, Result } from '../types'
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
 *  **`run(body?)` 在这一次的 state 提交之后 resolve，并把这次的结果回传** —— `await run()` 读完即新值。 */
/** 取数的两种写法：直接给**声明**，或给域层的 **query 对象**（`{ key, request }`，见 `data/<域>/queries.ts`）。
 *  query 对象让 key 由域层收口（族前缀 → `invalidate(keys.all)` 才能命中）。 */
export type RequestSource<Input, Output> =
  | Request<Input, Output>
  | { key: readonly unknown[]; request: Request<Input, Output> }
  /** **动作**：自己发请求，可能还要让平台做点事（如登录成功后收下令牌）。key 必给。 */
  | { key: readonly unknown[]; operation: (input?: Input) => Promise<Result<Output>> }

/** 取文案的入口：i18next 取不到 key 会原样返回，`dataErrorText` 据此回退并告警。 */
const translate = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key as never, options as never) as unknown as string

export function useRequest<Input = void, Output = void>(
  source: RequestSource<Input, Output>,
  options: RequestOptions<Input> = {},
): { state: RequestState<Output>; run: (body?: Input) => Promise<Result<Output> | undefined>; reset: () => void } {
  const operation = 'operation' in source ? source.operation : undefined
  const request: Request<Input, Output> | undefined = operation
    ? undefined
    : 'request' in source
      ? source.request
      : (source as Request<Input, Output>)
  const declaredKey = 'request' in source || 'operation' in source ? source.key : undefined
  const [state, setState] = useState<RequestState<Output>>({ status: 'idle' })
  const [attempt, setAttempt] = useState(0)
  const latest = useRef(0)
  const settle = useRef<((result: Result<Output> | undefined) => void) | null>(null)
  /* 本次的结果：就算这次被顶掉，也让等待者拿到真实结果（不是笼统的「被取消」）*/
  const settled = useRef<Result<Output> | undefined>(undefined)
  const requestRef = useRef(request)
  requestRef.current = request
  const operationRef = useRef(operation)
  operationRef.current = operation
  // `options.body` 是默认包体；`run(body)` 为这一次覆盖它。身份没变就不覆盖 `run` 的选择。
  const bodyRef = useRef<Input | undefined>(options.body)
  const defaultBodyRef = useRef(options.body)
  if (!Object.is(defaultBodyRef.current, options.body)) {
    defaultBodyRef.current = options.body
    bodyRef.current = options.body
  }
  const key = options.key ?? declaredKey ?? (request ? keyOf(request) : [])
  const keyRef = useRef(key)
  keyRef.current = key

  /* 改 key 或 `run()` 都只做一件事：让下面的 effect 再跑一次（真正的请求在 effect 里发）。 */
  const run = useCallback(
    (body?: Input) => new Promise<Result<Output> | undefined>((resolve) => {
      if (body !== undefined) bodyRef.current = body
      // 上一次还没被接走的等待者：先放行，别让它悬着（同一 tick 连调两次 run()）
      settle.current?.(settled.current)
      settle.current = resolve
      settled.current = undefined
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
    const answer = operationRef.current
      ? operationRef.current(bodyRef.current)
      : send(requestRef.current as Request<Input, Output>, {
          ...(bodyRef.current === undefined ? {} : { body: bodyRef.current }),
          signal: controller.signal,
        })
    void answer
      .then((result) => {
      settled.current = result
      if (id !== latest.current) return // 晚到的结果丢掉（依赖已变或已卸载）
      setState(result.ok
        ? { status: 'ok', value: result.value }
        : { status: 'error', failure: { ...result, text: dataErrorText(translate, result) } })
    })
      .catch((error: unknown) => {
        // 出口自己吞掉失败，只有"响应不是 JSON"这种会抛到这里：也落成失败态，别让等待者悬着
        if (id !== latest.current) return
        settled.current = undefined
        setState({
          status: 'error',
          failure: {
            code: 'transport.parse',
            params: {},
            message: error instanceof Error ? error.message : String(error),
            text: dataErrorText(translate, { code: 'transport.parse', params: {}, message: '' }),
          },
        })
      })
    return () => {
      unsubscribe()
      latest.current += 1 // 让在途结果失效
      controller.abort()
      settle.current?.(settled.current) // 这次被顶掉了：放行等待者，别悬着
      settle.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...key, attempt])

  /* 落定 = **state 已提交**（所以放在 effect 里，而不是 fetch 的 finally）：`await run()` 之后读到的就是新 state ✓ */
  useEffect(() => {
    if (state.status === 'loading') return
    settle.current?.(settled.current)
    settle.current = null
  }, [state])

  /** 清回 `idle`（放下上次的结果，例如退出后要重新登录）。
   *  **不中止在飞请求** —— 只是让它的结果作废（要中止就先卸载或在调用方 abort）。 */
  const reset = useCallback(() => {
    latest.current += 1
    settle.current?.(settled.current)
    settle.current = null
    setState({ status: 'idle' })
  }, [])

  return { state, run, reset }
}
