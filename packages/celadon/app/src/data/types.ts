/* **数据层的公共形状**（`05-data-and-api.md`）—— 0.1 错误 · 0.2 列表/分页 · 0.3 包裹。
 *
 * 一条原则：**失败只有一种形状**（与 `platform/transport/` 的 `{code, params, message}` 同源，见 `17 §2`），
 * 业务错误往里加**字段级问题**，不另造一套。
 */

/** 字段级校验问题（服务端指哪个字段错了）。 */
export type FieldIssue = {
  /** 字段路径（如 `name` · `profile.email`） */
  path: string
  /** 码，给程序；文案由应用按码翻译 */
  code: string
  params?: Record<string, unknown>
}

/** 一次调用的失败：传输失败 + 服务端业务错误，**同一种形状**（与 `platform/transport` 的字段一致）。 */
export type ApiFailure = {
  /** 码：`transport.*`（传输）或服务端/业务码（如 `user.invalid`） */
  code: string
  /** 给插值的参数（如 `{ status }`） */
  params: Record<string, unknown>
  /** 英文诊断信息：**只给日志**，文案由应用按码翻译 */
  message: string
  /** 服务端认为哪些字段不对（没有就不带） */
  fields?: readonly FieldIssue[]
}

/** 一次调用的结果（成功的值 / 失败的形状）。 */
export type ApiResult<T> = { ok: true; value: T } | ({ ok: false } & ApiFailure)

/** **0.2 列表与分页只有一种**（旧代码四套命名一律归到这里）。 */
export type Page<T> = {
  items: readonly T[]
  /** 总数（拿不到时为 undefined —— 不编 0，避免"看起来是空"） */
  total?: number
  page: number
  pageSize: number
  /** 还有没有下一页（能算就算，算不了就不带） */
  hasMore?: boolean
}
