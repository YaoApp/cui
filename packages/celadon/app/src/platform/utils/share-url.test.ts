import { describe, expect, it } from 'vitest'
import { buildShareUrl } from '@/platform/utils/share-url'

/* 分享链接只有这一处生成 —— 手拼 URL 是这套东西烂掉的开始。 */
describe('buildShareUrl', () => {
  it('defaults to the main surface', () => {
    expect(buildShareUrl({ feature: 'world' })).toBe('/app/world')
  })

  it('puts an object into the path and panel state into the query', () => {
    expect(buildShareUrl({ surface: 'side', feature: 'world', object: 'w1' }, { sideEntity: 'e2' })).toBe(
      '/side/world/w1?sideEntity=e2',
    )
  })

  it('drops defaults instead of writing them down', () => {
    expect(buildShareUrl({ feature: 'world', object: 'w1' }, { q: '', sideEntity: undefined })).toBe('/app/world/w1')
  })

  it('takes an origin when the link leaves the app', () => {
    expect(buildShareUrl({ feature: 'world' }, {}, 'https://cui.example.com')).toBe('https://cui.example.com/app/world')
  })
})
