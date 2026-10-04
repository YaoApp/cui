import { signOut } from '@/platform/credential'
import { send } from '../request/send'
import type { Result } from '../types'
import { logout } from './api'
import type { LogoutResult } from './types'
import { userKeys } from './keys'

/** 退出登录：`POST /user/logout` 让**服务端吊销**（Web 的 Cookie 也由响应清掉）；
 *  成功后再让平台按载体判一下**本机凭据**（本机存凭据的删掉，Cookie 载体什么都不做）。 */
export const logoutQuery = (): { key: readonly unknown[]; operation: () => Promise<Result<LogoutResult>> } => ({
  key: userKeys.logout(),
  operation: async () => {
    const result = await send(logout)
    if (!result.ok) return result
    // 服务端吊销成功，但本机那把删不掉也要说 —— 否则页面显示"已退出"而凭据还在
    const cleared = await signOut()
    return cleared.ok ? result : cleared
    return result
  },
})
