import { describe, expect, it, vi } from 'vitest'
import { retry } from './retry'
import { fail, ok, type BridgeResult } from '../bridge/result'
import { isRetryable, statusFailure } from '../transport/errors'

const noSleep = async () => {}

function failingThenOk(failures: number, failure = fail('transport.network', 'down')) {
  let seen = 0
  const run = vi.fn(async (): Promise<BridgeResult<string>> => {
    seen += 1
    return seen <= failures ? failure : ok('done')
  })
  return { run, calls: () => seen }
}

describe('retry', () => {
  it('does not retry by default: one attempt unless asked', async () => {
    const { run, calls } = failingThenOk(3)
    const result = await retry(run)
    expect(result.ok).toBe(false)
    expect(calls()).toBe(1)
  })

  it('retries a retryable failure until it succeeds', async () => {
    const { run, calls } = failingThenOk(2)
    const result = await retry(run, { attempts: 3, sleep: noSleep })
    expect(result).toMatchObject({ ok: true, value: 'done' })
    expect(calls()).toBe(3)
  })

  it('stops at the attempt limit and keeps the last failure', async () => {
    const { run, calls } = failingThenOk(9)
    const result = await retry(run, { attempts: 3, sleep: noSleep })
    expect(result).toMatchObject({ ok: false, code: 'transport.network' })
    expect(calls()).toBe(3)
  })

  it('leaves the decision to the caller: a non-retryable failure is not retried', async () => {
    const { run, calls } = failingThenOk(3, fail('transport.parse', 'bad body'))
    const result = await retry(run, { attempts: 5, sleep: noSleep })
    expect(result.ok).toBe(false)
    expect(calls()).toBe(1)
  })

  it('back off grows, and stays under the ceiling', async () => {
    const waits: number[] = []
    const { run } = failingThenOk(4)
    await retry(run, { attempts: 4, baseDelayMs: 100, maxDelayMs: 250, sleep: async (ms) => { waits.push(ms) } })
    expect(waits).toEqual([100, 200, 250])
  })
})

describe('isRetryable', () => {
  it('says yes to the transient kinds, no to the rest', () => {
    expect(isRetryable(fail('transport.network', 'down'))).toBe(true)
    expect(isRetryable(fail('transport.timeout', 'slow'))).toBe(true)
    expect(isRetryable(statusFailure(new Response('', { status: 503 }), 'https://x'))).toBe(true)
    expect(isRetryable(statusFailure(new Response('', { status: 429 }), 'https://x'))).toBe(true)
    expect(isRetryable(statusFailure(new Response('', { status: 404 }), 'https://x'))).toBe(false)
    expect(isRetryable(fail('transport.parse', 'bad body'))).toBe(false)
  })
})
