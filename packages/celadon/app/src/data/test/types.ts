/* 引擎「测试模式」的登录与查询接口的线上形状（前缀由 well-known 的 `openapi` 给，不写死）。
 *
 * 这些路由**只在开发实例上注册**（免鉴权 · 响应头带 `X-Test-Mode: true`）；正式环境不注册它们，请求回 404。
 * 表里两个坑：
 *   ① `user` 传**邮箱**最稳 —— 12 位纯数字会被引擎当手机号（`^\+?[0-9]{10,15}$`）→ 400；
 *   ② `login/web` 下发的三个 Cookie 是 `SameSite=Strict` —— 应用与引擎**同源**时才收得下（dev 代理同源）。
 */

/** 一次测试登录的请求体（`login/web` 与 `login/token` 同一形状）。 */
export type LoginAttempt = {
  /** 邮箱 / 手机号 / 用户 id —— 传**邮箱**最稳（见文件头 ①） */
  user: string
  team_id?: string
}

/** 测试登录的回应 —— 写 Cookie 的那条与不写的那条回同一形状。**值是凭据，不上屏**。 */
export type LoginResult = {
  session_id: string
  id_token: string
  access_token: string
  refresh_token: string
  /** 访问凭据的寿命（秒） */
  expires_in: number
  /** 刷新凭据的寿命（秒） */
  refresh_token_expires_in: number
  status: string
}

/** 建服务端密钥的请求体；`ttl` 是 Go duration（如 `"24h"`）。 */
export type ServerKeyRequest = {
  /** 默认 `test-node` */
  name?: string
  ttl?: string
}

/** 服务端密钥 —— `key` **只显示一次**。 */
export type ServerKey = {
  key: string
  key_id: string
  name: string
  expires_at?: string
}

/** `/test/users` 的一行（表里给的全是这些字段）。 */
export type TestUser = {
  id: string
  user_id: string
  preferred_username?: string
  email?: string
  email_verified?: boolean
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  status?: string
  role_id?: string
  type_id?: string
}

/** `/test/users` 的回应：**列表与分页字段同层**（`unwrap` 不会剥它，因为键不止信封词汇）。 */
export type TestUserPage = {
  data: TestUser[]
  page: number
  pagesize: number
  pagecnt: number
  total: number
  next?: string | null
  prev?: string | null
}

/** `/test/teams` 的一行。 */
export type TestTeam = {
  team_id: string
  name: string
  display_name?: string
  description?: string
  website?: string
  logo?: string
  owner_id?: string
  status?: string
  role_id?: string
  type_id?: string
  type?: string
  is_verified?: boolean
  verified_at?: string
  created_at?: string
  updated_at?: string
}

/** 用户列表的查询参数（`pagesize` 上限 100）。 */
export type UserListQuery = {
  page?: number
  pagesize?: number
  status?: string
}

/** 团队列表的查询参数（`user_id` 选填）。 */
export type TeamListQuery = {
  user_id?: string
}

/** `/test/otp` 的查询参数 —— `code` 必填。 */
export type OtpLookup = {
  code: string
}

/** 一次性口令的当前状态 —— 这个接口**不消费**该 code。 */
export type OtpPayload = {
  code: string
  user_id: string
  team_id: string
  member_id: string
  redirect: string
  scope: string
  consume: boolean
}

/** `/test/captcha` 的查询参数 —— `id` 必填。 */
export type CaptchaLookup = {
  id: string
}

/** 图形验证码的答案。 */
export type CaptchaAnswer = {
  id: string
  answer: string
}
