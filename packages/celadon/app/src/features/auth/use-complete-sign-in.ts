import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { EntryAuthResponse } from '@/data/user'
import { signIn } from '@/platform/credential'
import { useTranslation } from '@/platform/i18n'
import { serviceBase } from '@/platform/service'
import { useAuthStore } from './auth.store'
import { useAuthConfig } from './components/auth-provider'
import { idTokenClaimsForDisplay, verifyIdToken } from './id-token'
import { forgetNext, readNext, takeNext } from './next'
import { rememberServer } from './server-history'
import { rememberSession } from './session-marker'
import { userInfo } from './user-info'
import { useAuthMode, withMode } from './use-auth-mode'

/**
 * 登录或注册成功之后的收尾：验签（配置允许时）、采纳会话、记下本机登录标记与用户信息，然后决定去哪。
 *
 * 去向按 `plan/06-login.md` §5：地址上带着 `next`（或第三方往返前暂存的）就去那里，
 * 没有才进收件箱。这一步会**发请求与跳转**，按 `architecture/06-state.md` §1 不放进 store，
 * 作为域级动作由页面在拿到响应后调用。失败时只把一句四语文案交给 store 的 `setNotice`。
 */
export function useCompleteSignIn() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const mode = useAuthMode()
  const { config, keys } = useAuthConfig()
  const setNotice = useAuthStore((state) => state.setNotice)
  const setUser = useAuthStore((state) => state.setUser)

  return useCallback(
    /* 账号由调用方给：密码登录与注册给本次输入的那个，第三方回跳没有账号就不传 */
    async (response: EntryAuthResponse, account?: string): Promise<boolean> => {
      /* 本地验签只在服务端声明了安全 Cookie，且平台有 WebCrypto 时做；
         其余情况跳过，并且不把未验签的结果当成已验证。
         展示用的声明无论验不验签都从载荷取一份（见 `idTokenClaimsForDisplay`）。 */
      let claims = idTokenClaimsForDisplay(response.id_token)
      if (response.id_token && config?.secure_cookie !== false) {
        const checked = await verifyIdToken(response.id_token, keys)
        if (!checked.ok) {
          console.warn('[auth] id token rejected:', checked.reason)
          setNotice({ tone: 'danger', text: t('auth.error.idToken') })
          return false
        }
        claims = checked.payload
      }

      const adopted = await signIn(response)
      if (!adopted.ok) {
        console.warn('[auth] session adoption failed:', adopted.code)
        setNotice({ tone: 'danger', text: t('auth.error.session') })
        return false
      }

      setUser(userInfo(response, account ?? '', claims))
      /* 本机登录标记：入口判定下一次打开应用时用它（不是授权依据，见 `session-marker.ts`） */
      rememberSession()
      /* 有基址就记下这台服务器：客户端里是用户选的地址，Web 上由部署给（`VITE_SERVICE_BASE`）；都没有就不记 */
      const base = serviceBase()
      if (base) rememberServer(base)

      /* 明确去向优先：地址上的 `next` 先看，第三方往返留下的暂存再看；用过就把暂存丢掉 */
      const target = readNext(location.search) ?? takeNext()
      forgetNext()
      navigate(target ?? withMode('/inbox', mode))
      return true
    },
    [config, keys, location.search, mode, navigate, t, setNotice, setUser],
  )
}
