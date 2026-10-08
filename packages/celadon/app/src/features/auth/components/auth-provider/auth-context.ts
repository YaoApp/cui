import { createContext, useContext } from 'react'
import type { EntryConfig } from '@/data/user'

/**
 * 服务端数据：入口配置与验 ID Token 用的公钥集。
 *
 * 按 `architecture/06-state.md` §1，服务端数据的缓存与流不进 store，因此这里不做状态管理，
 * 只做**提升共享**：登录与注册都要用同一份配置，由 `AuthProvider` 用数据层钩子取一次，向下提供。
 */
export type AuthConfigValue = {
  /** 入口配置；取回前是 `undefined`，页面据此给加载态。 */
  config?: EntryConfig
  /** 验签公钥集；取回前是 `undefined`。 */
  keys?: JsonWebKey[]
  /** 入口配置取失败：页面据此给失败态，而不是一直停在加载态。 */
  configFailed: boolean
}

export const AuthConfigContext = createContext<AuthConfigValue | undefined>(undefined)

/** 取提升共享的服务端数据；不在 `AuthProvider` 里调用会直接报错，避免静默拿到空值。 */
export function useAuthConfig(): AuthConfigValue {
  const value = useContext(AuthConfigContext)
  if (!value) throw new Error('useAuthConfig must be called inside AuthProvider')
  return value
}
