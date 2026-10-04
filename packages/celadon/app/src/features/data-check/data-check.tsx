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
 * 标注换成"已认证但未被授权"，并附上引擎给的 `reason`（`state.failure.rawMessage`，不新增传输逻辑）。 */

import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { Header } from '@/components/header'
import { Nav } from '@/components/nav'
import { useTranslation } from '@/platform/i18n'
import { resolvePreference, useLocaleStore } from '@/platform/i18n/locale.store'
import { useThemeStore } from '@/platform/theme/theme.store'
import { usePageTitle } from '@/platform/router/use-page-title'
import { navWithActive } from '@/platform/utils/nav'
import { useRequest, type RequestState } from '@/data'
import {
  protectedGetQuery,
  protectedPostQuery,
  publicGetQuery,
  publicPostQuery,
} from '@/data/helloworld'
import { listUsersQuery, loginTokenQuery, loginWebQuery, type TestUser } from '@/data/test'
import { logoutQuery } from '@/data/user'

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
  const locale = resolvePreference(useLocaleStore((state) => state.locale))
  const theme = useThemeStore((state) => state.theme)

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
  const loginWebCall = useRequest(loginWebQuery(), { manual: true })
  const loginTokenCall = useRequest(loginTokenQuery(), { manual: true })
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
     `send` 自动带上当前请求元数据，它不挑凭据，登录还没接也照样通。 */
  const scaffold = useRequest(publicGetQuery())

  /* 登录成功后浏览器收下 Cookie（`login/web` 的 `SameSite=Strict`，dev 下应用与引擎同源）；
     再点下面受保护的两格，出口自己就会带上它 —— 这里不读、不碰凭据。 */
  const users =
    listUsersCall.state.status === 'ok' ? listUsersCall.state.value.data.slice(0, USER_SAMPLE_SIZE) : []
  const webLogin = loginWebCall.state.status === 'ok' ? loginWebCall.state.value : null
  const tokenLogin = loginTokenCall.state.status === 'ok' ? loginTokenCall.state.value : null

  /** 已登录、却仍被引擎拒：`login/web` 成功 **且** 这一格失败 **且** 失败码是 forbidden / unauthorized。
   *  这时"预期失败"就不成立了 —— 是"已认证、未被授权"（引擎侧授权策略，不是客户端问题）。 */
  const deniedAfterLogin = (state: RequestState<unknown>) =>
    webLogin !== null && state.status === 'error' && /forbidden|unauthorized/i.test(state.failure.code)

  /** 一格的显示值：成功印值，失败印钩子按码翻译好的文案；被策略拒绝时把引擎给的 reason 补在后面。 */
  const stateValue = (state: RequestState<unknown>) => {
    if (state.status !== 'error' || !deniedAfterLogin(state)) return stateText(state)
    const reason = state.failure.rawMessage
    return reason && !state.failure.text.includes(reason) ? `${state.failure.text} · ${reason}` : state.failure.text
  }

  const signIn = (user: TestUser, kind: 'web' | 'token') => {
    if (!user.email) return
    setLoginEmail(user.email)
    if (kind === 'web') void loginWebCall.run({ user: user.email })
    else void loginTokenCall.run({ user: user.email })
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
                        <Button onClick={() => signIn(user, 'web')} disabled={loginWebCall.state.status === 'loading'}>{t('dataCheck.loginWeb')}</Button>{' '}
                        <Button onClick={() => signIn(user, 'token')} disabled={loginTokenCall.state.status === 'loading'}>{t('dataCheck.loginToken')}</Button>
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
      {webLogin || tokenLogin ? (
        <p className="data-check__tools">
          <Button onClick={() => void logoutCall.run()} disabled={logoutCall.state.status === 'loading'}>{t('dataCheck.signOut')}</Button>
        </p>
      ) : null}
      {logoutCall.state.status === 'ok' ? (
        <p className="data-check__value" role="status">{t('dataCheck.signOutDone', { message: logoutCall.state.value.message })}</p>
      ) : null}
      {logoutCall.state.status === 'error' ? (
        <p className="data-check__notice" role="status">{logoutCall.state.failure.text}</p>
      ) : null}
      {/* 凭据**只上长度与存在性**，值永不上屏 */}
      {webLogin ? (
        <p className="data-check__value" role="status">
          {t('dataCheck.loginWebResult', {
            email: loginEmail,
            status: webLogin.status,
            minutes: Math.round(webLogin.expires_in / 60),
          })}
          {' · '}
          {t('dataCheck.credentials', {
            session: webLogin.session_id.length,
            access: webLogin.access_token.length,
            refresh: webLogin.refresh_token.length,
          })}
        </p>
      ) : null}
      {loginWebCall.state.status === 'error' ? (
        <p className="data-check__notice" role="status">{loginWebCall.state.failure.text}</p>
      ) : null}
      {tokenLogin ? (
        <p className="data-check__value" role="status">
          {t('dataCheck.loginTokenResult', { email: loginEmail, length: tokenLogin.access_token.length })}
        </p>
      ) : null}
      {loginTokenCall.state.status === 'error' ? (
        <p className="data-check__notice" role="status">{loginTokenCall.state.failure.text}</p>
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
          "预期失败（还没登录）" 或 "已认证但未被授权"（登录成功仍被引擎策略拒绝时） */}
      <div className="data-check__row">
        {cells.map(({ label, state, expected }) => (
          <Cell key={label} label={label} value={stateValue(state)}>
            {expected && state.status === 'error' ? (
              deniedAfterLogin(state) ? (
                <em className="data-check__expected">{t('dataCheck.authenticatedDenied')}</em>
              ) : webLogin === null ? (
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
