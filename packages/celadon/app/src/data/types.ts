/* **数据层的公共形状**（`05-data-and-api.md`）—— 0.1 错误 · 0.2 列表/分页 · 0.3 包裹。
 *
 * 一条原则：**失败只有一种形状**（与 `platform/transport/` 的 `{code, params, message}` 同源，见 `17 §2`），
 * 业务错误往里加**字段级问题**，不另造一套。
 */

/** 一次调用的失败：传输失败 + 服务端业务错误，**同一种形状**（与 `platform/transport` 的字段一致）。
 *
 *  **为什么不带域前缀**：出口是 `@/data`，来源写在 import 路径里就够；
 *  平台那侧的 `BridgeFailure` 保留前缀，是为了在同一次排查里分辨"这条失败来自**宿主桥**还是**服务接口**"。
 *
 *  **引擎的错误体是 OAuth 形状**（`yao/openapi/oauth/types/types.go:35-45`）：
 *  `{ error, error_description, error_uri, state, reason, required_scopes, missing_scopes }` ——
 *  **没有字段级 `fields`/`errors`**（`yao` 里字段校验信息只拼在 `error_description` 文本里），所以这里也不编。 */
export type Failure = {
  /** 码：`transport.*`（传输）或服务端/业务码（如 `user.invalid`） */
  code: string
  /** 给插值的参数（如 `{ status }`） */
  params: Record<string, unknown>
  /** 英文诊断信息（引擎的 `error_description`）：**只给日志**，文案由应用按码翻译 */
  message: string
  /** OAuth 的 `required_scopes`（引擎会给） */
  requiredScopes?: readonly string[]
  /** OAuth 的 `missing_scopes` */
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
