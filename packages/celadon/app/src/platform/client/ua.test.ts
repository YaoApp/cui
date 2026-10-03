import { describe, expect, it } from 'vitest'
import { parseUserAgent } from './ua'

/* UA 只在 `client/` 读一次；**给结构化结果**，所以用例直接喂原始串验解析。 */
const CASES: [string, string, string][] = [
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 'chrome', 'macos'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'edge', 'windows'],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0', 'firefox', 'macos'],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', 'safari', 'macos'],
  ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 'chrome', 'linux'],
]

describe('parseUserAgent', () => {
  for (const [ua, browser, os] of CASES) {
    it(`reads ${browser} on ${os}`, () => {
      const info = parseUserAgent(ua)
      expect(info.browser.name).toBe(browser)
      expect(info.browser.version).not.toBe('')
      expect(info.os).toBe(os)
    })
  }

  it('reads the desktop webview, whose user agent has no Safari token', () => {
    // 真机实测的形态（Tauri 的 WKWebView）：只有 AppleWebKit，没有 Safari
    const info = parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)')
    expect(info.browser.name).toBe('safari')
    expect(info.os).toBe('macos')
  })

  it('says unknown rather than guessing', () => {
    expect(parseUserAgent('')).toEqual({ browser: { name: 'unknown', version: '' }, os: 'unknown' })
  })

  it('does not mistake Edge for Chrome', () => {
    const edge = CASES[1]![0]
    expect(parseUserAgent(edge).browser.name).toBe('edge')
  })
})
