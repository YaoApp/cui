import { Navigate, useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { useDocumentTitle } from '@/platform/document-title'
import { useTranslation } from '@/platform/i18n'
import { routerBasename } from '@/platform/router/basename'
import { AuthLayout } from '../components/auth-layout'
import { goToSuccess } from '../success-address'
import { useAuth } from '../use-auth'
import { useAuthMode, withMode } from '../use-auth-mode'
import { useServerName } from '../use-server-name'
import './welcome.less'

/**
 * 欢迎页：登录成功后的第一站（占位）。
 *
 * 只把本次会话的用户信息展示出来，点「继续」走入口配置里的成功地址；按用户信息分流之后接在这里。
 * 没有用户信息（直接开这个地址，或刷新后内存里没有了）就回登录页。
 */
export function WelcomePage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const mode = useAuthMode()
  const serverName = useServerName()
  const navigate = useNavigate()
  useDocumentTitle(t('auth.welcome.docTitle'))

  if (!auth.user) return <Navigate to={withMode('/login', mode)} replace />

  const rows = [
    { label: t('auth.welcome.userId'), value: auth.user.userId },
    { label: t('auth.welcome.account'), value: auth.user.account },
    { label: t('auth.welcome.name'), value: auth.user.name },
    { label: t('auth.welcome.email'), value: auth.user.email },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value))

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

      <dl className="welcome__info">
        {rows.map((row) => (
          <div className="welcome__row" key={row.label}>
            <dt className="welcome__label">{row.label}</dt>
            <dd className="welcome__value">{row.value}</dd>
          </div>
        ))}
      </dl>

      <Button type="button" variant="inverse" block size="large" disabled={waiting} onClick={onContinue}>
        {t('auth.welcome.continue')}
      </Button>
    </AuthLayout>
  )
}
