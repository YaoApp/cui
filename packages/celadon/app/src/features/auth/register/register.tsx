import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Input } from '@/components/base/input'
import { Link } from '@/components/base/link'
import { OtpField } from '@/components/base/otp-field'
import { Spinner } from '@/components/base/spinner'
import { useRequest } from '@/data'
import {
  entryInviteQuery,
  entryOtpQuery,
  entryRegisterQuery,
  entryVerifyQuery,
  type EntryAuthResponse,
  type EntryVerifyResponse,
} from '@/data/user'
import { appHref } from '@/platform/router/basename'
import { useTranslation } from '@/platform/i18n'
import { useDocumentTitle } from '@/platform/document-title'
import { looksLikeAccount } from '../account'
import { AuthLayout } from '../components/auth-layout'
import { CaptchaDialog } from '../components/captcha-dialog'
import { LockedAccount } from '../components/locked-account'
import { PasswordInput } from '../components/password-input'
import { StatusNotice } from '../components/status-notice'
import { TermsNote } from '../components/terms-note'
import { useAuth } from '../use-auth'
import { useCompleteSignIn } from '../use-complete-sign-in'
import './register.less'

/** 一次性口令的位数与重发冷却，与登录页的口令步同一套取值。 */
const CODE_LENGTH = 6
const RESEND_SECONDS = 60

/**
 * 注册页：账号 → 密码 → 邀请码。
 *
 * 判定与登录页共用（`entryVerify`）：从登录页跳进来时判定已经做过，账号带在查询里、临时令牌在域状态里，
 * 这一页直接从密码步开始；直接打开 `/register` 时没有令牌，这一页自己走一遍账号步与验证码弹窗。
 * 判定说账号已经存在时不进表单，给一条提示并指向登录。
 *
 * 密码与确认密码都是本地校验：两次不一致、必填为空都在字段上给错；接口失败按错误码翻译后由页面级提示呈现。
 * `verification_code_required` 为真时收一次性口令并允许重发，重发成功用新的 `otp_id` 覆盖域里的那一个。
 * 注册成功带 `id_token` 时按登录收尾；没带就是「注册成功但未登录」，回登录页并给一条提示。
 */
