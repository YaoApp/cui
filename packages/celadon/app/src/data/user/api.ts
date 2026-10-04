/* **`user` 域**：引擎的登录态接口（`openapi/user/user.go`）。
 *
 * 退出的凭据由出口带（Web = 浏览器 Cookie，HttpOnly，**JS 碰不到**；桌面 = 宿主 Bearer），
 * 服务端收到后**吊销** access/refresh 并 `DeleteAllAuthCookies` —— 前端**没有**能力自己清 Cookie。
 */

import type { Request } from '../request'
import type { LogoutResult } from './types'

export const logout: Request<void, LogoutResult> = { method: 'POST', path: '/user/logout' }
