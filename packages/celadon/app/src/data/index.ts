/* **数据层对外面**：上层只从 `@/data` 取东西，**不伸手进它的内部目录**。
 *
 * 带什么不带什么是有意的：
 *   · 不带 `Context` 类型 —— 名字太通用，需要时从 `@/data/request/context` 直接取
 *   · 不带 `headers` / `query` —— 那是包装内部用的（`request/send.ts` · 将来的 `sse.ts` · `socket.ts`）
 */

export type { Failure, Page, Result } from './types'
export { failure, paginate, unwrap } from './utils'
export { context, invalidate, keyOf, send, type Request, type RequestOptions } from './request'
export { useRequest, type RequestState } from './hooks'
