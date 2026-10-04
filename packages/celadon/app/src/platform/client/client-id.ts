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

/** 读本地存储：取不到就当没有（隐私模式下 getItem 也会被拒）。 */
function recall(key: string): string | undefined {
  try {
    return storage()?.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

/** 写本地存储：**失败不算错**（隐私模式 / 配额满），身份退化成"本次会话内有效"。 */
function remember(key: string, value: string): void {
  try {
    storage()?.setItem(key, value)
  } catch {
    /* 忽略：id 不是凭据，写不进去不该让应用起不来 */
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
  const existing = recall(STORAGE_KEY)
  if (existing) {
    primed = existing // 没有存储时也让 id 在本次会话里稳定
    return existing
  }

  const id = newClientId()
  primed = id // 写不进去（隐私模式 / 配额满）也要在本次会话里稳定
  remember(STORAGE_KEY, id)
  return id
}

/** **装填内部用**：把宿主的真机器码换成 `client_id`（同一台机器稳定）。
 *  宿主答不上来由调用方（`facts.ts` 的装填）负责报错，这里不兜底。 */
export function adoptMachineId(machine: string): string {
  const id = `${prefix()}-${machine}`
  primed = id
  remember(STORAGE_KEY, id)
  remember(`${STORAGE_KEY}.machine`, id)
  return id
}

/** 桌面重启后读到的就是机器码时，省掉一次宿主往返。 */
export function storedMachineId(): string | undefined {
  return recall(`${STORAGE_KEY}.machine`)
}
