import './bridge.less'
/* **桥的脚手架页**（`/<namespace>/scaffold/bridge`）：把这轮做出来的宿主能力逐条摆出来，点一下就知道通没通。
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
import { Button } from '@/components/base/button'
import { useTranslation } from '@/platform/i18n'
import { ScaffoldPage } from '@/features/scaffold/components/scaffold-page'
import { client } from '@/platform/client'
import { routerBasename } from '@/platform/router/basename'
import { bridge, fail, failureText, type BridgeResult } from '@/platform/bridge'
import { credential, credentialKey } from '@/platform/credential'
import { REDACTED, shouldRedact } from './redact'
import { transport } from '@/platform/transport'
import { loadServiceBase, loadServiceInfo } from '@/platform/service'

type Line = { label: string; text: string }

export function BridgePage() {
  const { t } = useTranslation()
  const info = client.info
  const caps = client.capabilities
  const manifest = client.manifest
  const [lines, setLines] = useState<Line[]>([])
  // 凭据的键按服务 origin 分账（`scope.ts`）：没地址就没有键 —— 输入框默认为空，写也写不进去
  const [credentialScope, setCredentialScope] = useState<string | undefined>(() => credentialKey('session'))
  const [service, setService] = useState(credentialScope ?? '')
  const [address, setAddress] = useState('')
  const [secret, setSecret] = useState('')
  const [url, setUrl] = useState('https://example.com')
  const [path, setPath] = useState('')
  const [ping, setPing] = useState<BridgeResult<unknown>>()
  // **问 client/**，不自己看框架内部（§5：宿主差异不许渗到 feature）
  const host = client.host.ready

  /** 一次调用的结果：成功显示值，失败显示**翻译过的**文案（缺翻译时回退诊断并告警）。 */
  const report = (label: string, result: BridgeResult<unknown>, redact = false) => {
    const text = result.ok
      // **秘密不上屏**：`credential.read` 的结果只报"读到了"，不印内容
      ? `${t('bridge.result')}: ${redact ? REDACTED : JSON.stringify(result.value)}`
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
      // 凭据的键按服务 origin 分账（`scope.ts`）：没地址就没有键 —— 这时**不拿假名字去写**
      // 基址在桌面由宿主给：先取回来，再算凭据的键（没地址就没有键 —— 这时不拿假名字去写）
      await loadServiceBase()
      const selfCheckKey = credentialKey('self-check')
      setCredentialScope(credentialKey('session'))
      setService((current) => (current ? current : (credentialKey('session') ?? '')))
      for (const [label, call] of [
        ['platform', () => bridge.system.platform()],
        ['language', () => bridge.system.language()],
        ['localIps', () => bridge.system.localIps()],
        ['appInfo', () => bridge.system.appInfo()],
        ['theme', () => bridge.system.theme()],
        ['machineId', () => bridge.system.machineId()],
        ['service.get', () => bridge.service.get()],
        ['transport', () => transport.probe('https://example.com')],
        ...(selfCheckKey
          ? ([
              ['credential.write', () => credential.write(selfCheckKey, 'self-check')],
              ['credential.read', () => credential.read(selfCheckKey)],
              ['credential.remove', () => credential.remove(selfCheckKey)],
            ] as const)
          : ([['credential.key', async () => fail('credential.service_empty', 'no service address to key a credential', {})]] as const)),
      ] as const) {
        // 桥调用**不许抛**（失败是值）；真抛了也不能静默中断整段自检
        try {
          report(label, await call(), shouldRedact(label))
        } catch (error) {
          report(label, fail('bridge.threw', String(error), {}), true)
        }
      }
      const pinged = await bridge.ping()
      setPing(pinged)
      report('ping', pinged)
    })()
  }, [host])

  const run = (label: string, call: () => Promise<BridgeResult<unknown>>) => {
    void call()
      .then((result) => report(label, result, shouldRedact(label)))
      .catch((error: unknown) => report(label, fail('bridge.threw', String(error), {}), true))
  }

  return (
    <div className="bridge">
      <ScaffoldPage title={t('bridge.title')}>
        <div className="bridge__body">


      {!host && (
        <p className="bridge__notice" role="status">
          <strong>{t('bridge.openInClient')}</strong> —— {t('bridge.hintClient')}
        </p>
      )}

      {/* 客户端自述：Web 与桌面导出的字段一致（见 15 §5.2） */}
      <h2 className="bridge__heading">{t('bridge.client')}</h2>
      {/* 照概览页的客户端格子：标签小字在上、值走等宽在下（同一套 .bridge__cell） */}
      <div className="bridge__row">
        {[
          [t('overview.clientType'), info.client],
          [t('overview.os'), info.os],
          [t('overview.browser'), `${info.ua.browser.name} ${info.ua.browser.version}`],
          [t('overview.version'), manifest.version],
          [t('overview.namespace'), routerBasename() || '/'],
          [t('overview.clientId'), info.client_id],
        ].map(([label, value]) => (
          <span className="bridge__cell" key={label}>
            <span className="bridge__label">{label}</span>
            <code>{value}</code>
          </span>
        ))}
      </div>

      {/* 桥：可用性与**已注册命令表**（避免"页面写了但命令没注册"的假绿） */}
      <h2 className="bridge__heading">{t('bridge.hostAbilities')}</h2>
      <p>{t('bridge.hostHint')}</p>
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
          ? t('bridge.notPinged')
          : ping.ok
            ? `${t('bridge.ready')} · ${JSON.stringify((ping.value as { commands?: unknown }).commands ?? {})}`
            : failureText(ping)}
      </p>

      {/* 能力开关：唯一的分支点（15 §5） */}
      <h2 className="bridge__heading">{t('bridge.capabilities')}</h2>
      <div className="bridge__row">
        {Object.entries(caps).map(([name, on]) => (
          <span className="bridge__cell" key={name}>
            <span className="bridge__label">{name}</span>
            <code>{String(on)}</code>
          </span>
        ))}
      </div>

      {/* 逐条能力：点一下，结果落在下面的列表里 */}
      <h2 className="bridge__heading">{t('bridge.actions')}</h2>
      <p className="bridge__tools">
        <Button onClick={() => run('platform', bridge.system.platform)}>{t('bridge.platform')}</Button>{' '}
        <Button onClick={() => run('language', bridge.system.language)}>{t('bridge.language')}</Button>{' '}
        <Button onClick={() => run('localIps', bridge.system.localIps)}>{t('bridge.localIps')}</Button>{' '}
        <Button onClick={() => run('appInfo', bridge.system.appInfo)}>{t('bridge.appInfo')}</Button>{' '}
        <Button onClick={() => run('theme', bridge.system.theme)}>{t('bridge.themeRead')}</Button>{' '}
        <Button onClick={() => run('themeSet:light', () => bridge.system.themeSet('light'))}>{t('bridge.themeLight')}</Button>{' '}
        <Button onClick={() => run('themeSet:dark', () => bridge.system.themeSet('dark'))}>{t('bridge.themeDark')}</Button>{' '}
        <Button onClick={() => run('folderPick', () => bridge.system.folderPick())}>{t('bridge.folderPick')}</Button>{' '}
        <Button onClick={() => run('filePick', () => bridge.system.filePick())}>{t('bridge.filePick')}</Button>
      </p>
      <p className="bridge__tools">
        <label>
          {t('bridge.url')}
          <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} size={32} />
        </label>{' '}
        <Button onClick={() => run('openBrowser', () => bridge.system.openBrowser(url))}>{t('bridge.openBrowser')}</Button>
      </p>
      <p className="bridge__tools">
        <label>
          {t('bridge.path')}
          <input className="input" value={path} onChange={(event) => setPath(event.target.value)} size={32} />
        </label>{' '}
        <Button onClick={() => run('reveal', () => bridge.system.reveal(path))}>{t('bridge.reveal')}</Button>
      </p>

      {/* 服务信息：**第一次需要时读一次**并缓存（15 §3）。**按需**——按钮点了才读，
          所以纯静态托管（演示/拟人）不会平白多出 404 */}
      <h2 className="bridge__heading">{t('bridge.serviceInfo')}</h2>
      <p className="bridge__tools">
        <Button onClick={() => run('service.info', () => loadServiceInfo(10_000))}>
          {t('bridge.serviceInfoRead')}
        </Button>
      </p>

      {/* 服务地址：**由宿主持有**（桌面由用户填或选，地址不进产物）；`set` 由宿主先校验再写入。
          服务信息仍由应用自己读（上面那一节）—— 两宿主同一条路（plan/01-bridge-commands.md §2） */}
      <h2 className="bridge__heading">{t('bridge.serviceAddress')}</h2>
      <p>{t('bridge.serviceAddressHint')}</p>
      <p className="bridge__tools">
        <Button onClick={() => run('service.get', () => bridge.service.get())}>{t('bridge.serviceGet')}</Button>{' '}
        <label>
          {t('bridge.url')}
          <input
            className="input"
            aria-label={t('bridge.serviceAddress')}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            size={32}
          />
        </label>{' '}
        <Button onClick={() => run('service.set', () => bridge.service.set(address))}>{t('bridge.serviceSet')}</Button>
      </p>

      {/* 出海口：**只有 platform/transport 发请求**（见 17-transport.md）。
          Web 用浏览器 fetch，桌面壳用官方插件的 fetch（同一签名） */}
      <h2 className="bridge__heading">{t('bridge.egress')}</h2>
      <p>{t('bridge.egressHint')}</p>
      <p className="bridge__tools">
        <label>
          {t('bridge.url')}
          <input className="input" value={url} onChange={(event) => setUrl(event.target.value)} size={32} />
        </label>{' '}
        <Button onClick={() => run('transport.probe', () => transport.probe(url))}>
          {t('bridge.transportProbe')}
        </Button>
      </p>

      {/* 凭据往返：**这条只能在跑起来的应用里验**（CLI 会话没有凭据库域） */}
      <h2 className="bridge__heading">{t('bridge.credential')}</h2>
      <p className="bridge__tools">
        <label>
          {t('bridge.service')}
          <input className="input" value={service} onChange={(event) => setService(event.target.value)} />
        </label>{' '}
        <label>
          {t('bridge.secret')}
          <input className="input" value={secret} onChange={(event) => setSecret(event.target.value)} type="password" />
        </label>
      </p>
      <p>
        <Button disabled={!service.trim()} onClick={() => run('credential.write', () => credential.write(service, secret))}>{t('bridge.write')}</Button>{' '}
        <Button disabled={!service.trim()} onClick={() => run('credential.read', () => credential.read(service))}>{t('bridge.read')}</Button>{' '}
        <Button disabled={!service.trim()} onClick={() => run('credential.remove', () => credential.remove(service))}>{t('bridge.remove')}</Button>{' '}
        <Button onClick={() => run('credential.list', () => credential.list())}>{t('bridge.list')}</Button>
      </p>
      {/* 键按服务 origin 分账（`scope.ts`）：这里是"当前服务下这个用途的键长什么样" */}
      <p>
        {t('bridge.credentialKey')}: <code>{credentialScope ?? t('bridge.credentialKeyNone')}</code>
      </p>
      {/* 没键就没得写：把原因说出来，按钮也不让点（宿主对空名也会拒：`credential.service_empty`） */}
      {service.trim() ? null : <p className="bridge__notice">{t('bridge.credentialKeyMissing')}</p>}

      <h2 className="bridge__heading">{t('bridge.results')}</h2>
      <ul>
        {lines.map((line, index) => (
          // 同一标签同一文案会重复出现：key 里带上序号，别让 React 报警
          <li key={`${index}-${line.label}`}>{`${line.label} → ${line.text}`}</li>
        ))}
      </ul>
      </div>
        </ScaffoldPage>
    </div>
  )
}
