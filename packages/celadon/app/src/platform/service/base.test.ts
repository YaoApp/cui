import { afterEach, describe, expect, it, vi } from 'vitest'
import { serviceBase, serviceUrl } from './base'
import { routerBasename } from '../router/basename'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('serviceBase', () => {
  it('has no base by default, so paths stay relative', () => {
    expect(serviceBase()).toBe('')
    // 同源：路径带上**应用自己的命名空间**（dev 是 /app，客户端构建是空）——不写死，跟 basename 对齐
    expect(serviceUrl('/api/things')).toBe(`${routerBasename()}/api/things`)
    expect(serviceUrl('api/things')).toBe(`${routerBasename()}/api/things`)
  })

  it('takes the base from the build, and trims the trailing slash', () => {
    vi.stubEnv('VITE_SERVICE_BASE', 'https://service.example.com/')
    expect(serviceBase()).toBe('https://service.example.com')
    expect(serviceUrl('/api/things')).toBe('https://service.example.com/api/things')
  })
})
