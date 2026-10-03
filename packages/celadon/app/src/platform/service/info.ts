/* **服务信息**（`architecture/15-platform.md` §3）：**第一次需要时读一次** `GET /.well-known/yao`，结果进缓存。
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
  // **不许是协议相对地址**（`//evil.example/x` 会被当跨域前缀）；必须是本站根下的路径段
  // 只认"本站根下的普通路径段"：**拒绝**协议相对（`//evil`）与**反斜杠**（`/\evil` 规范化后会被当主机）
  if (typeof openapi !== 'string' || !/^\/[A-Za-z0-9._~-]/.test(openapi)) {
    return fail('service.malformed', 'service info has no openapi root', { openapi: String(openapi) })
  }
  return ok({
    name: typeof value.name === 'string' ? value.name : '',
    version: typeof value.version === 'string' ? value.version : '',
    openapi,
  })
}

let cached: ServiceInfo | undefined
let inFlight: Promise<BridgeResult<ServiceInfo>> | undefined

/** 读一次并缓存（再有调用直接用缓存；**并发也只发一次** —— 否则 StrictMode 会打两次）。 */
export function loadServiceInfo(timeoutMs?: number): Promise<BridgeResult<ServiceInfo>> {
  if (cached) return Promise.resolve(ok(cached))
  inFlight ??= readServiceInfo(timeoutMs).finally(() => {
    inFlight = undefined
  })
  return inFlight
}

async function readServiceInfo(timeoutMs?: number): Promise<BridgeResult<ServiceInfo>> {
  // **超时由调用方给**（17 §2.2：出口不替业务方定数字）
  const response = await transportFetch(serviceUrl('/.well-known/yao'), timeoutMs === undefined ? {} : { timeoutMs })
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
