import type { EntryAuthResponse } from '@/data/user'
import type { AuthUser } from './auth.store'

/** 取第一个非空字符串；其余类型与空串都跳过。 */
function pick(...values: unknown[]): string | undefined {
  for (const value of values) if (typeof value === 'string' && value !== '') return value
  return undefined
}

/**
 * 从登录响应与 ID Token 的声明里取出欢迎页要展示的用户信息。
 *
 * 声明的来源见 `idTokenClaimsForDisplay`：只用于展示，不参与授权判断；
 * 没有的字段就不放，页面据此少显示一行。
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
