import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import type { EntryAuthResponse } from '@/data/user'
import { signIn } from '@/platform/credential'
import { useTranslation } from '@/platform/i18n'
import { useAuthStore } from './auth.store'
import { useAuthConfig } from './components/auth-provider'
import { idTokenClaimsForDisplay, verifyIdToken } from './id-token'
import { userInfo } from './user-info'

/**
 * 登录或注册成功之后的收尾：验签（配置允许时）、采纳会话、记下用户信息，然后进欢迎页。
 *
 * 这一步会**发请求与跳转**，按 `architecture/06-state.md` §1（store 不写 DOM、不发请求）不放进 store，
 * 作为域级动作由页面在拿到响应后调用（也因此在动作里完成，不靠 `useEffect` 追状态）。
 * 失败时只把一句四语文案交给 store 的 `setNotice`，具体原因留控制台。
 *
 * 欢迎页是登录后的第一站（占位），会话后的具体去向（按用户信息分流）在那之后接。
 */
export function useCompleteSignIn() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
      navigate('/welcome')
      return true
    },
    [config, keys, navigate, t, setNotice, setUser],
  )
}
