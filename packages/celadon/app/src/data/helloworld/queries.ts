/* **`helloworld` 的 query 收口**：一行一个接口，把 key 与声明配成一对给调用方。
 *
 * 只在需要策略 / 参数时写，`api.ts` 仍只负责声明（不含 key）。取数时把这一对交给 `useRequest`：
 * `useRequest(query.request, { key: query.key, ... })`；失效时用同一个 `query.key`。 */

import { protectedGet, protectedPost, publicGet, publicPost } from './api'
import { helloKeys } from './keys'

export const publicGetQuery = () => ({ key: helloKeys.publicGet(), request: publicGet })
export const publicPostQuery = () => ({ key: helloKeys.publicPost(), request: publicPost })
export const protectedGetQuery = () => ({ key: helloKeys.protectedGet(), request: protectedGet })
export const protectedPostQuery = () => ({ key: helloKeys.protectedPost(), request: protectedPost })
