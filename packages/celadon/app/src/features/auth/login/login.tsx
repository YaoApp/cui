import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { Checkbox } from '@/components/base/checkbox'
import { Icon } from '@/components/base/icon'
import { Input } from '@/components/base/input'
import { Link } from '@/components/base/link'
import { Spinner } from '@/components/base/spinner'
import { useRequest } from '@/data'
import {
  entryInviteQuery,
  entryLoginQuery,
  entryVerifyQuery,
  oauthAuthorizeQuery,
  type EntryAuthResponse,
  type EntryVerifyResponse,
  type SigninProvider,
} from '@/data/user'
import { capabilities } from '@/platform/client/capabilities'
import { appHref } from '@/platform/router/basename'
import { useTranslation } from '@/platform/i18n'
import { useDocumentTitle } from '@/platform/document-title'
import { looksLikeAccount } from '../account'
import { AuthLayout } from '../components/auth-layout'
import { CaptchaDialog } from '../components/captcha-dialog'
import { LockedAccount } from '../components/locked-account'
import { PasswordInput } from '../components/password-input'
import { ProviderList } from '../components/provider-list'
import { StatusNotice } from '../components/status-notice'
import { useAuth } from '../use-auth'
import { useCompleteSignIn } from '../use-complete-sign-in'
import './login.less'

/** 注册表单的地址（相对路由基址）：账号带在查询里，注册页据此预填。 */
function registerPath(username: string): string {
  return `/register?username=${encodeURIComponent(username)}`
}

/** 第三方登录的回跳地址（绝对地址，带应用命名空间）：授权完成后回到 `/auth/back/<提供方>`。 */
function backUrl(providerId: string): string {
  return `${window.location.origin}${appHref(`/auth/back/${encodeURIComponent(providerId)}`)}`
}

/**
 * 登录页：账号 → 验证码 → 密码。
 *
 * 第一步在页面上填账号；点「下一步」之后，入口配置要求验证码时由弹窗收（图片或人机验证，按配置分支），
 * 确定后**回到页面**：邮箱锁定成只读并在字段尾部给出「修改」，页面出现密码表单，主按钮变成「登录」。
 * 判定说账号不存在时带账号跳注册表单。
 *
 * 锁定发生在**验证通过之后**：验证过一次就不再让账号可改，要改必须点「修改」，
 * 这样判定结果与账号始终对得上，也不会出现「改完账号还拿着上一次的临时令牌」。
 * 写请求由这一页发，因为接口声明在创建时就把入参闭包进去了；域的共享状态与成功后的收尾在 `AuthProvider`。
 * 字段级错误只来自本地校验，接口失败按错误码翻译后由 `StatusNotice` 呈现。
 */
