import './data-check.less'
/* **数据层验证页**（`/data-check`）：把 `app/src/data/` 那条路在界面上跑通，让人看得见结果。
 *
 * 两节：
 *   ① 脚手架四格 —— `@/data/helloworld` 的 公开/受保护 × GET/POST，点一下跑一次，各格显示自己的 state
 *   ② 请求四态 —— `useRequest` 的 idle / loading / ok / error，拿公开 GET 当**声明**，**挂载即跑**
 *
 * **取数只有一条路**（`05-data-and-api.md` §1）：页面里没有裸的 `send` 调用 —— 接口声明交给 `useRequest`，
 * 状态从钩子的 `state` 读，失败上屏用 `state.failure.text`（钩子已按码翻译成一句话）。
 *
 * **现在只有公开接口能通**：登录还没接，受保护的两条**预期失败**，页面上明确标注 —— 那不是 bug。
 * **秘密不上屏**：只印接口返回的值，从不读凭据，也不印请求头（凭据由出口自己带，见 17-transport.md）。 */

import type { ReactNode } from 'react'
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

/** POST 的请求体（引擎会原样回显在 `POST_PAYLOAD` 里）—— 技术样本，不走语言包。 */
const POST_BODY = { from: 'data-check' }

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

  /* 请求元数据：页面**不拼、不传** —— `send()` 调用时自己从平台层取当前值
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

  /* ① 脚手架四格：**各写各的声明**，点一下跑一次；key 由域层 `keys.ts` 给 ——
     与失效侧 `invalidate()` 用同一套算法，前缀对得上。 */
  const publicGetCall = useRequest(publicGetQuery(), { manual: true })
  const publicPostCall = useRequest(publicPostQuery(), { body: POST_BODY, manual: true })
  const protectedGetCall = useRequest(protectedGetQuery(), { manual: true })
  const protectedPostCall = useRequest(protectedPostQuery(), { body: POST_BODY, manual: true })

  /* ② 四态：`useRequest` **挂载即跑**（不传 `manual`）、卸载即取消。公开 GET 当声明 ——
     `send()` 自动带上当前请求元数据，它不挑凭据，登录还没接也照样通。 */
  const scaffold = useRequest(publicGetQuery())

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

      {/* ① 脚手架四格：公开的两条真跑；受保护的两条也点得动，但登录还没接 —— **预期失败** */}
      <h2 className="data-check__heading">{t('dataCheck.scaffold')}</h2>
      <p>{t('dataCheck.scaffoldHint')}</p>
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
      {/* 每格直接渲染自己的 state：成功印返回值，失败印译文，受保护的两条标出"预期失败" */}
      <div className="data-check__row">
        {cells.map(({ label, state, expected }) => (
          <Cell key={label} label={label} value={stateText(state)}>
            {expected && state.status === 'error' ? (
              <em className="data-check__expected">{t('dataCheck.expectedFailure')}</em>
            ) : null}
          </Cell>
        ))}
      </div>

      {/* ② 请求四态：当前态高亮；成功印值，失败印按码翻译的文案 */}
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
