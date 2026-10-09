/* **云站点（Yao Cloud）**：官方服务器清单，给服务器选择页用。
 *
 * 引擎接口走 `data/`，这条路不是引擎：门户与引擎基址无关，因此放在平台层，
 * 由出口 `transportFetch` 直发绝对地址（桌面走宿主代发，浏览器受同源限制被出口拒绝）。
 * 门户接口按 1.0 的实现：`POST {portal}/v1/__yao/sui/v1/run/servers`，体 `{ method: 'ServerList', args: [locale] }`。 */

import { fail, ok, type BridgeResult } from '@/platform/bridge/result'
import { transportFetchOk } from '@/platform/transport/fetch'

export type CloudServer = {
  url: string
  name: string
  slug: string
  region?: string
  status?: string
}

const RUN_PATH = '/v1/__yao/sui/v1/run/servers'

/** 门户基址按界面语言取：简繁中文走 `.cn`，其余走 `.com`。 */
export function portalBase(locale: string): string {
  return locale === 'zh-CN' || locale === 'zh-TW' ? 'https://yaoagents.cn' : 'https://yaoagents.com'
}

function pick(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** 门户回的数组形状不保证：只认有 `url` 的条目，名字退到 `slug`，再退到地址。 */
export function shapeCloudServers(raw: unknown): CloudServer[] {
  if (!Array.isArray(raw)) return []
  const servers: CloudServer[] = []
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue
    const bag = entry as Record<string, unknown>
    const url = pick(bag.url)
    if (!url) continue
    servers.push({
      url,
      name: pick(bag.name) ?? pick(bag.slug) ?? url,
      slug: pick(bag.slug) ?? '',
      region: pick(bag.region),
      status: pick(bag.status),
    })
  }
  return servers
}

/** 取官方服务器清单；基址可换，供用例注入。 */
export async function loadCloudServers(
  locale: string,
  base: string = portalBase(locale),
): Promise<BridgeResult<CloudServer[]>> {
  const result = await transportFetchOk(`${base.replace(/\/+$/, '')}${RUN_PATH}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method: 'ServerList', args: [locale] }),
    timeoutMs: 15_000,
  })
  if (!result.ok) return result
  try {
    return ok(shapeCloudServers(await result.value.json()))
  } catch (error) {
    return fail('transport.parse', error instanceof Error ? error.message : String(error), {})
  }
}
