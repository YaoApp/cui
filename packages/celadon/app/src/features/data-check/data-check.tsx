import './data-check.less'
/* **数据层验证页**（`/data-check`）：把 `app/src/data/` 那条路在界面上跑通，让人看得见结果。
 *
 * 三节：
 *   ① 登录（测试模式）—— `@/data/test` 的用户列表与两种测试登录，之后受保护的两格才有凭据
 *   ② 脚手架四格 —— `@/data/helloworld` 的 公开/受保护 × GET/POST，点一下跑一次，各格显示自己的 state
 *   ③ 请求四态 —— `useRequest` 的 idle / loading / ok / error，拿公开 GET 当**声明**，**挂载即跑**
 *
 * **取数只有一条路**（`05-data-and-api.md` §1）：页面里没有裸的 `send` 调用 —— 接口声明交给 `useRequest`，
 * 状态从钩子的 `state` 读，失败上屏用 `state.failure.text`（钩子已按码翻译成一句话）。
 *
 * **秘密不上屏**：只印接口返回的值，从不读凭据，也不印请求头（凭据由出口自己带，见 17-transport.md）；
 * 登录那节只显示凭据的**存在性与长度**，不显示值。
 *
 * **登录成功 ≠ 被允许**：受保护接口还要过引擎的授权策略 —— 带着凭据仍回 403 时，
 * 标注换成"已认证但未被授权"，（引擎原文不上屏）。 */

