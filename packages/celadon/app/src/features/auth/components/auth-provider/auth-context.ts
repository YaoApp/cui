import { createContext, useContext } from 'react'
import type { EntryAuthResponse, EntryConfig } from '@/data/user'

/** 登录页的三步：账号、密码、邀请码。 */
export type AuthPhase = 'account' | 'password' | 'invite'

/** 判定结果：走登录还是注册。 */
export type AuthVerifyStatus = 'login' | 'register'

/** 页面级提示：文案已翻译，`tone` 决定颜色与读屏的播报方式。 */
export type AuthNotice = { tone: 'info' | 'danger'; text: string }

export type AuthContextValue = {
  /** 入口配置；取回前是 `undefined`，页面据此给加载态。 */
  config?: EntryConfig
  phase: AuthPhase
  verifyStatus?: AuthVerifyStatus
  /** 临时令牌：只在内存里，随写请求的请求头送出，不落任何存储。 */
  tempToken: string
  /** 注册用的口令标识，服务端给，重发后更新。 */
  otpId: string
  /** 注册是否需要邮箱或手机验证码；由入口配置决定。 */
  needsCode: boolean
  /** 登录与注册之间要带上的用户名。 */
  username: string
  notice?: AuthNotice
  setNotice: (notice?: AuthNotice) => void
  setUsername: (username: string) => void
  /** 判定成功：记下临时令牌、判定结果与口令标识，并进入密码步。 */
  enterPassword: (input: { tempToken: string; status: AuthVerifyStatus; otpId?: string; needsCode: boolean }) => void
  /** 进入邀请码步，并用本次响应里的临时令牌替换旧的。 */
  enterInvite: (tempToken: string) => void
  /** 更新口令标识（重发验证码成功时用）。 */
  setOtpId: (otpId: string) => void
  /** 回到第一步并清掉判定结果与临时令牌。 */
  changeAccount: () => void
  /** 登录或注册成功：验签（配置允许时）、采纳会话、按成功地址跳转。返回是否走完。 */
  complete: (response: EntryAuthResponse) => Promise<boolean>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/** 取这个域的共享状态；不在 `AuthProvider` 里调用会直接报错，避免静默拿到空值。 */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be called inside AuthProvider')
  return value
}
