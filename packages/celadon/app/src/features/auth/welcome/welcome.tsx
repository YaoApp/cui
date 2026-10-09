import { Navigate, useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { Spinner } from '@/components/base/spinner'
import { useDocumentTitle } from '@/platform/document-title'
import { useTranslation } from '@/platform/i18n'
import { routerBasename } from '@/platform/router/basename'
import { useRequest } from '@/data'
import { userProfileQuery } from '@/data/user'
import { AuthLayout } from '../components/auth-layout'
import { StatusNotice } from '../components/status-notice'
import { signedIn } from '../session-marker'
import { goToSuccess } from '../success-address'
import { useAuth } from '../use-auth'
import { useAuthMode, withMode } from '../use-auth-mode'
import { useServerName } from '../use-server-name'
import { useSignOut } from '../use-sign-out'
import { hasAny, profileUser } from '../user-info'
import './welcome.less'

/**
 * 欢迎页：登录成功后的第一站（占位）。
 *
 * 把本次会话的用户信息展示出来，点「继续」走入口配置里的成功地址；按用户信息分流之后接在这里。
 * 没有本机登录标记（直接开这个地址，或会话已失效）就回登录页。
 *
 * 用户信息有两个来源：登录那一刻的响应在内存里（`auth.user`），刷新或直接打开这一页时它已经没了，
 * 此时取一次 `GET /user/profile` 补上。两边都取不到可展示的字段时**不画空表格**，只留说明与按钮。
 * 用户标识优先展示：姓名与邮箱可能没有，标识一定有。
 */
export function WelcomePage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const mode = useAuthMode()
  const serverName = useServerName()
  const navigate = useNavigate()
  const { signOut, state: signOutState } = useSignOut()
  useDocumentTitle(t('auth.welcome.docTitle'))

  const memoryUser = auth.user && hasAny(auth.user) ? auth.user : undefined
  /* 内存里没有、且这一页确实该打开（有本机标记）时才补一次资料：这个判断在这一次打开里是定的，
     所以可以放在钩子的启动条件上 */
  const marked = signedIn()
  const profileCall = useRequest(userProfileQuery(), { manual: Boolean(memoryUser) || !marked })

  if (!marked) return <Navigate to={withMode('/login', mode)} replace />

  const user = memoryUser ?? (profileCall.state.status === 'ok' ? profileUser(profileCall.state.value) : undefined)
  const rows = [
    { label: t('auth.welcome.userId'), value: user?.userId },
    { label: t('auth.welcome.account'), value: user?.account },
    { label: t('auth.welcome.name'), value: user?.name },
    { label: t('auth.welcome.email'), value: user?.email },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value))
  const loadingProfile = profileCall.state.status === 'loading' && rows.length === 0
  const profileFailure = profileCall.state.status === 'error' ? profileCall.state.failure.text : undefined
  const signOutFailure = signOutState.status === 'error' ? signOutState.failure.text : undefined

  /** 继续：走入口配置的成功地址；没有配置或配置取不到就回应用首页。 */
  function onContinue() {
    if (auth.config?.success_url) {
      goToSuccess(navigate, auth.config.success_url, routerBasename())
      return
    }
    navigate('/')
  }

  /* 配置还没回来之前不点亮按钮；配置明确取不到时照旧可点，按上一条回应用首页 */
  const waiting = !auth.config && !auth.configFailed

  return (
    <AuthLayout
      mode={mode}
      serverName={serverName}
      titleLines={[t('auth.welcome.title')]}
      onBack={() => navigate('/servers')}
    >
      <p className="welcome__lead">{t('auth.welcome.lead')}</p>

      {loadingProfile ? (
        <p className="welcome__pending" role="status">
          <Spinner />
          <span>{t('auth.welcome.loadingInfo')}</span>
        </p>
      ) : null}

      {rows.length > 0 ? (
        <dl className="welcome__info">
          {rows.map((row) => (
            <div className="welcome__row" key={row.label}>
              <dt className="welcome__label">{row.label}</dt>
              <dd className="welcome__value">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {profileFailure ? (
        <StatusNotice
          tone="danger"
          text={profileFailure}
          retryLabel={t('auth.action.retry')}
          onRetry={() => void profileCall.run()}
        />
      ) : null}

      <div className="welcome__actions">
        <Button type="button" variant="inverse" block size="large" disabled={waiting} onClick={onContinue}>
          {t('auth.welcome.continue')}
        </Button>
        <Button
          type="button"
          variant="plain"
          block
          disabled={signOutState.status === 'loading'}
          onClick={() => void signOut()}
        >
          {t('auth.action.signOut')}
        </Button>
      </div>

      {signOutFailure ? <StatusNotice tone="danger" text={signOutFailure} /> : null}
    </AuthLayout>
  )
}
