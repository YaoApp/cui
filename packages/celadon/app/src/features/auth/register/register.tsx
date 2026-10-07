import { useState } from 'react'
import { Link } from '@/components/base/link'
import { appHref } from '@/platform/router/basename'
import { useDocumentTitle } from '@/platform/document-title'
import { useTranslation } from '@/platform/i18n'
import { AuthLayout } from '../components/auth-layout'
import { TermsNote } from '../components/terms-note'
import { useAuth } from '../use-auth'
import './register.less'

/**
 * 注册页：先把通道接上。
 *
 * 登录页判定账号不存在时带 `username` 跳到这里。表单本身按 `plan/06-login-features.md` 的设计随后落地，
 * 这一版做三件事：显示带过来的账号、把条款与隐私政策的勾选放在这一页（同意条款属于注册行为），
 * 以及给出返回登录的入口。
 */
export function RegisterPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  useDocumentTitle(t('auth.register.docTitle'))
  const config = auth.config
  const username = new URLSearchParams(window.location.search).get('username') ?? auth.username
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [touched, setTouched] = useState(false)

  const serviceHref = config?.form?.terms_of_service_link
  const privacyHref = config?.form?.privacy_policy_link
  const termsError = touched && !acceptedTerms ? t('auth.error.termsRequired') : undefined

  return (
    <AuthLayout
      titleLines={[t('auth.register.titleLine1'), t('auth.register.titleLine2')]}
      onBack={() => window.history.back()}
      footnote={
        <>
          <span>{t('auth.register.hasAccount')}</span>{' '}
          <Link href={appHref('/login')}>{t('auth.register.backToLogin')}</Link>
        </>
      }
    >
      <div className="register__pending">
        <p className="register__account">{username}</p>
        <p className="register__note">{t('auth.register.pending')}</p>
      </div>

      {serviceHref || privacyHref ? (
        <TermsNote
          id="register-terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => {
            setAcceptedTerms(checked)
            setTouched(true)
          }}
          error={termsError}
          serviceHref={serviceHref}
          privacyHref={privacyHref}
        />
      ) : null}
    </AuthLayout>
  )
}
