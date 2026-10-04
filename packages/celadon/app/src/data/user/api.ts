/* **`user` 域**：引擎的登录态接口（`openapi/user/user.go`）。
 *
 * 退出的凭据由出口带（Web = 浏览器 Cookie，HttpOnly，**JS 碰不到**；桌面 = 宿主 Bearer），
 * 服务端收到后**吊销** access/refresh 并 `DeleteAllAuthCookies` —— 前端**没有**能力自己清 Cookie。
 * **本机凭据的清理归退出动作**（`queries.ts` 的 `logoutQuery`）：成功后让平台按载体判 ——
 * 本机存凭据的删掉，Cookie 载体什么都不做。
 */

import type { Request } from '../request'
import type { LogoutResult } from './types'

export const logout: Request<void, LogoutResult> = { method: 'POST', path: '/user/logout' }
