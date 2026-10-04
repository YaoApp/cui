/* **脚手架**：公开 / 受保护 × GET / POST 四格（引擎 `yao/openapi/hello/hello.go:14-23`）。
 *
 * 它的用处是**用最小接口跑通整条路**：地址（well-known 的 openapi 前缀）→ 出口（transport）→
 * **凭据**（公开的那两个由浏览器/宿主决定带不带）→ 解包裹（裸对象）。第一个端到端样板就是它。
 */

import type { Request } from '../request'
import type { HelloWorld } from './types'

/** 公开（引擎侧无 `oauth.Guard`）—— 登录前也调得动。 */
export const publicGet: Request<void, HelloWorld> = { method: 'GET', path: '/helloworld/public' }
export const publicPost: Request<Record<string, unknown>, HelloWorld> = { method: 'POST', path: '/helloworld/public' }

/** 受保护（引擎侧 `oauth.Guard`）—— **凭据由出口带**（Web = 浏览器 Cookie · 桌面 = 宿主 Bearer）。 */
export const protectedGet: Request<void, HelloWorld> = { method: 'GET', path: '/helloworld/protected' }
export const protectedPost: Request<Record<string, unknown>, HelloWorld> = { method: 'POST', path: '/helloworld/protected' }

/* 用的时候就是一句话：`send(publicGet)` —— 请求元数据（语言 · 主题）由 `send()` 自动带上，
   要覆盖偏好时传 `preferences`。 */
