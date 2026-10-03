/* `client_id`（15-platform.md §5.2）：**UUID v4**，首次需要时生成后存**本地存储**。
 *
 * · **两个宿主都是 webview 存储，同一套代码**；同一安装内不变，清数据/换安装即更换
 * · **它不是凭据**，不进系统凭据库（见 §4.5） */

const STORAGE_KEY = 'celadon.client_id'

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    // 隐私模式等场景下访问会抛，按"没有存储"处理（每次生成，不报错）
    return undefined
  }
}

/** 取 `client_id`；没有就生成并存起来。 */
export function clientId(): string {
  const store = storage()
  const existing = store?.getItem(STORAGE_KEY)
  if (existing) return existing

  const id = globalThis.crypto.randomUUID()
  store?.setItem(STORAGE_KEY, id)
  return id
}
