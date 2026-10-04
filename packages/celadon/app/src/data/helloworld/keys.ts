/* **`helloworld` 的 key 族**：一个域根 + 每接口一条，全部经 `keyOf` 算 —— 订阅与失效同一算法。
 *
 * 域根在前，所以 `invalidate(helloKeys.all)` 命中本域全部接口，`invalidate(helloKeys.publicGet())`
 * 只命中公开 GET。公开 GET 与公开 POST 同路径、只有方法不同，`keyOf` 把方法也放进 key，两条不会混。 */

import { keyOf } from '../request'
import { protectedGet, protectedPost, publicGet, publicPost } from './api'

export const helloKeys = {
  /** 族根：`invalidate(helloKeys.all)` 命中本域每一条 */
  all: ['helloworld'] as const,
  publicGet: () => keyOf(publicGet, [...helloKeys.all, 'public']),
  publicPost: () => keyOf(publicPost, [...helloKeys.all, 'public']),
  protectedGet: () => keyOf(protectedGet, [...helloKeys.all, 'protected']),
  protectedPost: () => keyOf(protectedPost, [...helloKeys.all, 'protected']),
}
