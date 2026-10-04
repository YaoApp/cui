/* **失效广播**（`05-data-and-api.md`）：`useRequest` 每次跑之前登记一份身份与重跑动作，
 * `invalidate(prefix)` 按 **startsWith 前缀语义**命中登记过的 key 并让它重跑。
 *
 * **订阅侧与失效侧必须调同一个 `keyOf` 算 key** —— 两边各算一份就会静默不生效：
 * 登记时是一个形状，失效时按另一个形状的前缀去找，一条都命中不了，也不会有任何报错。
 *
 * 这里**不做**缓存 · 去重 · 重试（各是各的事，见 `use-request.ts`）。
 */

import type { Request } from './send'

/** 一次登记：这份数据的身份 + 重跑它的动作。 */
type Subscription = { key: readonly unknown[]; rerun: () => void }

/** 模块级登记表：`useRequest` 每次跑之前登记，卸载时注销。 */
const subscriptions = new Set<Subscription>()

/** 数组前缀：`key` 以 `prefix` 开头为真，`prefix` 更长时为假。元素用 `Object.is` 比（与集合语义一致）。 */
function startsWith(key: readonly unknown[], prefix: readonly unknown[]): boolean {
  if (prefix.length > key.length) return false
  return prefix.every((one, index) => Object.is(one, key[index]))
}

/** **默认 key 算法**（唯一一处）：方法 + 路径 —— 可序列化 · 唯一区分 GET/POST · 可前缀匹配。
 *
 *  `extra` 放在最前面，是**族前缀**：域层 `keys.ts` 用它把一组接口收在一个域根下，
 *  这样 `invalidate(域根)` 能前缀命中本族的每一条，`keyOf(request)` 则退回方法与路径。 */
export function keyOf<Input = void, Output = void>(
  request: Request<Input, Output>,
  extra: readonly unknown[] = [],
): readonly unknown[] {
  return [...extra, request.method, request.path]
}

/** 登记一次订阅；返回注销函数（`useRequest` 在 effect 的清理里调用）。 */
export function subscribe(key: readonly unknown[], rerun: () => void): () => void {
  const subscription: Subscription = { key, rerun }
  subscriptions.add(subscription)
  return () => {
    subscriptions.delete(subscription)
  }
}

/** 让 key 以 `prefix` 开头的订阅重跑。**空前缀命中全部。** */
export function invalidate(prefix: readonly unknown[]): void {
  for (const subscription of [...subscriptions]) {
    if (startsWith(subscription.key, prefix)) subscription.rerun()
  }
}
