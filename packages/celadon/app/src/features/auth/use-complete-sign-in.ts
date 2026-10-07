import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import type { EntryAuthResponse } from '@/data/user'
import { signIn } from '@/platform/credential'
import { useTranslation } from '@/platform/i18n'
import { routerBasename } from '@/platform/router/basename'
import { useAuthStore } from './auth.store'
import { useAuthConfig } from './components/auth-provider'
import { verifyIdToken } from './id-token'

/**
 * 登录成功之后去哪：只有落在本应用命名空间之下的地址走路由，其余整页跳转。
 *
 * 入口配置里的成功地址通常由服务端给（例如引擎自己的页面），它同源但不属于本应用的路由表，
 * 交给路由会落到兜底重定向。判断只认命名空间前缀，因此不需要解析来源。
 */
function goToSuccess(navigate: ReturnType<typeof useNavigate>, url: string, basename: string) {
  const prefix = basename ? `/${basename}` : ''
  const sameApp = prefix ? url === prefix || url.startsWith(`${prefix}/`) : url.startsWith('/')

  if (!sameApp) {
    window.location.assign(url)
    return
  }

  const trimmed = prefix ? url.slice(prefix.length) : url
  navigate(trimmed.startsWith('/') ? trimmed : `/${trimmed}`)
}

/**
 * 登录或注册成功之后的收尾：验签（配置允许时）、采纳会话、按成功地址跳转。
 *
 * 这一步会**发请求与跳转**，按 `architecture/06-state.md` §1（store 不写 DOM、不发请求）不放进 store，
 * 作为域级动作由页面在拿到响应后调用（也因此在动作里完成，不靠 `useEffect` 追状态）。
 * 失败时只把一句四语文案交给 store 的 `setNotice`，具体原因留控制台。
 */
export function useCompleteSignIn() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { config, keys } = useAuthConfig()
  const setNotice = useAuthStore((state) => state.setNotice)

  return useCallback(
    async (response: EntryAuthResponse): Promise<boolean> => {
      /* 本地验签只在服务端声明了安全 Cookie，且平台有 WebCrypto 时做；
         其余情况跳过，并且不把未验签的结果当成已验证。 */
      if (response.id_token && config?.secure_cookie !== false) {
        const checked = await verifyIdToken(response.id_token, keys)
        if (!checked.ok) {
          console.warn('[auth] id token rejected:', checked.reason)
          setNotice({ tone: 'danger', text: t('auth.error.idToken') })
          return false
        }
      }

      const adopted = await signIn(response)
      if (!adopted.ok) {
        console.warn('[auth] session adoption failed:', adopted.code)
        setNotice({ tone: 'danger', text: t('auth.error.session') })
        return false
      }

      if (config?.success_url) goToSuccess(navigate, config.success_url, routerBasename())
      return true
    },
    [config, keys, navigate, t, setNotice],
  )
}
