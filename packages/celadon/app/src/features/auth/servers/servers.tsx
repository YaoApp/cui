import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { BrandMark } from '@/components/base/brand-mark'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Input } from '@/components/base/input'
import { Select, type SelectOption } from '@/components/base/select'
import { Spinner } from '@/components/base/spinner'
import { client } from '@/platform/client'
import { invalidate } from '@/data'
import { userKeys } from '@/data/user'
import { useDocumentTitle } from '@/platform/document-title'
import { failureText, useTranslation } from '@/platform/i18n'
import { useLocaleStore } from '@/platform/i18n/locale.store'
import { loadCloudServers, type CloudServer } from '@/platform/portal'
import { serviceBase, writeServiceAddress } from '@/platform/service'
import { AuthLayout } from '../components/auth-layout'
import { readServers, rememberServer } from '../server-history'
import './servers.less'

/** 自建服务器在选择器里占的值；不是地址。 */
const CUSTOM = '__custom__'

/** 选服务器页要的两样东西：官方清单（异步）与选中项。 */
type Cloud =
  | { status: 'loading' }
  | { status: 'ready'; servers: CloudServer[] }
  | { status: 'failed'; text: string }

function bare(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

function sameAddress(left: string, right: string): boolean {
  return left.replace(/\/+$/, '') === right.replace(/\/+$/, '')
}

/**
 * 服务器选择页（客户端内特有）。
 *
 * 桌面：官方清单取自云站点（宿主代发，跨域不受限）+ 手填自建地址；连接由
 * `writeServiceAddress` 交给宿主**先取 `/.well-known/yao` 校验、通过才写入**。连上后进登录页。
 * Web：地址由部署决定，页面只读展示，不画写入控件。
 *
 * 本机记过的服务器（`server-history`）用来预选：清单里有就选它，没有就回填到自建那一格。
 */
export function ServersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  useDocumentTitle(t('auth.servers.docTitle'))

  const desktop = client.capabilities.serviceAddress
  const [cloud, setCloud] = useState<Cloud>({ status: 'loading' })
  const [selected, setSelected] = useState<string>(CUSTOM)
  const [custom, setCustom] = useState('')
  const [customRequired, setCustomRequired] = useState(false)
  const [connectError, setConnectError] = useState<string>()
  const [connecting, setConnecting] = useState(false)

  const load = useCallback(async () => {
    setCloud({ status: 'loading' })
    const result = await loadCloudServers(locale)
    if (!result.ok) {
      setCloud({ status: 'failed', text: failureText(result) })
      return
    }
    setCloud({ status: 'ready', servers: result.value })

    /* 预选：记过的服务器在清单里就选它；不在就回填到自建那一格；都没有就选第一台 */
    const stored = readServers()
    const known = stored.find((entry) => result.value.some((server) => sameAddress(server.url, entry.url)))
    if (known) {
      setSelected(known.url)
    } else if (stored[0]) {
      setSelected(CUSTOM)
      setCustom(stored[0].url)
    } else if (result.value[0]) {
      setSelected(result.value[0].url)
    }
  }, [locale])

  useEffect(() => {
    if (desktop) void load()
  }, [desktop, load])

  const options = useMemo<SelectOption[]>(() => {
    const servers = cloud.status === 'ready' ? cloud.servers : []
    return [
      ...servers.map((server) => ({
        value: server.url,
        label: server.name,
        icon: <BrandMark name="brand-yao-agents" size={20} />,
        description: bare(server.url),
      })),
      {
        value: CUSTOM,
        label: t('auth.servers.custom'),
        icon: <Icon name="i-pc" />,
        description: t('auth.servers.customDesc'),
      },
    ]
  }, [cloud, t])

  async function onConnect() {
    const url = selected === CUSTOM ? custom.trim() : selected
    if (!url) {
      setCustomRequired(true)
      return
    }
    setConnecting(true)
    setConnectError(undefined)
    const result = await writeServiceAddress(url)
    setConnecting(false)
    if (!result.ok) {
      setConnectError(failureText(result))
      return
    }
    /* 记下这台服务器的显示名：清单条目用清单里的名字，自建那一格没有名字（客户端栏按「自建」显示） */
    const known = cloud.status === 'ready' ? cloud.servers.find((server) => sameAddress(server.url, url)) : undefined
    rememberServer(url, known ? known.name || bare(url) : undefined)
    /* 换地址就是换服务：`user` 域的数据都属于旧服务，全部作废让登录页按新地址重取 */
    invalidate(userKeys.all)
    navigate('/login?from=connect')
  }

  /* Web：地址由部署决定，只读展示 */
  const webAddress = serviceBase() || globalThis.location?.origin || ''

  return (
    /* 选服务器页是客户端栏的返回目标，自己不画客户端栏与页脚：固定独立形态 */
    <AuthLayout mode="standalone" titleLines={[t('auth.servers.title')]}>
      <p className="servers__lead">{t(desktop ? 'auth.servers.lead' : 'auth.servers.webLead')}</p>

      {!desktop ? (
        <div className="servers__fixed">
          <span className="servers__fixed-label">{t('auth.servers.current')}</span>
          <code className="servers__fixed-url">{bare(webAddress)}</code>
        </div>
      ) : (
        <>
          {cloud.status === 'loading' ? (
            <div className="servers__state" role="status">
              <Spinner />
              <span>{t('auth.servers.loading')}</span>
            </div>
          ) : null}

          {cloud.status === 'failed' ? (
            <div className="servers__failed">
              <p className="servers__error" role="alert">
                <Icon name="i-state-error" />
                <span>{cloud.text}</span>
              </p>
              <Button type="button" variant="plain" size="small" onClick={() => void load()}>
                {t('auth.servers.retry')}
              </Button>
            </div>
          ) : null}

          {cloud.status === 'ready' && cloud.servers.length === 0 ? (
            <p className="servers__hint">{t('auth.servers.empty')}</p>
          ) : null}

          {cloud.status === 'ready' ? (
            <Select
              aria-label={t('auth.servers.selectLabel')}
              size="large"
              value={selected}
              onValueChange={(value) => {
                /* 选择器允许清空选中（再点一次已选项）；本页永远得有一项，空值不当成选择 */
                if (!value) return
                setSelected(value)
                setCustomRequired(false)
                setConnectError(undefined)
              }}
              options={options}
              placeholder={t('auth.servers.placeholder')}
              disabled={connecting}
              className="servers__select"
            />
          ) : null}

          {/* 自建地址在清单取不到时也要能填：不然失败态只剩一个按了没反应的连接按钮 */}
          {cloud.status !== 'loading' && selected === CUSTOM ? (
            <Input
              id="auth-server-url"
              className="servers__custom"
              type="text"
              value={custom}
              onChange={(event) => {
                setCustom(event.target.value)
                setCustomRequired(false)
                setConnectError(undefined)
              }}
              placeholder={t('auth.servers.customHint')}
              error={customRequired ? t('auth.servers.customRequired') : undefined}
              size="large"
              autoComplete="off"
            />
          ) : null}

          {connectError ? (
            <p className="servers__error" role="alert">
              <Icon name="i-state-error" />
              <span>{connectError}</span>
            </p>
          ) : null}

          <Button
            type="button"
            variant="inverse"
            block
            size="large"
            loading={connecting}
            disabled={cloud.status === 'loading'}
            onClick={() => void onConnect()}
          >
            {connecting ? t('auth.servers.connecting') : t('auth.servers.connect')}
          </Button>
        </>
      )}
    </AuthLayout>
  )
}
