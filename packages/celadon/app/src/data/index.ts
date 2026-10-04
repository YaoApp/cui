export type { Failure, Result, Page } from './types'
export { unwrap } from './utils/unwrap'
export { paginate } from './utils/paging'
export { failure } from './utils/errors'
export { context } from './request/context'
// 头与 query 是**包装内部**用的（`request/send.ts` · `sse.ts` · `socket.ts`），不进对外面
// `type Context` 也从 `@/data/request/context` 直接取（名字太通用，不进 barrel）