export function LoginPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const complete = useCompleteSignIn()
  /* 标签页上的名字：这一页叫什么由页面给，应用名与语言跟随由平台层统一处理 */
  useDocumentTitle(t('auth.login.docTitle'))
  const navigate = useNavigate()
  const config = auth.config
  /* 客户端内（地址带 `from`）用达标边界；独立访问有意弱化，与草稿一致 */
  const inApp = new URLSearchParams(window.location.search).has('from')

  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  /** 验证码的轮次：判定失败后自增，用它重挂控件换一张新的（两种控件都是一次性令牌）。 */
  const [captchaRound, setCaptchaRound] = useState(0)
  const [remember, setRemember] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  /* 选中的第三方入口：请求声明按它构建，因此放在 ref 里，点击动作里改完就能立即发起，不必等一次重渲染 */
  const providerIdRef = useRef('')
  const [captchaOpen, setCaptchaOpen] = useState(false)
  /* 弹窗此刻是否开着：判定是异步的，回来时要看**当时**的状态，因此用 ref 而不是 state 闭包 */
  const captchaOpenRef = useRef(false)

  const account = auth.username
  const accountValid = looksLikeAccount(account)
  /* 入口配置声明了验证码就要收：图片验证码给图形，人机验证给令牌。两种都把令牌放在判定的 `captcha` 字段里，
     只有图片验证码还要带 `captcha_id`。 */
  const captchaType = config?.form?.captcha?.type
  const captchaRequired = captchaType === 'image' || captchaType === 'turnstile'
  const turnstileSitekey = config?.form?.captcha?.options?.sitekey ?? ''
  /* 验证通过后账号锁定：只读加「修改」，要改必须显式点它 */
  const accountLocked = auth.phase === 'password'

  const accountError = touched.account && !accountValid ? t('auth.error.accountInvalid') : undefined
  const captchaError =
    touched.captcha && captcha.trim() === ''
      ? t(captchaType === 'turnstile' ? 'auth.error.turnstileRequired' : 'auth.error.captchaRequired')
      : undefined
  const passwordError = touched.password && password === '' ? t('auth.error.passwordRequired') : undefined

  const verifyCall = useRequest(
    entryVerifyQuery({
      username: account.trim(),
      ...(captcha ? { captcha } : {}),
      ...(captchaType === 'image' && captcha ? { captcha_id: captchaId } : {}),
    }),
    { manual: true },
  )
  const loginCall = useRequest(entryLoginQuery(auth.tempToken, { password, remember_me: remember }), { manual: true })
  const inviteCall = useRequest(entryInviteQuery(auth.tempToken, { code: inviteCode }), { manual: true })
  /* 第三方入口的地址按**选中的那个入口**构建，因此用 `build` 形态：它每次都在运行时读 ref，
     点击动作里改完 ref 立刻发起，不必等一次重渲染，也就没有「监听状态再取数」的 effect。 */
  const providerCall = useRequest(
    {
      key: ['user', 'oauthAuthorize'],
      build: () => oauthAuthorizeQuery(providerIdRef.current, backUrl(providerIdRef.current)).request,
    },
    { manual: true },
  )

  /* 页面自己的进行中：只由**页面发出的**写请求决定（登录、邀请码、第三方入口）。
     判定属于弹窗里那一步，**不算进来** —— 否则弹窗一提交，下面的「下一步」就被置灰、
     请求回来又恢复，看上去像整块表单刷新了一下。 */
  const busy = loginCall.state.status === 'loading' || inviteCall.state.status === 'loading' || providerCall.state.status === 'loading'
  /* 弹窗自己的进行中：判定在飞时只锁弹窗里的控件（取消、确定与验证码控件） */
  const captchaBusy = verifyCall.state.status === 'loading'
  const submitting = loginCall.state.status === 'loading'

  /** 选第三方入口：取回授权地址后跳转。Web 整页跳转，桌面交给系统浏览器打开。这是动作，不是 effect。 */
  async function onPickProvider(id: string) {
    providerIdRef.current = id
    const result = await providerCall.run()
    if (!result?.ok) return
    const url = result.value.authorization_url
    if (capabilities().systemBrowser) window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.assign(url)
  }

  function closeCaptcha() {
    captchaOpenRef.current = false
    setCaptchaOpen(false)
    setTouched({})
  }

  /**
   * 打开验证码弹窗。
   *
   * 每打开一次都换一轮控件：两种验证码的令牌都只能成功用一次，跨次复用必然被服务端拒绝。
   * 换轮靠 `captchaRound` 换掉控件的 key，图片重新取图、人机验证重新领令牌，打开时状态里
   * 因此只有这一轮的新令牌，不会带上一次用过的。
   */
  function openCaptcha() {
    setCaptcha('')
    setCaptchaId('')
    setCaptchaRound((value) => value + 1)
    setTouched({})
    setCaptchaOpen(true)
    captchaOpenRef.current = true
  }

  /** 改账号：清掉判定结果，回到可编辑的账号步（锁定只在验证通过之后，改它必须走这里）。 */
  function changeAccount() {
    auth.changeAccount()
    setCaptchaOpen(false)
    captchaOpenRef.current = false
    setPassword('')
    setTouched({})
  }

  /** 判定结果决定下一步：账号存在回页面进密码步（邮箱就此锁定），不存在去注册表单。 */
  function afterVerify(value: EntryVerifyResponse) {
    auth.enterPassword({
      tempToken: value.access_token,
      status: value.status,
      otpId: value.otp_id,
      /* 引擎对缺省字段按「需要」处理（isVerificationCodeRequired 为空即真），这里跟随同一口径 */
      needsCode: config?.verification_code_required !== false,
    })
    if (value.user_exists && value.status === 'login') {
      closeCaptcha()
      return
    }
    /* 账号不存在：带上账号去注册表单（注册页随后落地，这里先把通道接上） */
    navigate(registerPath(account.trim()))
  }

  async function runVerify() {
    /* 判定在途时忽略后续点击：同一枚令牌交两次，第二次必然失败。 */
    if (verifyCall.state.status === 'loading') return
    /* 这一次是从弹窗里发出的吗：关掉弹窗后要丢弃结果，因此先记下来。
       （账号步不需要验证码时判定直接在页面上发，那种情况关掉弹窗与它无关。） */
    const fromDialog = captchaOpenRef.current
    const result = await verifyCall.run()

    /* 判定还在飞的时候把弹窗关掉（取消、叉、Esc、点遮罩）：当作没验证过 ——
       不切步骤、不碰页面，也不换控件。 */
    if (fromDialog && !captchaOpenRef.current) return

    /* 两种验证码的令牌都只有一次有效：判定一旦发出，这枚令牌就作废，因此每一次都换一轮控件，
       且只动验证码这一项 —— 清空输入框、重新取图（人机验证重新领令牌），表单其它部分不动。
       成功时同样换轮：下一次打开弹窗要拿到全新的令牌，不能带上这一枚用过的。 */
    setCaptcha('')
    setCaptchaId('')
    setCaptchaRound((value) => value + 1)

    if (!result?.ok) return
    /* 成功：关闭弹窗，表单界面切到锁定邮箱加密码 */
    setTouched({})
    afterVerify(result.value)
  }

  async function onContinue(event: FormEvent) {
    event.preventDefault()
    if (!accountValid) {
      setTouched((value) => ({ ...value, account: true }))
      return
    }
    /* 配置要求验证码时先弹窗收；不要求就直接判定 */
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

  /** 登录成功后的收尾：邀请码与多因素分支回页面，其余交给域收尾。 */
  async function settleLogin(value: EntryAuthResponse) {
    const status = value.status
    if (status === 'invite_verification_required' || status === 'invite_required') {
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
    await complete(value)
  }

  async function onSubmitPassword(event: FormEvent) {
    event.preventDefault()
    if (password === '') {
      setTouched((value) => ({ ...value, password: true }))
      return
    }
    const result = await loginCall.run()
    if (!result?.ok) return
    await settleLogin(result.value)
  }

  async function onRedeemInvite(event: FormEvent) {
    event.preventDefault()
    if (inviteCode.trim() === '') return
    const result = await inviteCall.run()
    if (!result?.ok) return
    await complete(result.value)
  }

  /* 失败落在**对应的字段**上，不挂在页面顶端当通知：判定失败属于验证码那一项，
     登录失败属于密码那一项，邀请码失败属于邀请码那一项；只有第三方入口没有对应字段，
     仍按页面级提示呈现。文案由取数层按错误码翻好，必要时再按服务端描述细分。 */
  const verifyFailure = verifyCall.state.status === 'error' ? verifyCall.state.failure.text : undefined
  const loginFailure = loginCall.state.status === 'error' ? loginCall.state.failure.text : undefined
  const inviteFailure = inviteCall.state.status === 'error' ? inviteCall.state.failure.text : undefined
  const providerFailure = providerCall.state.status === 'error' ? providerCall.state.failure.text : undefined

  /* 页脚（去注册）两支共用：配置未到时也要在，卡片高度才与到达后一致 */
  const footnote = (
    <>
      <span>{t('auth.footnote.prefix')}</span>{' '}
      <Link href={appHref('/register')}>{t('auth.footnote.link')}</Link>
    </>
  )

  if (!config) {
    return (
      <AuthLayout
        titleLines={[t('auth.login.titleLine1'), t('auth.login.titleLine2')]}
        onBack={() => window.history.back()}
        footnote={footnote}
      >
        {/* 入口配置未到：卡片**照配置到达后的结构先铺一遍**（两行三方入口 + 分隔线 + 账号字段 + 主按钮），
            入口那一块在转。高度因此与到达后一致（用同一批组件与同一套间距规则），内容不会先塌后撑；
            只给「入口块」一个高度下限是不够的，卡片其余部分同样要预先在位。
            除加载指示外一律 `aria-hidden`：它们是**装饰**，不能让占位框占用真字段的无障碍名字
            （否则按名字找字段会先命中这个禁用框，读屏也会念到两个同名字段）。 */}
        <div className="login__form" aria-busy="true">
          <div className="login__loading" role="status" aria-live="polite">
            <Spinner />
            <span className="login__loading-text">{t('auth.login.loading')}</span>
          </div>
          <p className="login__or" aria-hidden="true">
            {t('auth.or')}
          </p>
          <div aria-hidden="true">
            <Input
              id="auth-loading-account"
              placeholder={t('auth.field.account')}
              icon={<Icon name="i-mail" />}
              value=""
              onChange={() => undefined}
              disabled
              size="large"
            />
          </div>
          <div aria-hidden="true">
            <Button type="button" variant="inverse" block size="large" disabled tabIndex={-1}>
              {t('auth.action.continue')}
            </Button>
          </div>
        </div>
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
      footnote={footnote}
    >
      {/* 页面级提示只用于没有对应字段的失败（第三方入口），以及域给出的告知（多因素、选团队） */}
      {!captchaOpen && providerFailure ? <StatusNotice tone="danger" text={providerFailure} /> : null}
      {!captchaOpen && auth.notice ? <StatusNotice tone={auth.notice.tone} text={auth.notice.text} /> : null}

      <form
        className="login__form"
        onSubmit={auth.phase === 'invite' ? onRedeemInvite : accountLocked ? onSubmitPassword : onContinue}
      >
        {/* 账号步：还没验证过，账号可改 */}
        {auth.phase !== 'invite' && !accountLocked ? (
          <>
            {config.third_party?.providers?.length ? (
              <>
                <ProviderList
                  providers={config.third_party.providers}
                  onPick={(provider: SigninProvider) => void onPickProvider(provider.id)}
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
              /* 配置不要求验证码时，判定直接在账号步发出，判定失败就落在账号字段上 */
              error={accountError ?? (captchaRequired ? undefined : verifyFailure)}
              disabled={busy}
              /* 独立访问是有意弱化边界（与草稿一致，对外入口页追求轻观感）；客户端内取达标档 */
              strong={inApp}
              size="large"
            />

            <Button type="submit" variant="inverse" block size="large" disabled={busy}>
              {t('auth.action.continue')}
            </Button>
          </>
        ) : null}

        {/* 密码步：验证通过过，邮箱锁定；要改只能点同一行里的「修改」（那一行是页内部件） */}
        {accountLocked ? (
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
              autoComplete="current-password"
              value={password}
              onValueChange={setPassword}
              /* 密码的校验只在提交时做：这里的失焦发生在用户去点「修改」或「登录」的时候，
                 失焦即插入一行错误文案会把按钮从指针下挪走（实测：表单一瞬间长高 26px、
                 按钮上移 13px，按下与松开落在不同元素上，`click` 根本不发生），这一次点击就丢了。 */
              error={passwordError ?? loginFailure}
              disabled={busy}
              strong={inApp}
              size="large"
              autoFocus
            />

            {config.form?.remember_me ? (
              <Checkbox
                id="auth-remember"
                label={t('auth.remember')}
                checked={remember}
                onCheckedChange={setRemember}
                disabled={busy}
              />
            ) : null}

            <Button type="submit" variant="inverse" block size="large" disabled={submitting}>
              {t('auth.action.login')}
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

      {/* 验证码在一个弹窗里收，确定后回到页面上的密码步；底部主按钮用 form 属性关联到弹窗里的表单 */}
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
