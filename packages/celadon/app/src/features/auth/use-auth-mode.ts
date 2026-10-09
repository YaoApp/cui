import { useLocation } from 'react-router'
import { client } from '@/platform/client'
import type { AuthMode } from './components/auth-layout'

export type { AuthMode }

/**
 * 入口页的形态。
 *
 * 客户端内（有宿主、服务地址由用户选）**一律**是 `in-app`：桌面用户不该看到 Web 的品牌区与页脚，
 * 地址上没有 `from` 也一样。Web 只在地址带 `from` 时才是 `in-app`，这是原型 `?from=connect`
 * 给出的预览入口，浏览器用例也用它。
 */
export function useAuthMode(): AuthMode {
  const search = useLocation().search
  return client.capabilities.serviceAddress || new URLSearchParams(search).has('from') ? 'in-app' : 'standalone'
}

/** 形态跟着链接走：`in-app` 时把 `from` 带上，跳过去仍然是客户端内形态（与原型一致）。 */
export function withMode(path: string, mode: AuthMode): string {
  if (mode !== 'in-app') return path
  return `${path}${path.includes('?') ? '&' : '?'}from=connect`
}
