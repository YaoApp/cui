import { describe, expect, it } from 'vitest'
import { accountLinks } from './links'

describe('the account links', () => {
  it('keeps the product and help sites shared across languages', () => {
    const zh = accountLinks('zh-CN')
    const en = accountLinks('en-US')
    expect(zh.home).toBe('https://yaoagents.com')
    expect(zh.help).toBe('https://yaoagents.com/docs')
    expect(en.home).toBe(zh.home)
    expect(en.help).toBe(zh.help)
  })

  it('routes Chinese readers to the Chinese docs and everyone else to English', () => {
    expect(accountLinks('zh-CN').docs).toContain('/docs/zh-cn/')
    expect(accountLinks('zh-TW').docs).toContain('/docs/zh-cn/')
    expect(accountLinks('en-US').docs).toContain('/docs/en-us/')
    expect(accountLinks('ja').docs).toContain('/docs/en-us/')
  })
})
