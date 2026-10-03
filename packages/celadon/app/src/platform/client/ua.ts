/* UA 解析（15-platform.md §5.2）：**只在 `client/` 读一次** `navigator.userAgent`，
   对上层**给结构化结果，不散播原始串**（UA 格式是为历史兼容冻结的）。 */

export type BrowserInfo = {
  /** `chrome` · `safari` · `firefox` · `edge` · `unknown` */
  name: string
  /** 主版本号，解析不出就是空串 */
  version: string
}

export type UaInfo = {
  browser: BrowserInfo
  /** `macos` · `windows` · `linux` · `ios` · `android` · `unknown` */
  os: string
}

/** 解析一段 UA 串（纯函数，便于用例直接喂样本）。 */
export function parseUserAgent(ua: string): UaInfo {
  const os = /Windows/i.test(ua)
    ? 'windows'
    : /Mac OS X|Macintosh/i.test(ua)
      ? 'macos'
      : /Android/i.test(ua)
        ? 'android'
        : /iPhone|iPad|iPod/i.test(ua)
          ? 'ios'
          : /Linux|X11/i.test(ua)
            ? 'linux'
            : 'unknown'

  // 顺序有意：Edge 与 Chrome 都带 Safari 段，先认更具体的
  const browser: BrowserInfo =
    (() => {
      const edge = ua.match(/Edg\/([\d.]+)/)
      if (edge) return { name: 'edge', version: edge[1]?.split('.')[0] ?? '' }
      const chrome = ua.match(/Chrome\/([\d.]+)/)
      if (chrome) return { name: 'chrome', version: chrome[1]?.split('.')[0] ?? '' }
      const firefox = ua.match(/Firefox\/([\d.]+)/)
      if (firefox) return { name: 'firefox', version: firefox[1]?.split('.')[0] ?? '' }
      const safari = ua.match(/Version\/([\d.]+).*Safari/)
      if (safari) return { name: 'safari', version: safari[1]?.split('.')[0] ?? '' }
      // WebKit 引擎（含 Tauri 的 WKWebView）：UA 里**可能连 `Safari` 都没有**，
      // 形如 `… AppleWebKit/605.1.15 (KHTML, like Gecko)` —— 只认引擎，别再要求 Safari 段。
      if (/AppleWebKit/.test(ua)) return { name: 'safari', version: '' }
      return { name: 'unknown', version: '' }
    })()

  return { browser, os }
}

/** 读一次当前环境。**只在这里读 `navigator`。** */
export function uaInfo(): UaInfo {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  return parseUserAgent(ua)
}
