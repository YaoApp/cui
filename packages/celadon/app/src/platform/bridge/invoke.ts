/* **调用宿主的机制**：只有本文件碰宿主对象；命令文件（`ping.ts` 等）只管命令名与形态。 */

import { fail, ok, type BridgeFailure, type BridgeResult } from './result'

type TauriGlobal = {
  core?: { invoke?: (command: string, args?: Record<string, unknown>) => Promise<unknown> }
}

/** 宿主在不在。Tauri 2 挂 `__TAURI_INTERNALS__`；`withGlobalTauri` 时另有 `__TAURI__`。 */
export function hasHost(): boolean {
  const scope = globalThis as { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown }
  return '__TAURI_INTERNALS__' in scope || '__TAURI__' in scope
}

/** 调一条桥命令。**先判宿主存在性**：浏览器里"没有宿主"是常态，不该报成 rejected（那是"宿主拒绝"）。 */
export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<BridgeResult<T>> {
  if (!hasHost()) return fail<T>('unavailable', 'no host bridge in this client')

  const call = (globalThis as { __TAURI__?: TauriGlobal }).__TAURI__?.core?.invoke
  if (!call) return fail<T>('unavailable', 'host is present but exposes no invoke')

  try {
    return ok((await call(command, args)) as T)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const reason: BridgeFailure = /not found|unknown command/i.test(message) ? 'not-running' : 'rejected'
    return fail<T>(reason, message)
  }
}
