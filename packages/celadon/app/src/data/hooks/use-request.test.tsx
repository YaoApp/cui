import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useRequest } from './use-request'

describe('useRequest', () => {
  it('runs on mount and reports the value', async () => {
    const call = vi.fn(async () => ({ ok: true as const, value: 'v' }))
    const { result } = renderHook(() => useRequest(call, []))
    expect(result.current.state.status).toBe('loading')
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'v' }))
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('aborts on unmount', async () => {
    const call = vi.fn((signal: AbortSignal) => new Promise<never>(() => signal.addEventListener('abort', () => undefined)))
    const { unmount } = renderHook(() => useRequest(call as never, []))
    unmount()
    expect(call.mock.calls[0][0].aborted).toBe(true)
  })

  it('waits to be asked when it is manual, and runs when asked', async () => {
    const call = vi.fn(async () => ({ ok: true as const, value: 'v' }))
    const { result } = renderHook(() => useRequest(call, [], { manual: true }))
    expect(call).not.toHaveBeenCalled()
    expect(result.current.state.status).toBe('idle')
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', value: 'v' }))
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('reports a failure as a value, never as a throw', async () => {
    const call = vi.fn(async () => ({ ok: false as const, code: 'transport.offline', params: {}, message: 'offline', rawMessage: 'offline' }))
    const { result } = renderHook(() => useRequest(call, []))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    if (result.current.state.status === 'error') expect(result.current.state.failure.code).toBe('transport.offline')
  })
})
