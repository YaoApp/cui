import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useRequest } from '@/data'
import { entryConfigQuery, oidcKeysQuery } from '@/data/user'
import { signIn } from '@/platform/credential'
import { routerBasename } from '@/platform/router/basename'
import { useTranslation } from '@/platform/i18n'
import { verifyIdToken } from '../../id-token'
import { AuthContext, type AuthContextValue, type AuthNotice, type AuthPhase, type AuthVerifyStatus } from './auth-context'

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

export type AuthProviderProps = { children: ReactNode }

/**
 * 登录域的共享状态：入口配置、当前步骤、判定结果、临时令牌、口令标识与页面级提示。
 *
 * 表单字段不进这里：它们是这一页的临时输入，刷新就该清空。写请求也由页面发，
 * 因为域层的写声明在创建时就把入参闭包进去了（见 `data/user/queries.ts`），
 * 页面拿着当前值构建声明最直接；这里只接住结果，并统一处理成功之后的收尾。
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const configCall = useRequest(entryConfigQuery())
  const keysCall = useRequest(oidcKeysQuery())

  const [phase, setPhase] = useState<AuthPhase>('account')
  const [verifyStatus, setVerifyStatus] = useState<AuthVerifyStatus | undefined>(undefined)
  const [tempToken, setTempToken] = useState('')
  const [otpId, setOtpId] = useState('')
  const [needsCode, setNeedsCode] = useState(false)
  const [username, setUsername] = useState('')
  const [notice, setNotice] = useState<AuthNotice | undefined>(undefined)

  const config = configCall.state.status === 'ok' ? configCall.state.value : undefined
  const keys = keysCall.state.status === 'ok' ? keysCall.state.value.keys : undefined

  const enterPassword = useCallback<AuthContextValue['enterPassword']>((input) => {
    setTempToken(input.tempToken)
    setVerifyStatus(input.status)
    setOtpId(input.otpId ?? '')
    setNeedsCode(input.needsCode)
    setNotice(undefined)
    setPhase('password')
  }, [])

  const enterInvite = useCallback((token: string) => {
    setTempToken(token)
    setNotice(undefined)
    setPhase('invite')
  }, [])

  const changeAccount = useCallback(() => {
    setPhase('account')
    setVerifyStatus(undefined)
    setTempToken('')
    setOtpId('')
    setNeedsCode(false)
    setNotice(undefined)
  }, [])

  const complete = useCallback<AuthContextValue['complete']>(
    async (response) => {
      /* 本地验签只在服务端声明了安全 Cookie，且平台有 WebCrypto 时做；
         其余情况跳过，并且不把未验签的结果当成已验证。 */
      if (response.id_token && config?.secure_cookie !== false) {
        const checked = await verifyIdToken(response.id_token, keys)
        if (!checked.ok) {
          // 只上屏一句四语文案，具体原因留给控制台，避免把内部细节当提示给用户
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
    [config, keys, navigate, t],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      config,
      phase,
      verifyStatus,
      tempToken,
      otpId,
      needsCode,
      username,
      notice,
      setNotice,
      setUsername,
      enterPassword,
      enterInvite,
      setOtpId,
      changeAccount,
      complete,
    }),
    [config, phase, verifyStatus, tempToken, otpId, needsCode, username, notice, enterPassword, enterInvite, changeAccount, complete],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
