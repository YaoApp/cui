import { probe, transportFetch, transportFetchOk } from './fetch'
import { serviceBase, serviceUrl } from '../service/base'
/* 应用的**唯一出海口**：只有这里发请求（见 `architecture/17-transport.md`）。 */

export { probe, transportFetch, transportFetchOk, pickFetch, type FetchLike, type RequestOptions } from './fetch'
export { networkFailure, parseFailure, statusFailure, timeoutFailure, withTimeout } from './errors'
export { serviceBase, serviceUrl } from '../service/base'

/** 上层就用这一个面（与 `bridge` 同样的写法）。 */
export const transport = {
  fetch: transportFetch,
  fetchOk: transportFetchOk,
  probe,
  serviceBase,
  serviceUrl,
}
