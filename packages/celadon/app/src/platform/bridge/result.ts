/* **桥的返回值形状**：失败是**值**，不是异常。
 *
 * 为什么单独一份：桥的每个命令、每个调用方都要用同一套判别方式。
 * 上层**不去摸 `.ok` 字段**，用这里的构造与判别函数 —— 形状要改时只改这一处。 */

/** 失败原因分类：上层按它决定"提示"还是"降级"，不去猜字符串。 */
export type BridgeFailure =
  | 'unavailable' // Web 下本来就没有宿主
  | 'not-running' // 宿主在，但命令没注册
  | 'rejected'    // 宿主明确拒绝（权限 · 参数）
  | 'unknown'

/** 一次桥调用的结果：要么有值，要么有可读的原因。 */
export type BridgeResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: BridgeFailure; message: string }

/** 成功。 */
export function ok<T>(value: T): BridgeResult<T> {
  return { ok: true, value }
}

/** 失败（`message` 是给人看的一句话，不要塞秘密）。 */
export function fail<T = never>(reason: BridgeFailure, message: string): BridgeResult<T> {
  return { ok: false, reason, message }
}

/** 判别成功。上层用它收窄类型，而不是到处写 `.ok === true`。 */
export function isOk<T>(result: BridgeResult<T>): result is { ok: true; value: T } {
  return result.ok === true
}

/** 取值，拿不到就给缺省 —— **显示层用它**：桥不在也要能把界面画出来。 */
export function valueOr<T>(result: BridgeResult<T>, fallback: T): T {
  return result.ok ? result.value : fallback
}

/** 把失败原因翻成日志/调试页能读的一行（成功时返回空串）。 */
export function describeFailure<T>(result: BridgeResult<T>): string {
  return result.ok ? '' : `${result.reason}: ${result.message}`
}
