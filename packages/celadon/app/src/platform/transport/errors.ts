/* 四类失败**归一成一种形状**（`17-transport.md` §2）：网络 / 超时 / HTTP 状态 / 解析。
   形状与桥一致（`{ code, params, message }`）：码给程序 · 参数给插值 · 英文给日志。 */

import { fail, type BridgeFailure } from '../bridge/result'

export function networkFailure(error: unknown, url: string): BridgeFailure {
  const detail = error instanceof Error ? error.message : String(error)
  return fail('transport.network', `request failed: ${detail}`, { url })
}

export function timeoutFailure(url: string, timeoutMs: number): BridgeFailure {
  return fail('transport.timeout', `no answer within ${timeoutMs}ms`, { url, timeout: timeoutMs })
}

export function statusFailure(response: Response, url: string): BridgeFailure {
  return fail('transport.status', `unexpected status ${response.status}`, { url, status: response.status })
}

export function parseFailure(error: unknown, url: string): BridgeFailure {
  const detail = error instanceof Error ? error.message : String(error)
  return fail('transport.parse', `could not read the body: ${detail}`, { url })
}

/** 超时用 `AbortController` 实现（两种宿主都支持）。 */
export async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  url: string,
  // **不填就不限时**：出口提供能力，数字由业务方给（17 §2.2）
  timeoutMs?: number,
): Promise<{ ok: true; value: T } | { ok: false; failure: BridgeFailure }> {
  const controller = new AbortController()
  const timer = timeoutMs === undefined ? undefined : setTimeout(() => controller.abort(), timeoutMs)
  try {
    return { ok: true, value: await run(controller.signal) }
  } catch (error) {
    // 只有"我们设了超时"才算超时；没设还想 abort，那是别的原因
    if (controller.signal.aborted && timeoutMs !== undefined) {
      return { ok: false, failure: timeoutFailure(url, timeoutMs) }
    }
    return { ok: false, failure: networkFailure(error, url) }
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/** **这类失败能不能重试** —— 只给事实，**不做决定**（见 `17-transport.md` §2「谁决定重试」）。
 *  决定在上层：它知道这个操作幂等不幂等（GET 幂等、POST 一般不是、带幂等键的算幂等）。 */
export function isRetryable(failure: BridgeFailure): boolean {
  if (failure.code === 'transport.network' || failure.code === 'transport.timeout') return true
  if (failure.code === 'transport.status') {
    const status = Number(failure.params.status)
    // 408 请求超时 · 425 太早 · 429 限流 · 5xx 服务端
    return status === 408 || status === 425 || status === 429 || status >= 500
  }
  return false
}
