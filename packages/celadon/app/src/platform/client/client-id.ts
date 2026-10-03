/* `client_id`（15-platform.md §5.2）：**带来源前缀的稳定标识**。
 *
 * 形如 `web-<随机>` / `desk-<机器码>`：
 *   · **前缀说明来源**（`web` / `desk`），一眼看出这串是哪来的
 *   · **Web**：首次需要时生成随机值，存本地存储（同一安装内不变）
 *   · **Desktop**：用宿主的**真机器码**（`celadon_system_machine_id`）—— 同一台机器稳定
 *   · **它不是凭据**，不进系统凭据库
 *
 * **安全上下文**：`crypto.randomUUID` **只在安全上下文（https / localhost）可用**；
 * 局域网直连 `http://192.168.x.x` 时它是 undefined（实测炸过整页白屏）。所以随机值走
 * `crypto.getRandomValues`（非安全上下文也有），并做降级。 */

import { bridge } from '../bridge'
import { clientKind } from './manifest'

const STORAGE_KEY = 'celadon.client_id'
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

let primed: string | undefined

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

/** 随机段：**不依赖 `crypto.randomUUID`**（非安全上下文里没有它）。 */
export function randomId(size = 16): string {
  const cryptoScope = globalThis.crypto as { getRandomValues?: (array: Uint8Array) => Uint8Array } | undefined
  const bytes = new Uint8Array(size)
  if (typeof cryptoScope?.getRandomValues === 'function') {
    cryptoScope.getRandomValues(bytes)
  } else {
    // 最后兜底：没有 WebCrypto 也要能出 id（弱随机，仅用于标识，不是凭据）
    for (let i = 0; i < size; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
}

function prefix(): string {
  return clientKind() === 'desktop' ? 'desk' : 'web'
}

/** 生成一个全新 id（**带来源前缀**）。 */
export function newClientId(): string {
  return `${prefix()}-${randomId()}`
}

/** 取 `client_id`：内存 → 本地存储 → 新建。 */
export function clientId(): string {
  if (primed) return primed
  const store = storage()
  const existing = store?.getItem(STORAGE_KEY)
  if (existing) return existing

  const id = newClientId()
  store?.setItem(STORAGE_KEY, id)
  return id
}

/** **桌面端**：拿宿主的真机器码，换掉随机段（同一台机器稳定）。
 *  在启动时调一次即可；拿不到就保持随机值，不报错。 */
export async function primeClientId(): Promise<string> {
  const id = clientId()
  if (clientKind() !== 'desktop') return id
  // 已经是机器码（重启后读到的）就不必再问
  const store = storage()
  const fromMachine = store?.getItem(`${STORAGE_KEY}.machine`)
  if (fromMachine && id === fromMachine) return id

  const result = await bridge.system.machineId()
  if (!result.ok || !result.value) return id
  const machine = `${prefix()}-${result.value}`
  primed = machine
  store?.setItem(STORAGE_KEY, machine)
  store?.setItem(`${STORAGE_KEY}.machine`, machine)
  return machine
}
