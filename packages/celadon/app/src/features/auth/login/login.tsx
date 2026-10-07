import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/base/button'
import { Checkbox } from '@/components/base/checkbox'
import { Icon } from '@/components/base/icon'
import { Input } from '@/components/base/input'
import { Link } from '@/components/base/link'
import { OtpField } from '@/components/base/otp-field'
import { useRequest } from '@/data'
import {
  entryInviteQuery,
  entryLoginQuery,
  entryOtpQuery,
  entryRegisterQuery,
  entryVerifyQuery,
  oauthAuthorizeQuery,
  type SigninProvider,
} from '@/data/user'
import { capabilities } from '@/platform/client/capabilities'
import { appHref } from '@/platform/router/basename'
import { useTranslation } from '@/platform/i18n'
import { AuthLayout } from '../components/auth-layout'
import { PasswordInput } from '../components/password-input'
import { ProviderList } from '../components/provider-list'
import { StatusNotice } from '../components/status-notice'
import { TermsNote } from '../components/terms-note'
import { useAuth } from '../components/auth-provider'
import './login.less'

/** 验证码位数：与服务端一致，填满即可提交。 */
const CODE_LENGTH = 6
/** 重发验证码的冷却秒数。 */
const RESEND_SECONDS = 60

/** 账号形态：邮箱（含 `@` 与点号）或纯数字的手机号。判定宽松，真实校验在服务端。 */
function looksLikeAccount(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  return /^\d{6,}$/.test(trimmed)
}

/**
 * 登录页：三步走完一次登录。
 *
 * 第一步判定账号，服务端据此决定登录还是注册；第二步给密码，需要验证码时一并给；
 * 服务端要求邀请码时走第三步。写请求由这一页发，因为接口声明在创建时就把入参闭包进去了；
 * 域的共享状态与成功后的收尾（验签、采纳会话、跳转）在 `AuthProvider`。
 * 字段级错误只来自本地校验，接口失败按错误码翻译后由 `StatusNotice` 呈现在表单上方。
 */
