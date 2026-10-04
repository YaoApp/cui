/* **服务地址的读写面孔**（`15 §4.2`）：命令名与宿主调用留在 `bridge/`，上层只说"读 / 写地址"。 */

import type { BridgeResult } from '../bridge/result'
import { service } from '../bridge/service'
import { loadSession, resetSession } from '../credential/session'
import { loadServiceBase, resetServiceBase } from './base'
import { resetServiceInfo } from './info'

/** 读宿主当前持有的服务地址（没选过就是空串）。 */
export async function readServiceAddress(): Promise<BridgeResult<string>> {
  const result = await service.get()
  return result.ok ? { ok: true, value: result.value.url } : result
}

/** 校验并写入服务地址（宿主先取 `/.well-known/yao` 校验，通过才落盘）。
 *
 *  **换地址就是换服务**：写成功后把这一层与凭据层的缓存全部作废（旧基址 · 旧服务文档 · 旧会话镜像），
 *  新地址的会话不在这里读 —— 基址要先从宿主取回（出口发请求前惰性补读），这里读只会拿到空。 */
export async function writeServiceAddress(url: string): Promise<BridgeResult<string>> {
  const result = await service.set(url)
  if (!result.ok) return result
  resetServiceBase()
  resetServiceInfo()
  resetSession()
  // 先让宿主的**新基址**回来（凭据键靠它），再读新地址名下的会话；否则读到的是空
  await loadServiceBase()
  await loadSession()
  return { ok: true, value: result.value.url }
}
