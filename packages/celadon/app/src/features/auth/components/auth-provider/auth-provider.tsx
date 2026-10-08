import { useMemo, type ReactNode } from 'react'
import { useRequest } from '@/data'
import { entryConfigQuery, oidcKeysQuery } from '@/data/user'
import { useLocaleStore } from '@/platform/i18n/locale.store'
import { AuthConfigContext, type AuthConfigValue } from './auth-context'

export type AuthProviderProps = { children: ReactNode }

/**
 * 登录域的服务端数据：入口配置与验签公钥集。
 *
 * 取数走数据层钩子（`architecture/05-data-and-api.md`），这里只把结果**提升共享**给登录与注册两个页面，
 * 不做缓存也不做状态管理。域自己的状态在 `features/auth/auth.store.ts`，
 * 成功之后的收尾（验签、采纳会话、跳转）在 `features/auth/use-complete-sign-in.ts`。
 *
 * **订阅当前语言**：入口配置是**按语言**给的（同一份接口，不同语言返回不同的验证码形态与占位文字），
 * 因此读接口的 key 里带语言段。key 在渲染时算出来，所以这里必须真的订阅语言 ——
 * 否则切语言时本组件不重渲染，key 不变，配置就不会重取。
 */
export function AuthProvider({ children }: AuthProviderProps) {
  useLocaleStore((state) => state.locale)
  const configCall = useRequest(entryConfigQuery())
  const keysCall = useRequest(oidcKeysQuery())

  const config = configCall.state.status === 'ok' ? configCall.state.value : undefined
  const keys = keysCall.state.status === 'ok' ? keysCall.state.value.keys : undefined
  const configFailed = configCall.state.status === 'error'

  const value = useMemo<AuthConfigValue>(() => ({ config, keys, configFailed }), [config, keys, configFailed])

  return <AuthConfigContext.Provider value={value}>{children}</AuthConfigContext.Provider>
}