export function RegisterPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const complete = useCompleteSignIn()
  useDocumentTitle(t('auth.register.docTitle'))
  const navigate = useNavigate()
  const config = auth.config
  /* 客户端内（地址带 `from`）用达标边界；独立访问有意弱化，与草稿一致 */
  const inApp = new URLSearchParams(window.location.search).has('from')
  const carried = new URLSearchParams(window.location.search).get('username') ?? ''

  const [account, setAccount] = useState(carried || auth.username)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [captcha, setCaptcha] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaRound, setCaptchaRound] = useState(0)
  const [captchaOpen, setCaptchaOpen] = useState(false)
  const captchaOpenRef = useRef(false)
  const [resendIn, setResendIn] = useState(0)
  /* 账号已经存在：留在账号步，提示去登录（本地提示，不占用域里那条共享提示） */
  const [accountExists, setAccountExists] = useState(false)

  const accountValid = looksLikeAccount(account)
  const captchaType = config?.form?.captcha?.type
  const captchaRequired = captchaType === 'image' || captchaType === 'turnstile'
  const turnstileSitekey = config?.form?.captcha?.options?.sitekey ?? ''
  const needsCode = auth.needsCode
  /* 已经有判定结果（从登录页跳进来，或这一页刚判过）才进密码步；否则先收账号 */
  const readyToRegister = auth.phase === 'password' && auth.verifyStatus === 'register' && auth.tempToken !== ''
  const inInvite = auth.phase === 'invite'

  const verifyCall = useRequest(
    entryVerifyQuery({
      username: account.trim(),
      ...(captcha ? { captcha } : {}),
      ...(captchaType === 'image' && captcha ? { captcha_id: captchaId } : {}),
    }),
    { manual: true },
  )
  const registerCall = useRequest(
    entryRegisterQuery(auth.tempToken, {
      password,
      confirm_password: confirm,
      ...(needsCode ? { otp_id: auth.otpId, verification_code: code } : {}),
    }),
    { manual: true },
  )
  const resendCall = useRequest(entryOtpQuery(auth.tempToken), { manual: true })
  const inviteCall = useRequest(entryInviteQuery(auth.tempToken, { code: inviteCode }), { manual: true })

  /* 重发冷却：每一步一秒，归零后按钮恢复。计时器只在冷却期内挂一个。 */
  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  const accountError = touched.account && !accountValid ? t('auth.error.accountInvalid') : undefined
  const captchaError =
    touched.captcha && captcha.trim() === ''
      ? t(captchaType === 'turnstile' ? 'auth.error.turnstileRequired' : 'auth.error.captchaRequired')
      : undefined
  const passwordError = touched.password && password === '' ? t('auth.error.passwordRequired') : undefined
  const confirmError = touched.confirm && confirm !== password ? t('auth.error.passwordMismatch') : undefined
  const codeError = touched.code && needsCode && code.length < CODE_LENGTH ? t('auth.error.codeRequired') : undefined
  const termsError = touched.terms && !acceptedTerms ? t('auth.error.termsRequired') : undefined

  const busy =
    verifyCall.state.status === 'loading' ||
    registerCall.state.status === 'loading' ||
    resendCall.state.status === 'loading' ||
    inviteCall.state.status === 'loading'
  const captchaBusy = verifyCall.state.status === 'loading'
  const submitting = registerCall.state.status === 'loading'

  const verifyFailure = verifyCall.state.status === 'error' ? verifyCall.state.failure.text : undefined
  const registerFailure = registerCall.state.status === 'error' ? registerCall.state.failure.text : undefined
  const inviteFailure = inviteCall.state.status === 'error' ? inviteCall.state.failure.text : undefined
  const resendFailure = resendCall.state.status === 'error' ? resendCall.state.failure.text : undefined

  const notice = accountExists
    ? { tone: 'info' as const, text: t('auth.register.exists') }
    : registerFailure
      ? { tone: 'danger' as const, text: registerFailure }
      : resendFailure
        ? { tone: 'danger' as const, text: resendFailure }
        : auth.notice

  function closeCaptcha() {
    captchaOpenRef.current = false
    setCaptchaOpen(false)
    setTouched({})
  }

  function openCaptcha() {
    setCaptcha('')
    setCaptchaId('')
    setCaptchaRound((value) => value + 1)
    setTouched({})
    setCaptchaOpen(true)
    captchaOpenRef.current = true
  }

  /** 改账号：清掉判定结果与表单里已经填过的内容，回到可编辑的账号步。 */
  function changeAccount() {
    auth.changeAccount()
    setPassword('')
    setConfirm('')
    setCode('')
    setResendIn(0)
    setTouched({})
    setAccountExists(false)
  }

  /** 判定结果决定下一步：账号可以注册就进密码步，已经存在就留在账号步并提示去登录。 */
  function afterVerify(value: EntryVerifyResponse) {
    if (value.status === 'register') {
      auth.setUsername(account.trim())
      auth.enterPassword({
        tempToken: value.access_token,
        status: value.status,
        otpId: value.otp_id,
        /* 引擎对缺省字段按「需要」处理（isVerificationCodeRequired 为空即真），这里跟随同一口径 */
        needsCode: config?.verification_code_required !== false,
      })
      /* 判定那一步已经发过一次口令，因此进密码步就进冷却，避免立刻重发 */
      if (config?.verification_code_required !== false) setResendIn(RESEND_SECONDS)
      closeCaptcha()
      return
    }
    closeCaptcha()
    setAccountExists(true)
  }

  async function runVerify() {
    /* 判定在途时忽略后续点击：同一枚令牌交两次，第二次必然失败。 */
    if (verifyCall.state.status === 'loading') return
    /* 换过账号再判定：上一次「该账号已注册」的提示不再成立，先撤掉 */
    setAccountExists(false)
    const fromDialog = captchaOpenRef.current
    const result = await verifyCall.run()

    /* 判定还在飞的时候把弹窗关掉：当作没验证过 —— 不切步骤、不碰页面，也不换控件。 */
    if (fromDialog && !captchaOpenRef.current) return

    /* 两种验证码的令牌都只有一次有效：判定一发出就换一轮控件，下一次打开拿到的是全新的。 */
    setCaptcha('')
    setCaptchaId('')
    setCaptchaRound((value) => value + 1)

    if (!result?.ok) return
    setTouched({})
    afterVerify(result.value)
  }

  async function onContinue(event: FormEvent) {
    event.preventDefault()
    if (!accountValid) {
      setTouched((value) => ({ ...value, account: true }))
      return
    }
    if (captchaRequired) {
      openCaptcha()
      return
    }
    await runVerify()
  }

  async function onSubmitCaptcha() {
    if (captcha.trim() === '') {
      setTouched((value) => ({ ...value, captcha: true }))
      return
    }
    await runVerify()
  }

  async function onResend() {
    if (resendIn > 0) return
    const result = await resendCall.run()
    if (!result?.ok) return
    auth.setOtpId(result.value.otp_id)
    setResendIn(RESEND_SECONDS)
  }

  /** 注册成功后的去向：邀请码与联合状态回页面，带 `id_token` 的按登录收尾，其余回登录页并提示。 */
  async function settleRegister(value: EntryAuthResponse) {
    const status = value.status
    if (status === 'invite_required' || status === 'invite_verification_required') {
      auth.enterInvite(value.access_token || auth.tempToken)
      return
    }
    if (status === 'mfa_required' || status === 'team_selection_required') {
      auth.setNotice({
        tone: 'info',
        text: t(status === 'mfa_required' ? 'auth.notice.mfa' : 'auth.notice.team'),
      })
      return
    }
    if (value.id_token) {
      await complete(value)
      return
    }
    /* 注册成功但没有会话：回登录页，把「请登录」这条提示留在域里（页面切换后仍读得到） */
    auth.changeAccount()
    auth.setNotice({ tone: 'info', text: t('auth.notice.registered') })
    navigate('/login')
  }

  async function onSubmitRegister(event: FormEvent) {
    event.preventDefault()
    const next: Record<string, boolean> = {}
    if (password === '') next.password = true
    if (confirm !== password) next.confirm = true
    if (needsCode && code.length < CODE_LENGTH) next.code = true
    if (!acceptedTerms) next.terms = true
    if (Object.keys(next).length) {
      setTouched((value) => ({ ...value, ...next }))
      return
    }
    const result = await registerCall.run()
    if (!result?.ok) return
    await settleRegister(result.value)
  }

  async function onRedeemInvite(event: FormEvent) {
    event.preventDefault()
    if (inviteCode.trim() === '') return
    const result = await inviteCall.run()
    if (!result?.ok) return
    await complete(result.value)
  }

  const footnote = (
    <>
      <span>{t('auth.register.hasAccount')}</span>{' '}
      {/* 回登录页时把登录域复位：进来时登录页已经进到密码步，不复位会让它带着注册流程的临时令牌停在那一步 */}
      <Link href={appHref('/login')} onClick={() => auth.changeAccount()}>
        {t('auth.register.backToLogin')}
      </Link>
    </>
  )

  if (!config) {
    return (
      <AuthLayout
        titleLines={[t('auth.register.titleLine1'), t('auth.register.titleLine2')]}
        onBack={() => window.history.back()}
        footnote={footnote}
      >
        <div className="register__form" aria-busy="true">
          <div className="register__loading" role="status" aria-live="polite">
            <Spinner />
            <span className="register__loading-text">{t('auth.login.loading')}</span>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      titleLines={[t('auth.register.titleLine1'), t('auth.register.titleLine2')]}
      serviceHref={config.form?.terms_of_service_link}
      privacyHref={config.form?.privacy_policy_link}
      onBack={() => window.history.back()}
      footnote={footnote}
    >
      {!captchaOpen && notice ? <StatusNotice tone={notice.tone} text={notice.text} /> : null}

      <form
        className="register__form"
        onSubmit={inInvite ? onRedeemInvite : readyToRegister ? onSubmitRegister : onContinue}
      >
        {!readyToRegister && !inInvite ? (
          <>
            {/* 账号可以是邮箱或手机号，用文本类型；`type="email"` 会让手机号过不了浏览器约束校验 */}
            <Input
              id="auth-account"
              aria-label={t('auth.field.account')}
              placeholder={config.form?.username?.placeholder || t('auth.field.account')}
              type="text"
              autoComplete="username"
              icon={<Icon name="i-mail" />}
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              onBlur={() => setTouched((value) => ({ ...value, account: true }))}
              error={accountError ?? (captchaRequired ? undefined : verifyFailure)}
              disabled={busy}
              strong={inApp}
              size="large"
            />
            <Button type="submit" variant="inverse" block size="large" disabled={busy}>
              {t('auth.action.continue')}
            </Button>
          </>
        ) : null}

        {readyToRegister ? (
          <>
            <LockedAccount
              id="auth-account-locked"
              value={account}
              label={t('auth.field.account')}
              changeLabel={t('auth.action.change')}
              onChange={changeAccount}
              disabled={busy}
              strong={inApp}
            />

            <PasswordInput
              id="auth-password"
              placeholder={config.form?.password?.placeholder || t('auth.field.password')}
              autoComplete="new-password"
              value={password}
              onValueChange={setPassword}
              error={passwordError}
              disabled={busy}
              strong={inApp}
              size="large"
              autoFocus
            />

            <PasswordInput
              id="auth-confirm-password"
              placeholder={config.form?.confirm_password?.placeholder || t('auth.field.confirmPassword')}
              autoComplete="new-password"
              value={confirm}
              onValueChange={setConfirm}
              error={confirmError}
              disabled={busy}
              strong={inApp}
              size="large"
            />

            {needsCode ? (
              <>
                <OtpField
                  id="auth-code"
                  label={t('auth.field.code')}
                  cellLabel={(index) => t('auth.field.codeCell', { index: index + 1 })}
                  value={code}
                  onValueChange={setCode}
                  error={codeError}
                  disabled={busy}
                  required
                  size="large"
                />
                <div className="register__resend">
                  <Button
                    type="button"
                    variant="ghost"
                    size="small"
                    onClick={() => void onResend()}
                    disabled={resendIn > 0 || busy}
                  >
                    {resendIn > 0 ? t('auth.action.resendIn', { seconds: resendIn }) : t('auth.action.resend')}
                  </Button>
                </div>
              </>
            ) : null}

            <TermsNote
              id="register-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => {
                setAcceptedTerms(checked)
                setTouched((value) => ({ ...value, terms: true }))
              }}
              error={termsError}
              serviceHref={config.form?.terms_of_service_link}
              privacyHref={config.form?.privacy_policy_link}
            />

            <Button type="submit" variant="inverse" block size="large" disabled={submitting}>
              {t('auth.action.register')}
            </Button>
          </>
        ) : null}

        {inInvite ? (
          <>
            <Input
              id="auth-invite"
              aria-label={config.invite?.title || t('auth.field.invite')}
              placeholder={config.invite?.placeholder || t('auth.field.invite')}
              hint={config.invite?.description}
              icon={<Icon name="i-gift" />}
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              error={inviteFailure}
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

      <CaptchaDialog
        open={captchaOpen}
        onOpenChange={(next) => {
          if (!next) closeCaptcha()
        }}
        type={captchaType}
        sitekey={turnstileSitekey}
        round={captchaRound}
        value={captcha}
        onValueChange={setCaptcha}
        onCaptchaIdChange={setCaptchaId}
        error={captchaError ?? verifyFailure}
        pending={captchaBusy}
        onSubmit={() => void onSubmitCaptcha()}
      />
    </AuthLayout>
  )
}
