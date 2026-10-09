/* 宿主在、但插件取不回来时的那条路：出口要把失败当成值回上去，而不是把异常抛给调用方。
   这个用例单独一个文件，因为模块的 mock 是按文件生效的（这里让插件模块直接取不回来）。 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tauri-apps/plugin-http', () => {
  throw new Error('plugin missing')
})

import { transportFetch } from './fetch'

describe('the egress when the host plugin cannot be loaded', () => {
  it('reports a network failure with the url instead of throwing', async () => {
    vi.stubGlobal('__TAURI_INTERNALS__', {})
    vi.stubGlobal('__TAURI__', {})
    const result = await transportFetch('https://example.com/things')
    vi.unstubAllGlobals()

    expect(result).toMatchObject({ ok: false, code: 'transport.network', params: { url: 'https://example.com/things' } })
  })
})
