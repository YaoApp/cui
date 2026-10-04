import './verify.less'
/* **桥的脚手架页**（`/<namespace>/verify`）：把这轮做出来的宿主能力逐条摆出来，点一下就知道通没通。
 *
 * 两个用途：
 *   ① **Web 上**（没有宿主）：明确告诉用户「请在客户端打开」—— 不用让人猜为什么按钮不响应
 *   ② **桌面壳里**：真跑一遍 —— 平台 · 语言 · 本地 IP · 应用信息 · 主题 · 打开浏览器 · 定位 ·
 *      选文件/目录 · **凭据写→读→删**（这条是 `cargo test` 在 CLI 里验不了的）
 *
 * 失败一律显示**按码翻译过的文案**（`failureText`），不是壳里的英文句子。
 *
 * **一处在诊断页里的例外**：本页允许手输地址（探一下 / 打开浏览器）。§5 的"Web 端不许任意输入地址"
 * 管的是**产品入口**（防钓鱼：别让用户在"我们的应用"里把凭据交给陌生服务端）；这里是**诊断页**，
 * 用来验证出海口本身，地址不落存储、不进服务清单。 */

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/base/button'
import { Header } from '@/components/header'
import { Nav } from '@/components/nav'
import { useTranslation } from '@/platform/i18n'
import { usePageTitle } from '@/platform/router/use-page-title'
import { navWithActive } from '@/platform/utils/nav'
import { buildManifest, capabilities, clientInfo, hasHost } from '@/platform/client'
import { routerBasename } from '@/platform/router/basename'
import { bridge, failureText, type BridgeResult } from '@/platform/bridge'
import { credential } from '@/platform/credential'
import { REDACTED, shouldRedact } from './redact'
import { transport } from '@/platform/transport'
import { loadServiceInfo } from '@/platform/service'

type Line = { label: string; text: string }

