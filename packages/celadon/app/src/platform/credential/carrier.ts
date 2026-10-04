/* **凭据载体按宿主选**（`architecture/15-platform.md` §4）：
 *   · Web → **服务端下发的 HttpOnly Cookie**（浏览器存与带，**JS 不碰**）
 *   · Desktop → **OS 凭据库**里的 token（经 `bridge/`）
 * 上层只调 `credential` 这一套，**不判宿主**。 */

import { client } from '../client'

export type CredentialCarrier = 'cookie' | 'os-store'

export function credentialCarrier(): CredentialCarrier {
  return client.kind === 'desktop' ? 'os-store' : 'cookie'
}

/** 这个载体**能不能由应用直接读写**。
 *  Cookie 的答案是不能 —— 那不是缺陷，是它存在的意义（XSS 也偷不到）。 */
export function carrierIsReadableByApp(carrier: CredentialCarrier): boolean {
  return carrier === 'os-store'
}
