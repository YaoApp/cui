/* **客户端信息**（15-platform.md §5.2）：两个宿主**导出字段完全一致**，只有取值来源不同。
 * 上层只读结果，不判宿主、不管来源。 */

import { buildManifest, clientKind, targetOs } from './manifest'
import { clientId } from './client-id'
import { uaInfo, type UaInfo } from './ua'

export type { UaInfo }

export type ClientInfo = {
  client: 'web' | 'desktop'
  /** `macos` · `windows` · `linux` · `unknown`（桌面取清单，Web 解析 UA） */
  os: string
  /** UA 的**结构化**结果（浏览器 · 系统 · 版本）；不散播原始串 */
  ua: UaInfo
  /** UUID v4，同一安装内不变；**不是凭据** */
  client_id: string
  /** 制品内含的 yao 版本；不含则为空 */
  yao_version: string
  /** 制品内含的 tai 版本；不含则为空 */
  tai_version: string
}

/** 组装客户端信息。`client_ip` 由后端在 well-known 里给（见 §3），这里**不带**。 */
export function clientInfo(): ClientInfo {
  const manifest = buildManifest()
  const parsed = uaInfo()
  const kind = clientKind()
  return {
    client: kind,
    // 桌面：打包时写进清单；Web：运行时解析
    os: kind === 'desktop' ? targetOs() || parsed.os : parsed.os,
    ua: parsed,
    client_id: clientId(),
    yao_version: manifest.yao_version ?? '',
    tai_version: manifest.tai_version ?? '',
  }
}

/** 需要"一个客户端标识串"时由这里拼（不照搬 UA 串）。 */
export function clientSignature(): string {
  const info = clientInfo()
  return `${info.client}/${info.os}/${info.ua.browser.name}${info.ua.browser.version ? `-${info.ua.browser.version}` : ''}`
}
