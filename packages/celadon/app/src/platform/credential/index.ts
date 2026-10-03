/* **凭据的存取与消费**（`15-platform.md` §4）—— 一套接口，载体按宿主选（见 `carrier.ts`）。
 *
 * 现在做得到的：**桌面**直接管 OS 凭据库（经 `bridge/credential`）；**Web** 的载体由浏览器与服务端管，
 * 所以读写一律回**可读的失败**（`credential.no_store_here`），而不是假装成功或抛异常。
 *
 * **还没做的**（等**服务接口**，不是平台层的事）：登入/登出/查会话（`POST …/login/web` 等）· 刷新定时 ·
 * 两步登录 · 由凭据推出的当前身份。接口形状定了再加，别在这儿发明假接口。
 */

import { fail, type BridgeResult } from '../bridge/result'
import { bridge, type CredentialMeta } from '../bridge'
import { carrierIsReadableByApp, credentialCarrier } from './carrier'

export { credentialCarrier, carrierIsReadableByApp, type CredentialCarrier } from './carrier'

/** 载体不由应用保管时的统一回答（Web 的 Cookie 走这一支）。 */
function noStoreHere(action: string): BridgeResult<never> {
  return fail(
    'credential.no_store_here',
    `the ${credentialCarrier()} carrier is not the application's to ${action}`,
    { carrier: credentialCarrier() },
  )
}

export const credential = {
  /** 这台客户端用哪种载体。 */
  carrier: credentialCarrier,

  /** 应用能不能直接读写载体（Web = 不能）。 */
  managedByApp: (): boolean => carrierIsReadableByApp(credentialCarrier()),

  /** 读一条凭据的秘密。**秘密只在宿主侧流转**，Web 上不存在这个动作。 */
  read: (service: string): Promise<BridgeResult<string>> =>
    credentialCarrier() === 'os-store' ? bridge.credential.read(service) : Promise.resolve(noStoreHere('read')),

  /** 写一条凭据。 */
  write: (service: string, secret: string): Promise<BridgeResult<boolean>> =>
    credentialCarrier() === 'os-store' ? bridge.credential.write(service, secret) : Promise.resolve(noStoreHere('write')),

  /** 删一条凭据。 */
  remove: (service: string): Promise<BridgeResult<boolean>> =>
    credentialCarrier() === 'os-store' ? bridge.credential.remove(service) : Promise.resolve(noStoreHere('remove')),

  /** 列出**有东西**的凭据（元信息，不含秘密）。 */
  list: (): Promise<BridgeResult<CredentialMeta[]>> =>
    credentialCarrier() === 'os-store' ? bridge.credential.list() : Promise.resolve(noStoreHere('list')),
}
