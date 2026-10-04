/* **数据层的公共形状**（`05-data-and-api.md`）—— 0.1 错误 · 0.2 列表/分页 · 0.3 包裹。
 *
 * 一条原则：**失败只有一种形状**（与 `platform/transport/` 的 `{code, params, message}` 同源，见 `17 §2`），
 * 业务错误往里加**字段级问题**，不另造一套。
 */

/** 一次调用的失败。**消息分两级，别混**：
 *
 *  | 级别 | 字段 | 谁看 | 怎么来 |
 *  | --- | --- | --- | --- |
 *  | **上层（应用）** | `code` + `params` | **用户** | 应用**按码翻译**（`platform/bridge` 的 `bridgeErrorText`）+ `params` 插值 |
 *  | **上层（兜底）** | `message` | 日志 · 无翻译时的兜底 | **由 `code` 与业务场景算出来**（见 `failure()`）|
 *  | **底层（原文）** | `rawMessage` | **只给排查** | 宿主桥 / 引擎的 `error_description` 原文，**不许上屏** |
 *
 *  **渲染一律走"按码翻译"**：`message` 只是兜底，不是用户文案（否则 4 语就废了）。
 *
 *  **引擎的错误体是 OAuth 形状**（`yao/openapi/oauth/types/types.go:35-45`）：
 *  `{ error, error_description, error_uri, state, reason, required_scopes, missing_scopes }` ——
 *  **没有字段级 `fields`/`errors`**（字段校验信息只拼在 `error_description` 文本里），所以这里也不编。 */
export type Failure = {
  /** **上层**：给用户的消息的码（`transport.*` 或服务端/业务码）—— 由应用翻译 */
  code: string
  /** **上层**：给用户的消息的**插值参数**（如 `{ status }` · `{ name }`） */
  params: Record<string, unknown>
  /** **上层兜底**：由 `code` 与业务场景算出来的可读句（**英文**，见 `08-i18n.md`：英文只给诊断）—— 渲染仍按码翻译 */
  message: string
  /** **底层原文**：宿主桥 / 引擎的 `error_description` —— 只给日志与排查，**不许上屏** */
  rawMessage?: string
  /** 引擎给的 `required_scopes`（OAuth） */
  requiredScopes?: readonly string[]
  /** 引擎给的 `missing_scopes` */
  missingScopes?: readonly string[]
}

/** 一次调用的结果（成功的值 / 失败的形状）。 */
export type Result<T> = { ok: true; value: T } | ({ ok: false } & Failure)

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
