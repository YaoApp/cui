import { useCallback, useMemo, type ReactNode } from 'react'
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
  /* 验签只在服务端声明了安全 Cookie 时做（见 `use-complete-sign-in.ts`）。要验签而公钥集取不到时，
     页面按「配置取不到」处理并给重试：放人进去只会在最后一步失败，重试才是用户能做的动作。 */
  const keysNeeded = config !== undefined && config.secure_cookie !== false
  const configFailed =
    configCall.state.status === 'error' || (keysNeeded && keysCall.state.status === 'error')

  /* 失败态的重试：两份接口都重跑（公钥集与入口配置是同一次网络故障里的两半，`run` 身份稳定） */
  const reloadConfig = useCallback(() => {
    void configCall.run()
    void keysCall.run()
  }, [configCall.run, keysCall.run])

  const value = useMemo<AuthConfigValue>(
    () => ({ config, keys, configFailed, reloadConfig }),
    [config, keys, configFailed, reloadConfig],
  )

  return <AuthConfigContext.Provider value={value}>{children}</AuthConfigContext.Provider>
}
