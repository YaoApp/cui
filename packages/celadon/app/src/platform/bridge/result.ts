/* **桥的返回值形状**：失败是**值**，不是异常。
 *
 * 失败带三样：`code`（稳定机器码，给程序）· `params`（插值，给文案）· `message`（英文诊断，给日志）。
 * **界面文案由应用按 `code` 翻译**（见 `08-i18n.md`）—— 宿主不返回给用户看的句子。
 * 上层**不摸 `.ok` 字段**，用这里的构造与判别函数。 */

export type BridgeFailure = {
  ok: false
  /** `<域>.<动作>_<原因>`，如 `theme.expected_light_or_dark` */
  code: string
  /** 文案插值用的值 */
  params: Record<string, unknown>
  /** 英文诊断：进日志/调试页，**不上界面** */
  message: string
}

export type BridgeResult<T> = { ok: true; value: T } | BridgeFailure

/** 成功。 */
export function ok<T>(value: T): BridgeResult<T> {
  return { ok: true, value }
}

/** 失败。`message` 是英文诊断，不是给用户看的句子。 */
export function fail(code: string, message: string, params: Record<string, unknown> = {}): BridgeFailure {
  return { ok: false, code, params, message }
}

/** 判别成功。上层用它收窄类型，而不是到处写 `.ok === true`。 */
export function isOk<T>(result: BridgeResult<T>): result is { ok: true; value: T } {
  return result.ok === true
}

/** 取值，拿不到就给缺省 —— **显示层用它**：桥不在也要能把界面画出来。 */
export function valueOr<T>(result: BridgeResult<T>, fallback: T): T {
  return result.ok ? result.value : fallback
}

/** 把失败翻成一行日志（`code: message`；成功时返回空串）。 */
export function describeFailure<T>(result: BridgeResult<T>): string {
  return result.ok ? '' : `${result.code}: ${result.message}`
}
