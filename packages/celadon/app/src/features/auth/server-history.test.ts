import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findServer, readServers, rememberServer } from './server-history'

describe('the servers this machine has connected to', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keeps the newest first and moves a repeated address to the front', () => {
    rememberServer('https://a.example.com', 'A', 1)
    rememberServer('https://b.example.com', undefined, 2)

    expect(readServers().map((entry) => entry.url)).toEqual(['https://b.example.com', 'https://a.example.com'])

    rememberServer('https://a.example.com/', 'A again', 3)
    const servers = readServers()
    expect(servers.map((entry) => entry.url)).toEqual(['https://a.example.com', 'https://b.example.com'])
    expect(servers[0]).toEqual({ url: 'https://a.example.com', label: 'A again', lastConnected: 3 })
  })

  it('keeps only the newest few', () => {
    for (let index = 0; index < 12; index += 1) rememberServer(`https://s${index}.example.com`, undefined, index)
    expect(readServers()).toHaveLength(8)
    expect(readServers()[0].url).toBe('https://s11.example.com')
  })

  it('ignores an empty address and keeps going when the storage refuses to write', () => {
    rememberServer('   ')
    expect(readServers()).toEqual([])

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => rememberServer('https://a.example.com')).not.toThrow()
    setItem.mockRestore()
  })

  it('shows nothing for broken data instead of throwing', () => {
    localStorage.setItem('celadon.servers', 'not json')
    expect(readServers()).toEqual([])

    localStorage.setItem('celadon.servers', JSON.stringify([{ url: '' }, { url: 'https://ok.example.com' }, 42]))
    expect(readServers().map((entry) => entry.url)).toEqual([])
  })

  it('finds a server by address, tolerating the trailing slash', () => {
    rememberServer('https://a.example.com/', 'A', 1)
    expect(findServer('https://a.example.com')?.label).toBe('A')
    expect(findServer('  ')).toBeUndefined()
    expect(findServer('https://nope.example.com')).toBeUndefined()
  })

  it('keeps the name recorded at connect when a later write only knows the address', () => {
    rememberServer('https://a.example.com', '官方亚太', 1)
    /* 登录收尾只知道地址：不能把连接时记下的显示名抹掉 */
    rememberServer('https://a.example.com', undefined, 2)
    expect(findServer('https://a.example.com')).toEqual({ url: 'https://a.example.com', label: '官方亚太', lastConnected: 2 })
  })
})
