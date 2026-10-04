import './data-check.less'
/* **数据层验证页**（`/data-check`）：把 `app/src/data/` 那条路在界面上跑通，让人看得见结果。
 *
 * 四节：
 *   ① 服务信息 —— 手动 `useRequest`（fetcher 里 `loadServiceInfo` 读 10s），点按钮才读
 *   ② 脚手架四格 —— `@/data/helloworld` 的 公开/受保护 × GET/POST，四格各一个手动 `useRequest`，点一下才跑
 *   ③ 请求四态 —— `useRequest` 的 idle / loading / ok / error，拿公开 GET 当 fetcher，**挂载即跑**
 *   ④ 结果区 —— 每次落定的调用结果按行列出
 *
 * **取数只有一条路**（`05-data-and-api.md` §1）：页面里没有裸的 `send` / `loadServiceInfo` 调用 ——
 * 它们只在 `useRequest` 的 fetcher 参数里出现；状态从钩子的 `state` 读。
 *
 * **现在只有公开接口能通**：登录还没接，受保护的两条**预期失败**，页面上明确标注 —— 那不是 bug。
 *
 * 失败一律显示**按码翻译过的文案**（`bridgeErrorText`），与 `verify` 页同一套规矩。
 * **秘密不上屏**：结果区只印接口返回的值，从不读凭据，也不印请求头（凭据由出口自己带，见 17-transport.md）。 */

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { Header } from '@/components/header'
import { Nav } from '@/components/nav'
import { useTranslation } from '@/platform/i18n'
import { resolvePreference, useLocaleStore } from '@/platform/i18n/locale.store'
import { useThemeStore } from '@/platform/theme/theme.store'
import { usePageTitle } from '@/platform/router/use-page-title'
import { navWithActive } from '@/platform/utils/nav'
import { bridgeErrorText } from '@/platform/bridge'
import { loadServiceInfo, type ServiceInfo } from '@/platform/service'
import { send, useRequest, type RequestState, type Result } from '@/data'
import { protectedGet, protectedPost, publicGet, publicPost } from '@/data/helloworld'

/** 结果区的一行：标签 · 文案 · 是不是"预期失败"（受保护的两条）。 */
type Line = { id: number; label: string; text: string; expected: boolean }

/** POST 的请求体（引擎会原样回显在 `POST_PAYLOAD` 里）—— 技术样本，不走语言包。 */
const POST_BODY = { from: 'data-check' }