export function VerifyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navItems = navWithActive(pathname).map((item) => ({ ...item, label: t(item.label) }))
  usePageTitle(t('verify.title'))
  const info = clientInfo()
  const caps = capabilities()
  const manifest = buildManifest()
  const [lines, setLines] = useState<Line[]>([])
  const [service, setService] = useState('verify-demo')
  const [address, setAddress] = useState('')
  const [secret, setSecret] = useState('')
  const [url, setUrl] = useState('https://example.com')
  const [path, setPath] = useState('')
  const [ping, setPing] = useState<BridgeResult<unknown>>()
  // **问 client/**，不自己看框架内部（§5：宿主差异不许渗到 feature）
  const host = hasHost()

  /** 一次调用的结果：成功显示值，失败显示**翻译过的**文案（缺翻译时回退诊断并告警）。 */
  const report = (label: string, result: BridgeResult<unknown>, redact = false) => {
    const text = result.ok
      // **秘密不上屏**：`credential.read` 的结果只报"读到了"，不印内容
      ? `${t('verify.result')}: ${redact ? REDACTED : JSON.stringify(result.value)}`
      : failureText(result)
    setLines((prev) => [{ label, text }, ...prev].slice(0, 12))
  }

  /* **进页自检**（只在有宿主时）：把每条能力跑一遍，结果直接落在页面上 ——
     这样"客户端能不能用"不用手点就能从截图看出来（也是验收时最快的证据）。 */
  const selfChecked = useRef(false)
  useEffect(() => {
    if (!host || selfChecked.current) return
    selfChecked.current = true
    void (async () => {
      for (const [label, call] of [
        ['platform', () => bridge.system.platform()],
        ['language', () => bridge.system.language()],
        ['localIps', () => bridge.system.localIps()],
        ['appInfo', () => bridge.system.appInfo()],
        ['theme', () => bridge.system.theme()],
        ['machineId', () => bridge.system.machineId()],
        ['service.get', () => bridge.service.get()],
        ['transport', () => transport.probe('https://example.com')],
        ['credential.write', () => credential.write('verify-demo', 'self-check')],
        ['credential.read', () => credential.read('verify-demo')],
        ['credential.remove', () => credential.remove('verify-demo')],
      ] as const) {
        const result = await call()
        report(label, result, shouldRedact(label))
      }
      const pinged = await bridge.ping()
      setPing(pinged)
      report('ping', pinged)
    })()
  }, [host])

  const run = (label: string, call: () => Promise<BridgeResult<unknown>>) => {
    void call().then((result) => report(label, result, shouldRedact(label)))
  }

  return (
    <div className="verify">
      <Header title={t('verify.title')}>
        <Nav items={navItems} label={t('nav.appLabel')} localeSwitch onSelect={(item) => navigate(item.href)} />
      </Header>
      <main className="verify__body">

      <div className="verify__actions">
        <Button variant="ghost" onClick={() => navigate(-1)}>{t('verify.back')}</Button>
      </div>

      {!host && (
        <p className="verify__notice" role="status">
          <strong>{t('verify.openInClient')}</strong> —— {t('verify.hintClient')}
        </p>
      )}

      {/* 客户端自述：Web 与桌面导出的字段一致（见 15 §5.2） */}
      <h2 className="verify__heading">{t('verify.client')}</h2>
      {/* 照 `hello` 页的客户端格子：标签小字在上、值走等宽在下（同一套 .verify__cell） */}
      <div className="verify__row">
        {[
          [t('hello.clientType'), info.client],
          [t('hello.os'), info.os],
          [t('hello.browser'), `${info.ua.browser.name} ${info.ua.browser.version}`],
          [t('hello.version'), manifest.version],
          [t('hello.namespace'), routerBasename() || '/'],
          [t('hello.clientId'), info.client_id],
        ].map(([label, value]) => (
          <span className="verify__cell" key={label}>
            <span className="verify__label">{label}</span>
            <code>{value}</code>
          </span>
        ))}
      </div>

      {/* 桥：可用性与**已注册命令表**（避免"页面写了但命令没注册"的假绿） */}
      <h2 className="verify__heading">{t('verify.hostAbilities')}</h2>
      <p>{t('verify.hostHint')}</p>
      <Button
        variant="soft"
        onClick={() => {
          void bridge.ping().then((result) => {
            setPing(result)
            report('ping', result)
          })
        }}
      >
        ping
      </Button>
      <p>
        {!ping
          ? t('verify.notPinged')
          : ping.ok
            ? `${t('verify.ready')} · ${JSON.stringify((ping.value as { commands?: unknown }).commands ?? {})}`
            : failureText(ping)}
      </p>

      {/* 能力开关：唯一的分支点（15 §5） */}
      <h2 className="verify__heading">{t('verify.capabilities')}</h2>
      <div className="verify__row">
        {Object.entries(caps).map(([name, on]) => (
          <span className="verify__cell" key={name}>
            <span className="verify__label">{name}</span>
            <code>{String(on)}</code>
          </span>
        ))}
      </div>

      {/* 逐条能力：点一下，结果落在下面的列表里 */}
      <h2 className="verify__heading">{t('verify.actions')}</h2>
      <p className="verify__tools">
        <Button onClick={() => run('platform', bridge.system.platform)}>{t('verify.platform')}</Button>{' '}
        <Button onClick={() => run('language', bridge.system.language)}>{t('verify.language')}</Button>{' '}
        <Button onClick={() => run('localIps', bridge.system.localIps)}>{t('verify.localIps')}</Button>{' '}
        <Button onClick={() => run('appInfo', bridge.system.appInfo)}>{t('verify.appInfo')}</Button>{' '}
        <Button onClick={() => run('theme', bridge.system.theme)}>{t('verify.themeRead')}</Button>{' '}
        <Button onClick={() => run('themeSet:light', () => bridge.system.themeSet('light'))}>{t('verify.themeLight')}</Button>{' '}
        <Button onClick={() => run('themeSet:dark', () => bridge.system.themeSet('dark'))}>{t('verify.themeDark')}</Button>{' '}
        <Button onClick={() => run('folderPick', () => bridge.system.folderPick())}>{t('verify.folderPick')}</Button>{' '}
        <Button onClick={() => run('filePick', () => bridge.system.filePick())}>{t('verify.filePick')}</Button>
      </p>
      <p className="verify__tools">
        <label>
          {t('verify.url')}
          <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} size={32} />
        </label>{' '}
        <Button onClick={() => run('openBrowser', () => bridge.system.openBrowser(url))}>{t('verify.openBrowser')}</Button>
      </p>
      <p className="verify__tools">
        <label>
          {t('verify.path')}
          <input className="input" value={path} onChange={(event) => setPath(event.target.value)} size={32} />
        </label>{' '}
        <Button onClick={() => run('reveal', () => bridge.system.reveal(path))}>{t('verify.reveal')}</Button>
      </p>

      {/* 服务信息：**第一次需要时读一次**并缓存（15 §3）。**按需**——按钮点了才读，
          所以纯静态托管（演示/拟人）不会平白多出 404 */}
      <h2 className="verify__heading">{t('verify.serviceInfo')}</h2>
      <p className="verify__tools">
        <Button onClick={() => run('service.info', () => loadServiceInfo(10_000))}>
          {t('verify.serviceInfoRead')}
        </Button>
      </p>

      {/* 服务地址：**由宿主持有**（桌面由用户填或选，地址不进产物）；`set` 由宿主先校验再写入。
          服务信息仍由应用自己读（上面那一节）—— 两宿主同一条路（plan/01-bridge-commands.md §2） */}
      <h2 className="verify__heading">{t('verify.serviceAddress')}</h2>
      <p>{t('verify.serviceAddressHint')}</p>
      <p className="verify__tools">
        <Button onClick={() => run('service.get', () => bridge.service.get())}>{t('verify.serviceGet')}</Button>{' '}
        <label>
          {t('verify.url')}
          <input className="input" value={address} onChange={(event) => setAddress(event.target.value)} size={32} />
        </label>{' '}
        <Button onClick={() => run('service.set', () => bridge.service.set(address))}>{t('verify.serviceSet')}</Button>
      </p>

      {/* 出海口：**只有 platform/transport 发请求**（见 17-transport.md）。
          Web 用浏览器 fetch，桌面壳用官方插件的 fetch（同一签名） */}
      <h2 className="verify__heading">{t('verify.egress')}</h2>
      <p>{t('verify.egressHint')}</p>
      <p className="verify__tools">
        <label>
          {t('verify.url')}
          <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} size={32} />
        </label>{' '}
        <Button onClick={() => run('transport.probe', () => transport.probe(url))}>
          {t('verify.transportProbe')}
        </Button>
      </p>

      {/* 凭据往返：**这条只能在跑起来的应用里验**（CLI 会话没有凭据库域） */}
      <h2 className="verify__heading">{t('verify.credential')}</h2>
      <p className="verify__tools">
        <label>
          {t('verify.service')}
          <input className="input" value={service} onChange={(event) => setService(event.target.value)} />
        </label>{' '}
        <label>
          {t('verify.secret')}
          <input className="input" value={secret} onChange={(event) => setSecret(event.target.value)} type="password" />
        </label>
      </p>
      <p>
        <Button onClick={() => run('credential.write', () => credential.write(service, secret))}>{t('verify.write')}</Button>{' '}
        <Button onClick={() => run('credential.read', () => credential.read(service))}>{t('verify.read')}</Button>{' '}
        <Button onClick={() => run('credential.remove', () => credential.remove(service))}>{t('verify.remove')}</Button>{' '}
        <Button onClick={() => run('credential.list', () => credential.list())}>{t('verify.list')}</Button>
      </p>

      <h2 className="verify__heading">{t('verify.results')}</h2>
      <ul>
        {lines.map((line) => (
          <li key={`${line.label}-${line.text}`}>{`${line.label} → ${line.text}`}</li>
        ))}
      </ul>
      </main>
    </div>
  )
}
