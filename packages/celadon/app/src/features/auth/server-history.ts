/* **本机记过的服务器**：登录成功之后记一条，服务器选择页用它预选与回填。
 *
 * 只存在本机（`localStorage`），不是凭据；凭据按服务地址的 origin 分账，换地址不删账。
 * 读不出（隐私模式、配额满、坏数据）就当没有，不影响选服务器。 */

export type ServerRecord = {
  url: string
  /** 显示名；来自清单或调用方，没有就按地址显示。 */
  label?: string
  /** 最后一次连上（Unix 毫秒）。 */
  lastConnected: number
}

const STORAGE_KEY = 'celadon.servers'
/* 只留最近几条：这是回填与预选用的，不是完整历史 */
const LIMIT = 8

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

/** 地址按去尾斜杠归一，避免同一个服务记成两条。 */
function normalize(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function isRecord(value: unknown): value is ServerRecord {
  if (typeof value !== 'object' || value === null) return false
  const bag = value as Record<string, unknown>
  return typeof bag.url === 'string' && normalize(bag.url) !== '' && typeof bag.lastConnected === 'number'
}

/** 最近连过的服务器，新的在前。 */
export function readServers(): ServerRecord[] {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(isRecord)
      .map((entry) => ({ ...entry, url: normalize(entry.url) }))
      .sort((left, right) => right.lastConnected - left.lastConnected)
      .slice(0, LIMIT)
  } catch {
    return []
  }
}

/** 按地址找一条（地址已在写入时归一）。 */
export function findServer(url: string): ServerRecord | undefined {
  const normalized = normalize(url)
  if (!normalized) return undefined
  return readServers().find((entry) => entry.url === normalized)
}

/** 记一条：同一个地址只留最新的一条，并挪到最前。
 *  **不给名字时保留原有的名字** —— 登录收尾只知道地址，不能把连接时记下的显示名抹掉。 */
export function rememberServer(url: string, label?: string, at = Date.now()): void {
  const normalized = normalize(url)
  if (!normalized) return
  const servers = readServers()
  const previous = servers.find((entry) => entry.url === normalized)
  const name = label ?? previous?.label
  const rest = servers.filter((entry) => entry.url !== normalized)
  const next: ServerRecord[] = [{ url: normalized, ...(name ? { label: name } : {}), lastConnected: at }, ...rest].slice(0, LIMIT)
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* 记不住不算错：页面只是少了预选 */
  }
}