export function DataCheckPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navItems = navWithActive(pathname).map((item) => ({ ...item, label: t(item.label) }))
  usePageTitle(t('dataCheck.title'))

  /* `bridgeErrorText` 收的是"按任意 key 取文案"的函数；i18n 的 t 是**严格 key 类型**，
     这里做一次适配（码是运行期的，类型系统管不到）—— 与 `verify.tsx` 逐字一致。 */
  const translate = (key: string, options?: Record<string, unknown>) =>
    i18n.t(key as never, options as never) as unknown as string

  /* 请求元数据：页面**不拼、不传** —— `send()` 调用时自己从平台层取当前值
     （`platform/client/context.ts` 的 `currentPreferences()`），每次请求自动带上。
     这里只是把平台解析出的当前值显示出来，好让人看见请求带的是什么。 */
  const locale = resolvePreference(useLocaleStore((state) => state.locale))
  const theme = useThemeStore((state) => state.theme)

  const [lines, setLines] = useState<Line[]>([])
  const nextId = useRef(0)

  /** 一次调用的结果：成功显示值，失败显示**翻译过的**文案（缺翻译时回退诊断并告警）。 */
  const report = (label: string, result: Result<unknown>, expected = false) => {
    const text = result.ok
      ? `${t('dataCheck.ok')}: ${JSON.stringify(result.value)}`
      : bridgeErrorText(translate, result)
    nextId.current += 1
    const line: Line = { id: nextId.current, label, text, expected }
    setLines((prev) => [line, ...prev].slice(0, 20))
  }

  /** 钩子落定后记一笔（idle / loading 不记）—— 取数在钩子里，这里只负责"上了屏"。 */
  const reportState = (label: string, state: RequestState<unknown>, expected = false) => {
    if (state.status === 'ok') report(label, { ok: true, value: state.value }, expected)
    else if (state.status === 'error') report(label, { ok: false, ...state.failure }, expected)
  }

  /* ① 服务信息：**手动** —— 挂载不跑，按钮点了才 `reload()`（`manual: true`）。
     单独留这一节是**分诊**：`/.well-known/yao` 不通时接口一定也不通（拿不到 `openapi` 前缀）。
     应用不依赖这一节 —— `send()` 第一次需要时自己读（`platform/service`，惰性 + 内存缓存）。 */
  const service = useRequest<ServiceInfo>(() => loadServiceInfo(10_000), [], { manual: true })
  useEffect(() => reportState('service.info', service.state), [service.state])

  /* ② 脚手架四格：**各写各的**（四种调用各一个手动钩子 —— 不在这四个上报 `map`，
     免得钩子落进循环里）。`send` 只作为 fetcher 出现，取数仍走钩子。 */
  const publicGetCall = useRequest((signal) => send(publicGet, { signal }), [], { manual: true })
  useEffect(() => reportState(t('dataCheck.publicGet'), publicGetCall.state), [publicGetCall.state])

  const publicPostCall = useRequest(
    (signal) => send(publicPost, { body: POST_BODY, signal }),
    [],
    { manual: true },
  )
  useEffect(() => reportState(t('dataCheck.publicPost'), publicPostCall.state), [publicPostCall.state])

  const protectedGetCall = useRequest((signal) => send(protectedGet, { signal }), [], { manual: true })
  useEffect(() => reportState(t('dataCheck.protectedGet'), protectedGetCall.state, true), [protectedGetCall.state])

  const protectedPostCall = useRequest(
    (signal) => send(protectedPost, { body: POST_BODY, signal }),
    [],
    { manual: true },
  )
  useEffect(() => reportState(t('dataCheck.protectedPost'), protectedPostCall.state, true), [protectedPostCall.state])

  /* ③ 四态：`useRequest` **挂载即跑**（不传 `manual`）、卸载即取消、依赖（语言/主题）变了重跑。
     公开 GET 当 fetcher —— `send()` 自动带上当前请求元数据，它不挑凭据，登录还没接也照样通。 */
  const scaffold = useRequest((signal) => send(publicGet, { signal }), [locale, theme])

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

      {/* ① 服务信息：**按钮点了才读**（手动钩子；缓存见 platform/service） */}
      <h2 className="data-check__heading">{t('dataCheck.serviceInfo')}</h2>
      <p>{t('dataCheck.serviceInfoHint')}</p>
      <p className="data-check__tools">
        <Button onClick={service.reload}>{t('dataCheck.serviceInfoRead')}</Button>
      </p>
      {service.state.status === 'ok' ? (
        <div className="data-check__row">
          {[
            [t('dataCheck.name'), service.state.value.name],
            [t('dataCheck.version'), service.state.value.version],
            [t('dataCheck.openapi'), service.state.value.openapi],
          ].map(([label, value]) => (
            <span className="data-check__cell" key={label}>
              <span className="data-check__label">{label}</span>
              <code>{value}</code>
            </span>
          ))}
        </div>
      ) : null}
      {service.state.status === 'error' ? (
        <p className="data-check__notice" role="status">
          {bridgeErrorText(translate, { ok: false, ...service.state.failure })}
        </p>
      ) : null}

      {/* ② 脚手架四格：公开的两条真跑；受保护的两条也点得动，但登录还没接 —— **预期失败** */}
      <h2 className="data-check__heading">{t('dataCheck.scaffold')}</h2>
      <p>{t('dataCheck.scaffoldHint')}</p>
      <div className="data-check__row">
        <span className="data-check__cell">
          <span className="data-check__label">{t('dataCheck.locale')}</span>
          <code>{locale}</code>
        </span>
        <span className="data-check__cell">
          <span className="data-check__label">{t('dataCheck.theme')}</span>
          <code>{theme}</code>
        </span>
      </div>
      <p className="data-check__tools">
        <Button onClick={publicGetCall.reload}>{t('dataCheck.publicGet')}</Button>{' '}
        <Button onClick={publicPostCall.reload}>{t('dataCheck.publicPost')}</Button>{' '}
        <Button onClick={protectedGetCall.reload}>{t('dataCheck.protectedGet')}</Button>{' '}
        <Button onClick={protectedPostCall.reload}>{t('dataCheck.protectedPost')}</Button>
      </p>

      {/* ③ 请求四态：当前态高亮；成功印值，失败印按码翻译的文案 */}
      <h2 className="data-check__heading">{t('dataCheck.states')}</h2>
      <p>{t('dataCheck.statesHint')}</p>
      <div className="data-check__row">
        {states.map(([status, label]) => (
          <span className="data-check__state" key={status} data-active={scaffold.state.status === status}>
            <span className="data-check__label">{label}</span>
            <code>{status}</code>
          </span>
        ))}
      </div>
      <p className="data-check__tools">
        <Button onClick={scaffold.reload}>{t('dataCheck.reload')}</Button>
      </p>
      {scaffold.state.status === 'ok' ? (
        <p className="data-check__value">{JSON.stringify(scaffold.state.value)}</p>
      ) : null}
      {scaffold.state.status === 'error' ? (
        <p className="data-check__notice" role="status">
          {bridgeErrorText(translate, { ok: false, ...scaffold.state.failure })}
        </p>
      ) : null}

      {/* ④ 结果区：每次落定的调用按行列出（只印返回的值 —— 请求头与凭据从不上屏） */}
      <h2 className="data-check__heading">{t('dataCheck.results')}</h2>
      <ul className="data-check__results">
        {lines.length === 0 ? <li>{t('dataCheck.empty')}</li> : null}
        {lines.map((line) => (
          <li key={line.id}>
            <strong>{line.label}</strong>
            {line.expected ? <em className="data-check__expected">{t('dataCheck.expectedFailure')}</em> : null}
            <span>{line.text}</span>
          </li>
        ))}
      </ul>
      </main>
    </div>
  )
}
