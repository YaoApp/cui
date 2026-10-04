import { describe, expect, it, vi } from 'vitest'

/* 测试环境里 BASE_URL 是 /；把 basename 注成 /app，才能验出**分享链接带了段**。 */
vi.mock('@/platform/router/basename', () => ({ routerBasename: () => '/app' }))
import { buildShareUrl } from '@/platform/utils/share-url'

/* 分享链接只有这一处生成 —— 手拼 URL 是这套东西烂掉的开始。 */
describe('buildShareUrl', () => {
  it('puts the app segment in front of the path', () => {
    expect(buildShareUrl({ feature: 'scaffold/routing' })).toBe('/app/scaffold/routing')
  })

  it('puts an object into the path', () => {
    expect(buildShareUrl({ feature: 'scaffold/routing', object: 'w1' })).toBe('/app/scaffold/routing/w1')
  })

  it('carries real parameters into the query', () => {
    expect(buildShareUrl({ feature: 'scaffold/routing', object: 'w1' }, { q: 'alpha' })).toBe('/app/scaffold/routing/w1?q=alpha')
  })

  it('drops defaults instead of writing them down', () => {
    expect(buildShareUrl({ feature: 'scaffold/routing', object: 'w1' }, { q: '', empty: undefined })).toBe('/app/scaffold/routing/w1')
  })

  it('takes an origin when the link leaves the app', () => {
    expect(buildShareUrl({ feature: 'scaffold/routing' }, {}, 'https://cui.example.com')).toBe('https://cui.example.com/app/scaffold/routing')
  })
})