import { type ReactNode, useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { Header } from '@/components/header'
import { Nav } from '@/components/nav'
import { useTranslation } from '@/platform/i18n'
import { usePageTitle } from '@/platform/router/use-page-title'
import { navWithActive } from '@/platform/utils/nav'
import { useRequest, type RequestState } from '@/data'
import {
  protectedGetQuery,
  protectedPostQuery,
  publicGetQuery,
  publicPostQuery,
} from '@/data/helloworld'
import { listUsersQuery, loginQuery, type TestUser } from '@/data/test'
import { failureText } from '@/platform/i18n'
import { logoutQuery } from '@/data/user'
import { readServiceAddress, writeServiceAddress } from '@/platform/service'
import { client, useLocalePreference, useThemePreference } from '@/platform/client'

/** POST 的请求体（引擎会原样回显在 `POST_PAYLOAD` 里）—— 技术样本，不走语言包。 */
const POST_BODY = { from: 'data-check' }

/** 用户列表的取数参数：一页 20 个（引擎上限 100），只把前几个上屏。 */
const USER_PAGE = { page: 1, pagesize: 20 }

/** 用户列表最多上屏几个 —— 只是给人看的样本，不参与取数。 */
const USER_SAMPLE_SIZE = 3

/** 标签 + 值的一格：语言 · 主题与四格结果共用同一段标记。 */
function Cell({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <span className="data-check__cell">
      <span className="data-check__label">{label}</span>
      <code>{value}</code>
      {children}
    </span>
  )
}

export function DataCheckPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navItems = navWithActive(pathname).map((item) => ({ ...item, label: t(item.label) }))
  usePageTitle(t('dataCheck.title'))

  /* 请求元数据：页面**不拼、不传** —— `send` 调用时自己从平台层取当前值
     （`platform/client/context.ts` 的 `currentPreferences()`），每次请求自动带上。
     这里只是把平台解析出的当前值显示出来，好让人看见请求带的是什么。 */
  const { locale } = useLocalePreference()
  const { theme } = useThemePreference()

  /** 一句话说清一个 state：成功印值，失败印钩子已经翻译好的文案。 */
  const stateText = (state: RequestState<unknown>) => {
    if (state.status === 'idle') return t('dataCheck.stateIdle')
    if (state.status === 'loading') return t('dataCheck.stateLoading')
    if (state.status === 'ok') return `${t('dataCheck.ok')}: ${JSON.stringify(state.value)}`
    return state.failure.text
  }

  /* ① 登录（测试模式）：三份声明各写各的，点一下跑一次；key 由域层 `queries.ts` 收口。
     发送的输入就是请求体（`{ user }`），地址与 key 都不在这里拼。 */
  const listUsersCall = useRequest(listUsersQuery(USER_PAGE), { manual: true })
  const loginCall = useRequest(loginQuery(), { manual: true })
  const logoutCall = useRequest(logoutQuery(), { manual: true })
  /** 最近一次做登录的邮箱 —— 只用来标注结果是哪个账号的，不是凭据。 */
  const [loginEmail, setLoginEmail] = useState('')

  /* ② 脚手架四格：**各写各的声明**，点一下跑一次；key 由域层 `keys.ts` 给 ——
     与失效侧 `invalidate()` 用同一套算法，前缀对得上。 */
  const publicGetCall = useRequest(publicGetQuery(), { manual: true })
  const publicPostCall = useRequest(publicPostQuery(), { body: POST_BODY, manual: true })
  const protectedGetCall = useRequest(protectedGetQuery(), { manual: true })
  const protectedPostCall = useRequest(protectedPostQuery(), { body: POST_BODY, manual: true })

  /* ③ 四态：`useRequest` **挂载即跑**（不传 `manual`）、卸载即取消。公开 GET 当声明 ——
     `send` 自动带上当前请求元数据；公开的那两条不挑凭据。 */
  const scaffold = useRequest(publicGetQuery())

  /* 登录成功后浏览器收下 Cookie（`login/web` 的 `SameSite=Strict`，dev 下应用与引擎同源）；
     再点下面受保护的两格，出口自己就会带上它 —— 这里不读、不碰凭据。 */
  const users =
    listUsersCall.state.status === 'ok' ? listUsersCall.state.value.data.slice(0, USER_SAMPLE_SIZE) : []
  const login = loginCall.state.status === 'ok' ? loginCall.state.value : null


  /* **服务地址只有客户端能改**（Web 不能换服务）：这里用与验证页同一套平台调用，
     其余行为两边一模一样 —— 业务不判宿主，只有这一段是宿主能力。 */
  const canSetAddress = client.capabilities.serviceAddress
  const [serviceUrl, setServiceUrl] = useState('')
  const [serviceNotice, setServiceNotice] = useState('')
  const readAddress = useCallback(async () => {
    const result = await readServiceAddress()
    if (result.ok) {
      setServiceUrl(result.value)
      setServiceNotice('')
    } else setServiceNotice(failureText(result))
  }, [])
  const saveAddress = useCallback(async () => {
    const result = await writeServiceAddress(serviceUrl.trim())
    if (result.ok) {
      setServiceUrl(result.value)
      setServiceNotice('')
      // 换地址 = 换服务：页面上的登录态与退出态一起作废（平台那侧的缓存由 writeServiceAddress 作废）
      loginCall.reset()
      logoutCall.reset()
      setLoginEmail('')
    } else setServiceNotice(failureText(result))
  }, [serviceUrl])

  /** 登录态：取到过凭据 **且没退出成功** —— 退出由服务端吊销并清 Cookie，退完就不再是登录态。 */
  const signedIn = login !== null && logoutCall.state.status !== 'ok'

  /** 认证类拒绝的码：登录态下被拒 = 已认证但未被授权（引擎侧授权策略，不是客户端问题）。 */
  const authRefusal = /forbidden|insufficient_scope|unauthorized|token_missing|invalid_token/i
  /* 登录后仍被拒 = 已认证但未被授权（引擎的授权策略）*/
  const deniedAfterLogin = (state: RequestState<unknown>) =>
    signedIn && state.status === 'error' && authRefusal.test(state.failure.code)

  /* **业务层只认识"登录"**：选哪条端点、令牌存哪儿，都是数据层那个动作的事 */
  const signIn = (user: TestUser) => {
    if (!user.email) return
    logoutCall.reset() // 上一次"已退出"到此为止
    void loginCall.run({ user: user.email })
    setLoginEmail(user.email)
  }

  const cells = [
    { label: t('dataCheck.publicGet'), state: publicGetCall.state, expected: false },
    { label: t('dataCheck.publicPost'), state: publicPostCall.state, expected: false },
    { label: t('dataCheck.protectedGet'), state: protectedGetCall.state, expected: true },
    { label: t('dataCheck.protectedPost'), state: protectedPostCall.state, expected: true },
  ]

  const states = [
    ['idle', t('dataCheck.stateIdle')],
    ['loading', t('dataCheck.stateLoading')],
    ['ok', t('dataCheck.stateOk')],
    ['error', t('dataCheck.stateError')],
  ] as const

  return (
    <div className="data-check">
      <Header title={t('dataCheck.title')}>
        <Nav items={navItems} label={t('nav.appLabel')} localeSwitch onSelect={(item) => navigate(item.href)} />
      </Header>
      <main className="data-check__body">

      <div className="data-check__actions">
        <Button variant="ghost" onClick={() => navigate(-1)}>{t('dataCheck.back')}</Button>
      </div>

      {/* 服务地址：**只有客户端打开才有这一段**（Web 不能换服务；宿主不持有时地址也不该由页面填）。
          其余行为两边一致 —— 页面本身不判"接下来怎么请求"。 */}
      {canSetAddress ? (
        <>
          <h2 className="data-check__heading">{t('verify.serviceAddress')}</h2>
          <p>{t('verify.serviceAddressHint')}</p>
          <p className="data-check__tools">
            <input
              type="text"
              aria-label={t('verify.serviceAddress')}
              value={serviceUrl}
              onChange={(event) => setServiceUrl(event.target.value)}
            />
            <Button onClick={() => void readAddress()}>{t('verify.serviceGet')}</Button>
            <Button onClick={() => void saveAddress()} disabled={!serviceUrl.trim()}>{t('verify.serviceSet')}</Button>
          </p>
          {serviceNotice ? <p className="data-check__notice">{serviceNotice}</p> : null}
        </>
      ) : null}
      {/* ① 登录（测试模式）：只在开发实例上注册；页面只用 useRequest + 域层 query —— 不出现裸 send / key */}
      <h2 className="data-check__heading">{t('dataCheck.loginTest')}</h2>
      <p>{t('dataCheck.loginTestHint')}</p>
      <p>{t('dataCheck.listUsersHint')}</p>
      <p className="data-check__tools">
        <Button onClick={() => void listUsersCall.run()} disabled={listUsersCall.state.status === 'loading'}>{t('dataCheck.listUsers')}</Button>
      </p>
      {listUsersCall.state.status === 'error' ? (
        <p className="data-check__notice" role="status">{listUsersCall.state.failure.text}</p>
      ) : null}
      {users.length > 0 ? (
        <div className="data-check__tablewrap">
          <table className="data-check__users">
            <thead>
              <tr>
                <th>{t('dataCheck.fieldId')}</th>
                <th>{t('dataCheck.fieldUserId')}</th>
                <th>{t('dataCheck.fieldEmail')}</th>
                <th>{t('dataCheck.fieldName')}</th>
                <th>{t('dataCheck.fieldPreferredUsername')}</th>
                <th>{t('dataCheck.fieldStatus')}</th>
                <th>{t('dataCheck.fieldRoleId')}</th>
                <th>{t('dataCheck.fieldTypeId')}</th>
                <th>{t('dataCheck.fieldEmailVerified')}</th>
                <th>{t('dataCheck.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.user_id}</td>
                  <td>{user.email ?? ''}</td>
                  <td>{user.name ?? ''}</td>
                  <td>{user.preferred_username ?? ''}</td>
                  <td>{user.status ?? ''}</td>
                  <td>{user.role_id ?? ''}</td>
                  <td>{user.type_id ?? ''}</td>
                  <td>{user.email_verified ? t('dataCheck.emailVerified') : t('dataCheck.emailUnverified')}</td>
                  <td className="data-check__actions">
                    {user.email ? (
                      <>
                        <Button
                            onClick={() => signIn(user)}
                            disabled={loginCall.state.status === 'loading' || logoutCall.state.status === 'loading'}
                          >
                            {t('dataCheck.loginAction')}
                          </Button>
                      </>
                    ) : (
                      <span className="data-check__label">{t('dataCheck.noEmailForLogin')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p>{t('dataCheck.loginHint')}</p>
      {/* 退出：Cookie 是 HttpOnly（JS 碰不到）→ 只能由服务端吊销并清掉（`POST /user/logout`） */}
      {signedIn ? (
        <p className="data-check__tools">
          <Button
            onClick={() =>
              void logoutCall.run().then((result) => {
                  // 服务端吊销成功后再清本地那把（顺序不能反）—— 仍在动作里，不写副作用
                // 服务端已吊销并清 Cookie：两边的旧登录结果都不能再代表"已登录"
                // 服务端吊销成功才算退出：失败时页面仍应算登录态
                if (result?.ok) loginCall.reset()
              })
            }
            disabled={logoutCall.state.status === 'loading'}
          >{t('dataCheck.signOut')}</Button>
        </p>
      ) : null}
      {logoutCall.state.status === 'ok' ? (
        <p className="data-check__value" role="status">{t('dataCheck.signOutDone')}</p>
      ) : null}
      {logoutCall.state.status === 'error' ? (
        <p className="data-check__notice" role="status">{logoutCall.state.failure.text}</p>
      ) : null}
      {/* 凭据**只上长度与存在性**，值永不上屏 */}
      {signedIn && login ? (
        <p className="data-check__value" role="status">
          {t('dataCheck.loginResult', { email: loginEmail })}
          {' · '}
          <span className="data-check__label">{`access ${login.access_token?.length ?? 0} · refresh ${login.refresh_token?.length ?? 0} · expires ${login.expires_in ?? '—'}`}</span>
        </p>
      ) : null}
      {loginCall.state.status === 'error' ? (
        <p className="data-check__notice" role="status">{loginCall.state.failure.text}</p>
      ) : null}

      {/* ② 脚手架四格：公开的两条真跑；受保护的两条也点得动，登录成功后就会通 */}
      <h2 className="data-check__heading">{t('dataCheck.scaffold')}</h2>
      <p>{t('dataCheck.scaffoldHint')}</p>
      <p>{t('dataCheck.authzHint')}</p>
      <div className="data-check__row">
        <Cell label={t('dataCheck.locale')} value={locale} />
        <Cell label={t('dataCheck.theme')} value={theme} />
      </div>
      <p className="data-check__tools">
        <Button onClick={() => void publicGetCall.run()} disabled={publicGetCall.state.status === 'loading'}>{t('dataCheck.publicGet')}</Button>{' '}
        <Button onClick={() => void publicPostCall.run()} disabled={publicPostCall.state.status === 'loading'}>{t('dataCheck.publicPost')}</Button>{' '}
        <Button onClick={() => void protectedGetCall.run()} disabled={protectedGetCall.state.status === 'loading'}>{t('dataCheck.protectedGet')}</Button>{' '}
        <Button onClick={() => void protectedPostCall.run()} disabled={protectedPostCall.state.status === 'loading'}>{t('dataCheck.protectedPost')}</Button>
      </p>
      {/* 每格直接渲染自己的 state：成功印返回值，失败印译文；受保护的两条按登录与否标注
          "未登录（缺凭据）" 或 "已认证但未被授权"（Cookie 登录后仍被引擎策略拒绝时） */}
      <div className="data-check__row">
        {cells.map(({ label, state, expected }) => (
          <Cell key={label} label={label} value={stateText(state)}>
            {expected && state.status === 'error' ? (
              deniedAfterLogin(state) ? (
                <em className="data-check__expected">{t('dataCheck.authenticatedDenied')}</em>
              ) : !signedIn ? (
                <em className="data-check__expected">{t('dataCheck.expectedFailure')}</em>
              ) : null
            ) : null}
          </Cell>
        ))}
      </div>

      {/* ③ 请求四态：当前态高亮；成功印值，失败印按码翻译的文案 */}
      <h2 className="data-check__heading">{t('dataCheck.states')}</h2>
      <p>{t('dataCheck.statesHint')}</p>
      <div className="data-check__row">
        {states.map(([status, label]) => (
          <span className="data-check__state" key={status} data-active={scaffold.state.status === status}>
            <span className="data-check__label">{label}</span>
          </span>
        ))}
      </div>
      <p className="data-check__tools">
        <Button onClick={() => void scaffold.run()} disabled={scaffold.state.status === 'loading'}>{t('dataCheck.reload')}</Button>
      </p>
      {scaffold.state.status === 'ok' ? (
        <p className="data-check__value">{JSON.stringify(scaffold.state.value)}</p>
      ) : null}
      {scaffold.state.status === 'error' ? (
        <p className="data-check__notice" role="status">
          {scaffold.state.failure.text}
        </p>
      ) : null}
      </main>
    </div>
  )
}
