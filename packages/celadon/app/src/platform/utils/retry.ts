/* **重试的循环**，放在 `transport/` **上面**（见 `17-transport.md` §2）。
 *
 * 为什么不在 `transport/`：重试是**策略**，它取决于"这个操作幂等不幂等"——
 * 那是调用方（`data/` 与 feature）知道的事。`transport/` 只回答"这类失败**能不能**重试"
 * （`isRetryable`），**要不要重试由这里传进来的 `shouldRetry` 决定**。
 *
 * 默认 `attempts = 1`（**不重试**）：要重试就显式要，别让"悄悄重发"成为默认行为。 */

import { isRetryable } from '../transport/errors'
import type { BridgeFailure, BridgeResult } from '../bridge/result'

export type RetryOptions = {
  /** 总尝试次数（含第一次）；缺省 1 = 不重试。 */
  attempts?: number
  /** 退避基数（毫秒），按 2 的幂增长。 */
  baseDelayMs?: number
  /** 单次退避上限（毫秒）。 */
  maxDelayMs?: number
  /** 要不要重试这一次失败 —— **调用方按幂等性决定**。 */
  shouldRetry?: (failure: BridgeFailure) => boolean
  /** 等待函数（测试注入，免得真等）。 */
  sleep?: (ms: number) => Promise<void>
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** 跑一次；失败且"该重试"就按退避再来，直到用满次数。 */
export async function retry<T>(
  run: () => Promise<BridgeResult<T>>,
  options: RetryOptions = {},
): Promise<BridgeResult<T>> {
  const {
    attempts = 1,
    baseDelayMs = 250,
    maxDelayMs = 4_000,
    shouldRetry = isRetryable,
    sleep = defaultSleep,
  } = options

  let last = await run()
  for (let attempt = 1; attempt < attempts && !last.ok; attempt += 1) {
    if (!shouldRetry(last)) return last
    const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs)
    await sleep(delay)
    last = await run()
  }
  return last
}