export function LoginPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const config = auth.config
  /* 客户端内（地址带 `from`）用达标边界；独立访问有意弱化，与草稿一致 */
  const inApp = new URLSearchParams(window.location.search).has('from')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [remember, setRemember] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [seconds, setSeconds] = useState(0)
  const [providerId, setProviderId] = useState('')

  const account = auth.username
  const accountValid = looksLikeAccount(account)
  const confirmNeeded = config?.form?.confirm_password !== undefined

  const accountError = touched.account && !accountValid ? t('auth.error.accountInvalid') : undefined
  const termsError = touched.terms && !acceptedTerms ? t('auth.error.termsRequired') : undefined
  const passwordError = touched.password && password === '' ? t('auth.error.passwordRequired') : undefined
  const confirmError =
    touched.confirm && confirmNeeded && (confirmPassword === '' || confirmPassword !== password)
      ? t(confirmPassword === '' ? 'auth.error.passwordRequired' : 'auth.error.passwordMismatch')
      : undefined
  const codeError =
    touched.code && auth.needsCode && code.length < CODE_LENGTH ? t('auth.error.codeRequired') : undefined

  const verifyCall = useRequest(entryVerifyQuery({ username: account.trim() }), { manual: true })
  const loginCall = useRequest(entryLoginQuery(auth.tempToken, { password, remember_me: remember }), { manual: true })
  const registerCall = useRequest(
    entryRegisterQuery(auth.tempToken, {
      password,
      confirm_password: confirmPassword,
      ...(auth.needsCode ? { otp_id: auth.otpId, verification_code: code } : {}),
    }),
    { manual: true },
  )
  const inviteCall = useRequest(entryInviteQuery(auth.tempToken, { code: inviteCode }), { manual: true })
  const otpCall = useRequest(entryOtpQuery(auth.tempToken), { manual: true })
  const providerCall = useRequest(oauthAuthorizeQuery(providerId), { manual: true })

  const busy =
    verifyCall.state.status === 'loading' ||
    loginCall.state.status === 'loading' ||
    registerCall.state.status === 'loading' ||
    inviteCall.state.status === 'loading' ||
    providerCall.state.status === 'loading'
  const submitting = loginCall.state.status === 'loading' || registerCall.state.status === 'loading'

  /* 冷却倒数：只在还有剩余秒数时挂计时器，归零即清。 */
  useEffect(() => {
    if (seconds <= 0) return
    const timer = window.setInterval(() => setSeconds((value) => (value <= 1 ? 0 : value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [seconds])

  /* 第三方入口：地址取回之后才跳。独立访问整页跳，客户端内交系统浏览器。 */
  const { run: runProvider } = providerCall
  useEffect(() => {
    if (!providerId) return
    void runProvider()
  }, [providerId, runProvider])

  useEffect(() => {
    if (providerCall.state.status !== 'ok') return
    const url = providerCall.state.value.authorization_url
    if (capabilities().externalOpen) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.assign(url)
  }, [providerCall.state])


  async function onContinue(event: FormEvent) {
    event.preventDefault()
    if (!accountValid || !acceptedTerms) {
      setTouched((value) => ({ ...value, account: true, terms: true }))
      return
    }
    const result = await verifyCall.run()
    if (!result?.ok) return
    setTouched({})
    auth.enterPassword({
      tempToken: result.value.access_token,
      status: result.value.status,
      otpId: result.value.otp_id,
      needsCode: Boolean(config?.verification_code_required),
    })
    if (result.value.verification_sent) setSeconds(RESEND_SECONDS)
  }

  async function onSubmitPassword(event: FormEvent) {
    event.preventDefault()
    const isRegister = auth.verifyStatus === 'register'
    const confirmMissing = isRegister && confirmNeeded && (confirmPassword === '' || confirmPassword !== password)
    if (password === '' || confirmMissing || (auth.needsCode && code.length < CODE_LENGTH)) {
      setTouched((value) => ({ ...value, password: true, confirm: true, code: true }))
      return
    }

    const call = isRegister ? registerCall : loginCall
    const result = await call.run()
    if (!result?.ok) return

    const status = result.value.status
    if (status === 'invite_verification_required' || status === 'invite_required') {
      auth.enterInvite(result.value.access_token || auth.tempToken)
      return
    }
    if (status === 'mfa_required' || status === 'team_selection_required') {
      auth.setNotice({
        tone: 'info',
        text: t(status === 'mfa_required' ? 'auth.notice.mfa' : 'auth.notice.team'),
      })
      return
    }
    /* 注册成功但没有会话：回到第一步重新登录，这是 `auto_login` 为假时的正常分支 */
    if (isRegister && !result.value.id_token) {
      auth.changeAccount()
      auth.setNotice({ tone: 'info', text: t('auth.notice.registered') })
      return
    }
    await auth.complete(result.value)
  }

  async function onRedeemInvite(event: FormEvent) {
    event.preventDefault()
    if (inviteCode.trim() === '') return
    const result = await inviteCall.run()
    if (!result?.ok) return
    await auth.complete(result.value)
  }

  async function onResend() {
    if (seconds > 0) return
    const result = await otpCall.run()
    if (!result?.ok) return
    if (result.value.otp_id) auth.setOtpId(result.value.otp_id)
    setCode('')
    setSeconds(RESEND_SECONDS)
  }

  /* 最近一次失败就是要展示的那条：文案已经由取数层按错误码翻好 */
  const failure =
    verifyCall.state.status === 'error'
      ? verifyCall.state.failure.text
      : loginCall.state.status === 'error'
        ? loginCall.state.failure.text
        : registerCall.state.status === 'error'
          ? registerCall.state.failure.text
          : inviteCall.state.status === 'error'
            ? inviteCall.state.failure.text
            : otpCall.state.status === 'error'
              ? otpCall.state.failure.text
              : providerCall.state.status === 'error'
                ? providerCall.state.failure.text
                : undefined

  if (!config) {
    return (
      <AuthLayout titleLines={[t('auth.login.titleLine1'), t('auth.login.titleLine2')]}>
        <p className="login__loading">{t('auth.login.loading')}</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      /* 标题是设计稿写死的文案：换行也照设计稿，中文一行（第二行为空，由样式收起） */
      titleLines={[t('auth.login.titleLine1'), t('auth.login.titleLine2')]}
      serviceHref={config.form?.terms_of_service_link}
      privacyHref={config.form?.privacy_policy_link}
      onBack={() => window.history.back()}
      footnote={
        <>
          <span>{t('auth.footnote.prefix')}</span>{' '}
          <Link href={appHref('/register')}>{t('auth.footnote.link')}</Link>
        </>
      }
    >
      {failure ? <StatusNotice tone="danger" text={failure} /> : null}
      {auth.notice ? <StatusNotice tone={auth.notice.tone} text={auth.notice.text} /> : null}

      <form
        className="login__form"
        onSubmit={auth.phase === 'account' ? onContinue : auth.phase === 'password' ? onSubmitPassword : onRedeemInvite}
      >
        {auth.phase === 'account' ? (
          <>
            {config.third_party?.providers?.length ? (
              <>
                <ProviderList
                  providers={config.third_party.providers}
                  onPick={(provider: SigninProvider) => setProviderId(provider.id)}
                  pending={providerCall.state.status === 'loading'}
                />
                <p className="login__or">{t('auth.or')}</p>
              </>
            ) : null}

            <Input
              id="auth-account"
              aria-label={t('auth.field.account')}
              placeholder={config.form?.username?.placeholder || t('auth.field.account')}
              type="email"
              autoComplete="email"
              icon={<Icon name="i-mail" />}
              value={account}
              onChange={(event) => auth.setUsername(event.target.value)}
              onBlur={() => setTouched((value) => ({ ...value, account: true }))}
              error={accountError}
              disabled={busy}
              /* 独立访问是有意弱化边界（与草稿一致，对外入口页追求轻观感）；客户端内取达标档 */
              strong={inApp}
              size="large"
            />

            {config.form?.terms_of_service_link || config.form?.privacy_policy_link ? (
              <TermsNote
                id="auth-terms"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                error={termsError}
                serviceHref={config.form?.terms_of_service_link}
                privacyHref={config.form?.privacy_policy_link}
              />
            ) : null}

            <Button type="submit" variant="inverse" block size="large" disabled={busy}>
              {t('auth.action.continue')}
            </Button>
          </>
        ) : null}

        {auth.phase === 'password' ? (
          <>
            <div className="login__account">
              <Input
                id="auth-account-readonly"
                aria-label={t('auth.field.account')}
                value={account}
                readOnly
                disabled={busy}
                strong={inApp}
                size="large"
              />
              <Button
                type="button"
                variant="plain"
                size="small"
                disabled={busy}
                onClick={() => {
                  auth.changeAccount()
                  setPassword('')
                  setConfirmPassword('')
                  setCode('')
                  setTouched({})
                }}
              >
                {t('auth.action.change')}
              </Button>
            </div>

            <PasswordInput
              id="auth-password"
              placeholder={config.form?.password?.placeholder || t('auth.field.password')}
              autoComplete={auth.verifyStatus === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onValueChange={setPassword}
              onBlur={() => setTouched((value) => ({ ...value, password: true }))}
              error={passwordError}
              disabled={busy}
              strong={inApp}
              size="large"
              autoFocus
            />

            {auth.verifyStatus === 'register' && confirmNeeded ? (
              <PasswordInput
                id="auth-password-confirm"
                placeholder={config.form?.confirm_password?.placeholder || t('auth.field.confirmPassword')}
                autoComplete="new-password"
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                onBlur={() => setTouched((value) => ({ ...value, confirm: true }))}
                error={confirmError}
                disabled={busy}
                strong={inApp}
                size="large"
              />
            ) : null}

            {auth.verifyStatus === 'register' && auth.needsCode ? (
              <div className="login__code">
                <OtpField
                  id="auth-code"
                  length={CODE_LENGTH}
                  label={t('auth.field.code')}
                  value={code}
                  onValueChange={setCode}
                  cellLabel={(index) => t('auth.field.codeCell', { index: index + 1 })}
                  error={codeError}
                  disabled={busy}
                />
                <Button type="button" variant="plain" size="small" disabled={busy || seconds > 0} onClick={onResend}>
                  {seconds > 0 ? t('auth.action.resendIn', { seconds }) : t('auth.action.resend')}
                </Button>
              </div>
            ) : null}

            {auth.verifyStatus === 'login' && config.form?.remember_me ? (
              <Checkbox
                id="auth-remember"
                label={t('auth.remember')}
                checked={remember}
                onCheckedChange={setRemember}
                disabled={busy}
              />
            ) : null}

            <Button type="submit" variant="inverse" block size="large" disabled={submitting}>
              {auth.verifyStatus === 'register' ? t('auth.action.register') : t('auth.action.login')}
            </Button>
          </>
        ) : null}

        {auth.phase === 'invite' ? (
          <>
            <Input
              id="auth-invite"
              aria-label={config.invite?.title || t('auth.field.invite')}
              placeholder={config.invite?.placeholder || t('auth.field.invite')}
              hint={config.invite?.description}
              icon={<Icon name="i-gift" />}
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              disabled={busy}
              strong={inApp}
              size="large"
              autoFocus
            />
            <Button
              type="submit"
              variant="inverse"
              block
              size="large"
              disabled={inviteCall.state.status === 'loading' || inviteCode.trim() === ''}
            >
              {t('auth.action.redeem')}
            </Button>
          </>
        ) : null}
      </form>
    </AuthLayout>
  )
}
