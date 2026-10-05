/* **`user` 域**的线上形状（手写，来源：1.0 `packages/cui/openapi/user/types.ts` 与 `auth.ts` 的路径/返回）。
 *
 * 约定（`05-data-and-api.md` §3）：可空性照服务端实际；可选字段用 `?`；**枚举用字符串联合，不用 `enum`**。
 * 名称跟随服务端字段名，不改写 —— 少一层翻译就少一处漂移。
 */

/** `POST /user/logout` 的返回：服务端吊销令牌并清掉认证 Cookie。 */
export type LogoutResult = {
  message: string
}

/* ===== 入口（登录 / 注册）===== */

/** 登录的最终状态（1.0 `LoginStatus` 的值；用字符串联合）。 */
export type LoginStatus = 'ok' | 'mfa_required' | 'team_selection_required' | 'invite_verification_required'

/** 判定结果：走登录还是注册（1.0 `EntryVerificationStatus`）。 */
export type EntryVerificationStatus = 'login' | 'register'

/** 第三方登录的提供方（配置里给，界面只渲染）。 */
export type SigninProvider = {
  id: string
  label: string
  title: string
  logo?: string
}

/** 邀请码页的文案（配置里给）。 */
export type InvitePageConfig = {
  title?: string
  description?: string
  placeholder?: string
  apply_link?: string
  apply_prompt?: string
  apply_text?: string
}

/** `GET /user/entry`：统一入口配置 —— 标题 · 表单 · 验证码 · 第三方 · 邀请等都由它驱动。 */
export type EntryConfig = {
  title: string
  description: string
  success_url: string
  failure_url?: string
  logout_redirect?: string
  auto_login?: boolean
  role?: string
  type?: string
  form?: {
    username?: {
      placeholder: string
      fields: string[]
    }
    password?: {
      placeholder: string
    }
    /** 注册时的确认密码框（真实服务返回；1.0 类型里没有，以服务端为准）。 */
    confirm_password?: {
      placeholder: string
    }
    captcha?: {
      type: 'image' | 'turnstile'
      options?: {
        secret?: string
        sitekey?: string
      }
    }
    remember_me?: boolean
    forgot_password_link?: boolean
    terms_of_service_link?: string
    privacy_policy_link?: string
  }
  token?: {
    expires_in?: string
    /** 真实服务返回的是这个（1.0 类型里写作 `remember_me_expires_in`，与自己对不上） */
    refresh_token_expires_in?: string
    remember_me_refresh_token_expires_in?: string
  }
  invite_required?: boolean
  /** 注册是否需要邮箱/短信验证码（默认 true）。 */
  verification_code_required?: boolean
  invite?: InvitePageConfig
  third_party?: {
    providers: SigninProvider[]
  }
  /** 是否启用安全 Cookie（供前端判断能否本地验签）。 */
  secure_cookie?: boolean
}

/** `GET /user/entry/captcha`：图形或人机验证。 */
export type CaptchaResponse = {
  captcha_id: string
  /** Base64 图片或图片地址（由 `form.captcha.type` 决定形态）。 */
  captcha_image: string
  expires_in?: number
}

/** `POST /user/entry/verify` 的入参。 */
export type EntryVerifyRequest = {
  /** 邮箱或手机号。 */
  username: string
  captcha_id?: string
  captcha?: string
  locale?: string
}

/** `POST /user/entry/verify` 的返回：判定 + **临时令牌**（下一步用它）。 */
export type EntryVerifyResponse = {
  status: EntryVerificationStatus
  /** 临时令牌，下一步放 `Authorization`（**不进凭据库**）。 */
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  user_exists: boolean
  /** 注册时是否已发出验证码。 */
  verification_sent?: boolean
  /** 注册时的验证码 ID。 */
  otp_id?: string
}

/** `POST /user/entry/register` 的入参（需临时令牌）。 */
export type EntryRegisterRequest = {
  name?: string
  password: string
  confirm_password?: string
  otp_id?: string
  verification_code?: string
  locale?: string
}

/** `POST /user/entry/login` 的入参（需临时令牌）。 */
export type EntryLoginRequest = {
  password: string
  remember_me?: boolean
  locale?: string
}

/** `POST /user/entry/otp`：重发验证码。 */
export type EntrySendOTPResponse = {
  otp_id: string
  expires_in?: number
}

/** 登录 / 注册 / 邀请兑换成功后的令牌族（直接交给 `signIn`）。 */
export type EntryAuthResponse = {
  user_id?: string
  message?: string
  session_id?: string
  id_token?: string
  access_token?: string
  refresh_token?: string
  expires_in?: number
  refresh_token_expires_in?: number
  mfa_enabled?: boolean
  status?: LoginStatus
}

/** `POST /user/entry/invite/verify` 的入参（需带 `invite_verification` 作用域的临时令牌）。 */
export type EntryInviteRequest = {
  code: string
  locale?: string
}

/* ===== 第三方登录（OAuth · 本轮做）===== */

/** `GET /user/oauth/:id/authorize` 的查询参数。 */
export type OAuthAuthorizeQuery = {
  /** 回调地址；不传由服务端按入口推导。 */
  redirect_uri?: string
}

/** `GET /user/oauth/:id/authorize` 的返回：把浏览器送到这个地址。 */
export type OAuthAuthorizationUrl = {
  authorization_url: string
}

/** `POST /user/oauth/:id/callback` 的入参（OAuth 回调带回来的）。 */
export type OAuthCallbackRequest = {
  code: string
  state?: string
  locale?: string
}

/* ===== 设备码流（RFC 8628 · 本轮做）===== */

/** `POST /oauth/device/authorize` 的入参：**已登录**用户在设备授权页确认用户码。 */
export type DeviceAuthorizeRequest = {
  user_code: string
}

/** `POST /oauth/device/authorize` 的返回。 */
export type DeviceAuthorizeResult = {
  status: string
}

/** `POST /user/oauth/:providerId/device/authorize` 的返回（RFC 8628 §3.2 的标准字段）。 */
export type DeviceFlowStart = {
  device_code: string
  user_code: string
  verification_uri: string
  /** 真实服务同时给了这个（与 `verification_uri` 同值，服务端的历史字段） */
  verification_url?: string
  verification_uri_complete?: string
  expires_in: number
  interval?: number
}

/** `POST /user/oauth/:providerId/device/token` 的入参（轮询）。 */
export type DeviceFlowTokenRequest = {
  device_code: string
  locale?: string
}

/** 轮询结果：`pending` 表示还在等授权；`success` 时带令牌族。
 *  **失败不走这里**：未授权/IdP 拒绝时服务端回标准的 `{error, error_description}`，由出口归一成 `Failure`。 */
export type DeviceFlowTokenResult = {
  status: 'pending' | 'success' | string
} & EntryAuthResponse

/* ===== 验签（ID Token · 本轮做）===== */

/** 单个 JWK（RFC 7517 的字段子集，够验签用）。 */
export type JsonWebKey = {
  kty: string
  kid?: string
  use?: string
  alg?: string
  n?: string
  e?: string
  x5c?: string[]
}

/** `GET /oauth/jwks`：验 ID Token 用公钥集。 */
export type Jwks = {
  keys: JsonWebKey[]
}
