/* **客户端事实**：一处装填，其余直接用（`15-platform.md` §5）。
 *
 * 异步只在 `loadClient()` 那一次：解析清单 · 探测能力（一次）· 问一次桥（宿主就绪与版本）· 取 `client_id`
 * （本地值 → 宿主机器码）。装填之后 `client.x` 都是**同步直接读**。
 *
 * **失败即不可继续**：桌面下宿主答不上来（桥不可用 · 命令失败 · 超时）→ 抛 `ClientBootError`，
 * 入口据此转向错误页；**不拿本地随机值兜底** —— 随机值只在 Web 是正确身份。
 *
 * **模块顶层不许读 `client`**：import 求值是先于入口那句 `await loadClient()` 的。 */

import { hasHost } from '../bridge/invoke'
import { ping } from '../bridge/ping'
import type { BridgeResult } from '../bridge/result'
import { system } from '../bridge/system'
import { capabilities, type Capabilities } from './capabilities'
import { adoptMachineId, clientId, storedMachineId } from './client-id'
import { currentPreferences, metadata, type Preferences, type RequestMetadata } from './context'
import { clientInfo, clientSignature, type ClientInfo } from './info'
import { buildManifest, targetOs, type ClientKind, type Manifest, type TargetOs } from './manifest'
import { uaInfo, type UaInfo } from './ua'

/** 装填超时（毫秒）：宿主是本机进程，正常在毫秒级；卡住就是它坏了。 */
const FILL_TIMEOUT_MS = 10_000

/** 装填失败。带可翻译的码，入口按码给文案并给"重试"。 */
export class ClientBootError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'ClientBootError'
  }
}

export type Client = {
  /** 客户端类型（构建清单里的 `client`）：'web' | 'desktop' */
  kind: ClientKind
  /** 构建目标系统 */
  os: TargetOs
  /** 构建清单原文 */
  manifest: Manifest
  /** 能力开关：剪贴板 · 文件 · 通知 · 外开 · 自己持服务地址 */
  capabilities: Capabilities
  /** 客户端与宿主版本（`client_id` 取装填后的值）*/
  info: ClientInfo
  /** 请求签名（UA 派生）*/
  signature: string
  /** `web-<随机>` / `desk-<机器码>`；装填时定下，之后不变 */
  id: string
  /** 宿主：就绪与版本（装填时问一次桥）。Web 恒为 `{ ready: false, version: '' }` */
  host: { ready: boolean; version: string }
  /** **动态读数**（不是事实）：当前偏好，随用户改 */
  readonly preferences: Preferences
  /** **动态读数**：一次请求的元数据，由当前偏好算出 */
  readonly metadata: RequestMetadata
}

const KNOWN_OS = new Set<TargetOs>(['macos', 'windows', 'linux'])
const narrowOs = (value: string): TargetOs => (KNOWN_OS.has(value as TargetOs) ? (value as TargetOs) : '')

const manifest = buildManifest()
const kind: ClientKind = manifest.client
const ua: UaInfo = uaInfo()
// 桌面取打包写下的目标系统；Web 解析 UA（认不出就是空）
const os: TargetOs = kind === 'desktop' ? targetOs() || narrowOs(ua.os) : narrowOs(ua.os)

/** 客户端事实。**装填前不要读**（入口 `await loadClient()` 之后才是最终值）。 */
export const client: Client = {
  kind,
  os,
  manifest,
  capabilities: {
    clipboard: false,
    files: false,
    notifications: false,
    externalOpen: false,
    serviceAddress: false,
  },
  info: clientInfo(),
  signature: '',
  id: clientId(),
  host: { ready: false, version: '' },
  get preferences(): Preferences {
    return currentPreferences()
  },
  get metadata(): RequestMetadata {
    return metadata(currentPreferences())
  },
}

let filling: Promise<Client> | undefined

/** 装填一次（幂等）：清单 · 能力 · 宿主（ping 一次）· `client_id`。启动时 `await`。 */
export function loadClient(): Promise<Client> {
  filling ??= fill()
  return filling
}

async function fill(): Promise<Client> {
  client.capabilities = capabilities()
  if (kind === 'desktop') {
    // 桌面：宿主是底座，问不到就是不可继续
    if (!hasHost()) throw new ClientBootError('client.host_unavailable')
    const asked = await within(ping())
    if (!asked.ok || !asked.value.available) throw new ClientBootError('client.host_unavailable')
    client.host = { ready: true, version: asked.value.version }
    if (!storedMachineId()) {
      const machine = await within(system.machineId())
      if (!machine.ok || !machine.value) throw new ClientBootError('client.machine_id_unavailable')
      adoptMachineId(machine.value)
    }
  }
  client.id = clientId()
  client.info = clientInfo()
  client.signature = clientSignature()
  return client
}

/** 给它一个上限：超过就按"宿主坏了"处理（`client.host_timeout`）。 */
async function within<T>(call: Promise<BridgeResult<T>>): Promise<BridgeResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      call,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ClientBootError('client.host_timeout')), FILL_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}
