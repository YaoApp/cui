/* **服务地址的读写面孔**（`15 §4.2`）：命令名与宿主调用留在 `bridge/`，上层只说"读 / 写地址"。 */

import type { BridgeResult } from '../bridge/result'
import { service } from '../bridge/service'

/** 读宿主当前持有的服务地址（没选过就是空串）。 */
export async function readServiceAddress(): Promise<BridgeResult<string>> {
  const result = await service.get()
  return result.ok ? { ok: true, value: result.value.url } : result
}

/** 校验并写入服务地址（宿主先取 `/.well-known/yao` 校验，通过才落盘）。 */
export async function writeServiceAddress(url: string): Promise<BridgeResult<string>> {
  const result = await service.set(url)
  return result.ok ? { ok: true, value: result.value.url } : result
}
