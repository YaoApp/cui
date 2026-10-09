import type { EntryAuthResponse, UserProfile } from '@/data/user'
import type { AuthUser } from './auth.store'

/** 取第一个非空字符串；其余类型与空串都跳过。 */
export function pick(...values: unknown[]): string | undefined {
  for (const value of values) if (typeof value === 'string' && value !== '') return value
  return undefined
}

/** 判定一份用户信息里到底有没有可展示的东西。 */
export function hasAny(user: AuthUser): boolean {
  return Boolean(user.userId || user.account || user.name || user.email)
}

/**
 * 从登录响应与 ID Token 的声明里取出欢迎页要展示的用户信息。
 *
 * 声明的来源见 `idTokenClaimsForDisplay`：只用于展示，不参与授权判断；
 * 没有的字段就不放，页面据此少显示一行。**用户标识优先**：姓名与邮箱可能没有，标识一定有。
 */
export function userInfo(response: EntryAuthResponse, account: string, claims?: Record<string, unknown>): AuthUser {
  const memberValue = claims?.['yao:member']
  const member = typeof memberValue === 'object' && memberValue !== null ? (memberValue as { display_name?: unknown }) : undefined
  return {
    userId: pick(response.user_id, claims?.['yao:user_id'], claims?.sub),
    account: pick(account),
    name: pick(claims?.name, member?.display_name),
    email: pick(claims?.email),
  }
}

/**
 * 从 `GET /user/profile` 的回应里取出同一份用户信息。
 *
 * 欢迎页在内存里没有登录那一刻的信息时（刷新、直接打开这一页）用它补一次；
 * 取不到任何可展示的字段时回 `undefined`，页面据此不画空表格。
 */
export function profileUser(profile: UserProfile | undefined): AuthUser | undefined {
  if (!profile) return undefined
  const user: AuthUser = {
    userId: pick(profile['yao:user_id'], profile.sub),
    name: pick(profile.name),
    email: pick(profile.email),
  }
  return hasAny(user) ? user : undefined
}
