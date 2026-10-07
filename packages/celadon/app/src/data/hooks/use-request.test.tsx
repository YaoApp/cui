import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request } from '../request/send'
import { invalidate } from '../request/invalidate'
import { useRequest } from './use-request'

const send = vi.hoisted(() => vi.fn())
vi.mock('../request/send', () => ({ send }))

const REQUEST = { method: 'GET', path: '/things' } as Request<void, string>

beforeEach(() => send.mockReset())

describe('useRequest', () => {
  it('drops the last result when reset, without leaving its waiter hanging', async () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    const { result } = renderHook(() => useRequest(REQUEST, { manual: true }))
    let settled: Promise<unknown> = Promise.resolve()
    act(() => { settled = result.current.run() })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'v' }))
    await settled

    act(() => result.current.reset())
    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('resolves a second run on the same hook, not only the first one', async () => {
    /* 手动钩子的第二次提交：上一轮的清理函数不能把这一轮的等待者当作旧的处理掉，
       否则 `await run()` 永不落定（第二次提交的调用方会停在原处）。 */
    send.mockResolvedValueOnce({ ok: true, value: 'first' }).mockResolvedValueOnce({ ok: true, value: 'second' })
    const { result } = renderHook(() => useRequest(REQUEST, { manual: true }))

    let first: Promise<unknown> = Promise.resolve()
    act(() => {
      first = result.current.run()
    })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'first' }))
    await first

    let second: Promise<unknown> = Promise.resolve()
    act(() => {
      second = result.current.run()
    })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'second' }))
    await expect(second).resolves.toEqual({ ok: true, value: 'second' })
    expect(send).toHaveBeenCalledTimes(2)
  })

    it('runs the declaration on mount and reports the value', async () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    const { result } = renderHook(() => useRequest(REQUEST))
    expect(result.current.state.status).toBe('loading')
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'v' }))
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toBe(REQUEST)
  })

  it('aborts on unmount', () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    const { unmount } = renderHook(() => useRequest(REQUEST))
    const signal = send.mock.calls[0][1].signal
    unmount()
    expect(signal.aborted).toBe(true)
  })

  it('waits to be asked when it is manual, and runs when asked', async () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    const { result } = renderHook(() => useRequest(REQUEST, { manual: true }))
    expect(send).not.toHaveBeenCalled()
    expect(result.current.state.status).toBe('idle')
    act(() => { void result.current.run() })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'v' }))
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('resolves the run promise once the call settles', async () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    const { result } = renderHook(() => useRequest(REQUEST, { manual: true }))
    let settled: Promise<unknown> = Promise.resolve()
    act(() => { settled = result.current.run() })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'v' }))
    await settled // 落定后 resolve（不悬）—— 且此时 state 已是新的 ✓
  })

  it('carries the body it was given', async () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    const request = { method: 'POST', path: '/things' } as Request<{ from: string }, string>
    const { result } = renderHook(() => useRequest(request, { manual: true }))
    act(() => { void result.current.run({ from: 'test' }) })
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1))
    expect(send.mock.calls[0][1].body).toEqual({ from: 'test' })
  })

  it('reports a failure as a value, with the translated text on screen', async () => {
    send.mockResolvedValue({
      ok: false,
      code: 'transport.network',
      params: { url: '/v1/things' },
      message: 'request failed',
    })
    const { result } = renderHook(() => useRequest(REQUEST))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    if (result.current.state.status !== 'error') throw new Error('expected the error state')
    // 数据层按码翻译：`data.error.transport.network` 的文案（见 app/src/locales/zh-CN.json）
    expect(result.current.state.failure.text).toContain('网络不通')
    expect(result.current.state.failure.text).not.toContain('request failed')
  })

  it('builds the request from the runtime context, so the call site does not change', async () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    const seeded: string[] = []
    renderHook(() =>
      useRequest<void, string>({
        key: ['built'],
        build: (ctx) => {
          seeded.push(ctx.locale)
          return { method: 'GET', path: `/things?locale=${ctx.locale}` } as never
        },
      }),
    )
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1))
    expect(seeded.length).toBeGreaterThan(0)
    expect(send.mock.calls[0][0]).toMatchObject({ path: expect.stringContaining('locale=') })
  })

  it('reruns when the matching prefix is invalidated, and only then', async () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    renderHook(() => useRequest(REQUEST))
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1))
    act(() => invalidate(['POST']))
    expect(send).toHaveBeenCalledTimes(1)
    act(() => invalidate(['GET']))
    expect(send).toHaveBeenCalledTimes(2)
    act(() => invalidate(['GET', '/things']))
    expect(send).toHaveBeenCalledTimes(3)
  })

  it('stops answering to invalidation once unmounted', async () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    const { unmount } = renderHook(() => useRequest(REQUEST))
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1))
    unmount()
    act(() => invalidate(['GET']))
    expect(send).toHaveBeenCalledTimes(1)
  })
})

describe('what run() hands back', () => {
  it('resolves with the result of this very call (so a caller can act in the action, not in an effect)', async () => {
    send.mockResolvedValue({ ok: true, value: 'v' })
    const { result } = renderHook(() => useRequest(REQUEST, { manual: true }))
    let answered: Promise<unknown> = Promise.resolve()
    act(() => {
      answered = result.current.run()
    })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'v' }))
    await expect(answered).resolves.toMatchObject({ ok: true, value: 'v' })
  })
})

describe('an action as the source', () => {
  it('runs the operation, reports its result, and never goes through send', async () => {
    const operation = vi.fn(async () => ({ ok: true as const, value: 'from-operation' }))
    const { result } = renderHook(() => useRequest({ key: ['action', 'sign-in'], operation }, { manual: true }))

    act(() => {
      void result.current.run()
    })

    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'from-operation' }))
    expect(operation).toHaveBeenCalledTimes(1)
    expect(send).not.toHaveBeenCalled()
  })
})

describe('two runs in the same tick', () => {
  it('settles the first promise too, instead of leaving it pending', async () => {
    send.mockResolvedValue({ ok: true, value: 'first' })
    const { result } = renderHook(() => useRequest(REQUEST, { manual: true }))

    let first: Promise<unknown> | undefined
    act(() => {
      first = result.current.run()
      void result.current.run()
    })

    // 被顶掉的那次按契约给 undefined：调用方不会悬着
    await expect(first).resolves.toBeUndefined()
  })
})
