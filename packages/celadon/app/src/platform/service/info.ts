/* **服务信息**（`architecture/15-platform.md` §3）：**启动时读一次** `GET /.well-known/yao`，结果进缓存。
 *
 * 三条按架构来：
 *   · **相对路径**：开发期由 dev server 代转（`16-development.md` §1/§3），生产同源，桌面由宿主给基址
 *   · **后端地址不进代码**：`YAO_SERVER_HOST` 由运行环境给
 *   · **失败是值**：读不到/字段不对都给可读的码，不抛异常
 */

import { fail, ok, type BridgeResult } from '../bridge/result'
import { transportFetch } from '../transport/fetch'
import { serviceUrl } from './base'

export type ServiceInfo = {
  name: string
  version: string
  /** 接口根（如 `/v1`）—— 所有请求以它为前缀 */
  openapi: string
}

/** 只认该有的字段：`openapi` 必须以 `/` 开头（它是所有请求的前缀，不能是别的形状）。 */
export function parseServiceInfo(raw: unknown): BridgeResult<ServiceInfo> {
  if (!raw || typeof raw !== 'object') {
    return fail('service.malformed', 'service info is not an object', {})
  }
  const value = raw as Record<string, unknown>
  const openapi = value.openapi
  if (typeof openapi !== 'string' || !openapi.startsWith('/')) {
    return fail('service.malformed', 'service info has no openapi root', { openapi: String(openapi) })
  }
  return ok({
    name: typeof value.name === 'string' ? value.name : '',
    version: typeof value.version === 'string' ? value.version : '',
    openapi,
  })
}

let cached: ServiceInfo | undefined

/** 读一次并缓存（再有调用直接用缓存，**不重复请求**）。 */
export async function loadServiceInfo(): Promise<BridgeResult<ServiceInfo>> {
  if (cached) return ok(cached)
  const response = await transportFetch(serviceUrl('/.well-known/yao'))
  if (!response.ok) return response
  if (!response.value.ok) {
    return fail('service.unavailable', `the service answered ${response.value.status}`, {
      status: response.value.status,
    })
  }
  let raw: unknown
  try {
    raw = await response.value.json()
  } catch (error) {
    return fail('service.malformed', `could not read the body: ${String(error)}`, {})
  }
  const parsed = parseServiceInfo(raw)
  if (parsed.ok) cached = parsed.value
  return parsed
}

/** 缓存里的那一份（没读过就是 `undefined`）。 */
export function serviceInfo(): ServiceInfo | undefined {
  return cached
}

/** 只给测试用：清掉缓存。 */
export function resetServiceInfo(): void {
  cached = undefined
}
