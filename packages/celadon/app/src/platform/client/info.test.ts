import { describe, expect, it } from 'vitest'
import { buildManifest } from './manifest'
import { clientInfo, clientSignature } from './info'

/* 字段与来源按 15-platform.md §5.2：**两个宿主导出同一组字段**。 */
describe('clientInfo', () => {
  it('exports the documented fields', () => {
    const info = clientInfo()
    expect(Object.keys(info).sort()).toEqual(['client', 'client_id', 'os', 'tai_version', 'ua', 'yao_version'])
    expect(info.client).toBe(buildManifest().client)
    expect(['web', 'desktop']).toContain(info.client)
  })

  it('reports the os and the browser as structure, not as a raw string', () => {
    const info = clientInfo()
    expect(typeof info.os).toBe('string')
    expect(info.ua.browser).toHaveProperty('name')
    expect(JSON.stringify(info.ua)).not.toMatch(/Mozilla|AppleWebKit/)
  })

  it('has no client_ip, because the backend gives it', () => {
    expect(clientInfo()).not.toHaveProperty('client_ip')
  })

  it('builds a signature without quoting the user agent', () => {
    expect(clientSignature()).toMatch(/^(web|desktop)\/[^/]+\/[a-z]+/)
  })
})
