import { afterEach, describe, expect, it, vi } from 'vitest'
import { routerBasename } from '@/platform/router/basename'
import { ping } from './ping'

/* 两类宿主都要有用例：Web（没有宿主）与桌面（有宿主，含"命令失败"的路径）。 */

function asDesktop(invoke: (command: string) => Promise<unknown>) {
  vi.stubGlobal('__TAURI_INTERNALS__', {})
  vi.stubGlobal('__TAURI__', { core: { invoke } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ping', () => {
  it('says web and no host when the client is a browser', async () => {
    const info = await ping()
    expect(info.client).toBe('web')
    expect(info.host.available).toBe(false)
    // **同一来源**：命名空间必须与 router 的 basename 一字不差（不许各自读环境）
    expect(info.namespace).toBe(routerBasename())
  })

  it('reports the host version when the desktop answers', async () => {
    asDesktop(async (command) => {
      expect(command).toBe('celadon_host_status')
      return { available: true, version: '0.1.0' }
    })
    const info = await ping()
    expect(info).toMatchObject({ client: 'desktop', host: { available: true, version: '0.1.0' } })
  })

  it('still says desktop but no host when the command fails', async () => {
    asDesktop(async () => {
      throw new Error('command not found')
    })
    const info = await ping()
    expect(info.client).toBe('desktop')
    expect(info.host.available).toBe(false)
  })
})
