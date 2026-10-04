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
    let settled: Promise<void> = Promise.resolve()
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
    expect(result.current.state.failure.text).toContain('连不上')
    expect(result.current.state.failure.text).not.toContain('request failed')
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
