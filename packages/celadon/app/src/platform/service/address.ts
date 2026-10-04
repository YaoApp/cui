/* **服务地址的读写面孔**（`15 §4.2`）：命令名与宿主调用留在 `bridge/`，上层只说"读 / 写地址"。 */

import { fail, type BridgeResult } from '../bridge/result'
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
 *  新地址的会话**在这里**读 —— 但必须等新基址回来之后再读（否则凭据键算不出来，读到的是空）。 */
export async function writeServiceAddress(url: string): Promise<BridgeResult<string>> {
  const result = await service.set(url)
  if (!result.ok) return result
  resetServiceBase()
  resetServiceInfo()
  resetSession()
  // 先让宿主的**新基址**回来（凭据键靠它），再读新地址名下的会话；否则读到的是空
  const base = await loadServiceBase()
  // 读回来是空 = 新地址其实没接上：如实报错，别让后面的请求去打相对路径
  if (!base) return fail('service.unreachable', 'the service base could not be read back', {})
  await loadSession()
  return { ok: true, value: result.value.url }
}
