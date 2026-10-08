import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Link } from '@/components/base/link'
import { Spinner } from '@/components/base/spinner'
import { useRequest } from '@/data'
import { oauthCallbackQuery, type EntryAuthResponse } from '@/data/user'
import { appHref } from '@/platform/router/basename'
import { useTranslation } from '@/platform/i18n'
import { useDocumentTitle } from '@/platform/document-title'
import { AuthLayout } from '../components/auth-layout'
import { StatusNotice } from '../components/status-notice'
import { useAuth } from '../use-auth'
import { useCompleteSignIn } from '../use-complete-sign-in'
import './back.less'

/**
 * 第三方登录的回跳页（`/auth/back/<提供方>`）。
 *
 * 授权发起时把回跳地址指到这一页，提供方回来时地址里带 `code` 与 `state`（拒绝时带 `error` 与 `error_description`）。
 * 这一页把它们交给引擎的 `oauthCallback` 换会话，再走与账号登录相同的收尾：需要邀请码或多因素时回登录页，
 * 其余交给域收尾（验签、采纳会话、按成功地址跳转）。地址参数是一次性的，因此请求只在挂载时发一次。
 *
 * 失败分三处呈现：地址里带着提供方的拒绝、地址参数不全、接口失败；三者都停在卡片上并给回登录页的入口。
 */
export function BackPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const complete = useCompleteSignIn()
  const config = auth.config
  const navigate = useNavigate()
  const { provider = '' } = useParams()
  useDocumentTitle(t('auth.back.docTitle'))

  /* 只读一次地址：之后重渲染不再改变请求入参，避免一次性的 code 被重发 */
  const params = useRef(new URLSearchParams(useLocation().search)).current
  const code = params.get('code') ?? ''
  const state = params.get('state') ?? ''
  const denied = params.get('error') ?? ''
  const description = params.get('error_description') ?? ''

  const [outcome, setOutcome] = useState<'pending' | 'done' | 'failed'>('pending')
  /* 地址决定的三类停摆（提供方拒绝、参数不全）：挂载时定下，之后不再改 */
  const [localError] = useState(
    denied ? description || t('auth.back.failed') : !provider || !code || !state ? t('auth.back.missing') : '',
  )
  const started = useRef(false)

  const callbackCall = useRequest(oauthCallbackQuery(provider, { code, state }), { manual: true })

  useEffect(() => {
    if (started.current || localError) return
    /* 等入口配置到位再换：收尾要用它的成功地址与安全 Cookie 规则，而 code 只能用一次，
       因此不能在配置还没到时先拿缺省规则把它用掉。等待期间页面停在加载态。 */
    if (!config) return
    started.current = true
    void run()
    /* 只跑一次：code 与 state 一用即废，重挂不重发（依赖只有入口配置，故不再列其它） */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  async function run() {
    const result = await callbackCall.run()
    if (!result?.ok) {
      setOutcome('failed')
      return
    }
    await settle(result.value)
  }

  /** 与账号登录共用一套分支：邀请码与多因素回登录页，其余交给域收尾。 */
  async function settle(value: EntryAuthResponse) {
    const status = value.status
    if (status === 'invite_verification_required' || status === 'invite_required') {
      auth.enterInvite(value.access_token || auth.tempToken)
      navigate('/login')
      return
    }
    if (status === 'mfa_required' || status === 'team_selection_required') {
      auth.setNotice({
        tone: 'info',
        text: t(status === 'mfa_required' ? 'auth.notice.mfa' : 'auth.notice.team'),
      })
      navigate('/login')
      return
    }
    const ok = await complete(value)
    setOutcome(ok ? 'done' : 'failed')
  }

  const requestError = callbackCall.state.status === 'error' ? callbackCall.state.failure.text : ''
  /* 入口配置取失败时不再停在加载态：这一次的 code 用不上了，直接给失败与回登录入口 */
  const configError = auth.configFailed && !config ? t('auth.back.failed') : ''
  const errorText =
    localError || requestError || configError || (outcome === 'failed' ? auth.notice?.text || t('auth.back.failed') : '')

  return (
    <AuthLayout
      titleLines={[t('auth.back.docTitle'), '']}
      onBack={() => window.history.back()}
      footnote={
        errorText ? <Link href={appHref('/login')}>{t('auth.back.backToLogin')}</Link> : null
      }
    >
      {errorText ? (
        <StatusNotice tone="danger" text={errorText} />
      ) : (
        <div className="back__state" aria-busy={outcome === 'pending'} role="status" aria-live="polite">
          {outcome === 'pending' ? <Spinner /> : null}
          <span className="back__state-text">{outcome === 'done' ? t('auth.back.success') : t('auth.back.loading')}</span>
        </div>
      )}
    </AuthLayout>
  )
}
