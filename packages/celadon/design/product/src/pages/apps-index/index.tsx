import { useMemo, useState } from 'react'
import { AppNav } from '../../components/app-nav'
import { CreateEntryModal } from '../../components/create-entry-modal'
import { Icon } from '../../components/icon'
import { appEntries } from './data'
import './apps-index.css'

const categories = ['全部', 'Design', 'Commerce', 'Education']
const sourceLabels = {
  self: '自建',
  official: '官方提供',
  'third-party': '第三方提供',
} as const

export function AppsIndexPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [origin, setOrigin] = useState<'all' | 'self' | 'external'>('all')
  const [externalSource, setExternalSource] = useState<'all' | 'official' | 'third-party'>('all')
  const [createOpen, setCreateOpen] = useState(
    () => new URLSearchParams(window.location.search).get('create') === 'app',
  )
  const minimizedId = new URLSearchParams(window.location.search).get('minimized')
  const minimized = appEntries.find((app) => app.id === minimizedId)

  const visibleApps = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return appEntries.filter((app) => {
      const matchesCategory = category === '全部' || app.category === category
      const matchesOrigin =
        origin === 'all' || (origin === 'self' ? app.source === 'self' : app.source !== 'self')
      const matchesExternalSource =
        origin !== 'external' || externalSource === 'all' || app.source === externalSource
      const haystack = `${app.name} ${app.english} ${app.description} ${app.category} ${app.workspace}`
      const matchesQuery = !needle || haystack.toLowerCase().includes(needle)
      return matchesCategory && matchesOrigin && matchesExternalSource && matchesQuery
    })
  }, [category, externalSource, origin, query])

  const counts = {
    all: appEntries.length,
    self: appEntries.filter((app) => app.source === 'self').length,
    external: appEntries.filter((app) => app.source !== 'self').length,
    official: appEntries.filter((app) => app.source === 'official').length,
    'third-party': appEntries.filter((app) => app.source === 'third-party').length,
  }

  function createSession(description: string) {
    const prompt = description.trim()
    const firstLine = prompt.split(/[。\n.!?]/)[0]?.trim()
    const title = (firstLine || '新应用').slice(0, 20)
    const id = `app-${Date.now()}`
    const createdAt = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())

    window.sessionStorage.setItem(
      `cui.session.${id}`,
      JSON.stringify({
        id,
        title,
        prompt,
        workspace: 'Team handbook',
        computer: 'Mac mini',
        model: 'DeepSeek Flash 4.1',
        effort: 'Balanced',
        vault: 'No access',
        agent: 'Builder',
        runner: 'dsh',
        attachments: [],
        createdAt,
      }),
    )
    window.location.assign(`/sessions/${id}`)
  }

  return (
    <div className="apps-shell">
      <AppNav section="apps" />
      <main className="apps-main">
        <header className="apps-head">
          <div className="apps-head-copy">
            <span className="apps-eyebrow">APPS · EXCLUSIVE SURFACES</span>
            <h1>应用</h1>
            <p>每个应用有自己的界面、资源与分享入口。打开后进入独占空间，不在 Chatbox 里套壳。</p>
          </div>
          <button className="apps-create" type="button" onClick={() => setCreateOpen(true)}>
            <Icon name="i-plus" size={15} />
            新建应用
          </button>
        </header>

        <div className="apps-tabs" role="tablist" aria-label="应用来源">
          <button
            className={origin === 'all' ? 'apps-tab is-active' : 'apps-tab'}
            type="button"
            role="tab"
            aria-selected={origin === 'all'}
            onClick={() => setOrigin('all')}
          >
            全部应用
            <span>{counts.all}</span>
          </button>
          <button
            className={origin === 'self' ? 'apps-tab is-active' : 'apps-tab'}
            type="button"
            role="tab"
            aria-selected={origin === 'self'}
            onClick={() => setOrigin('self')}
          >
            自建
            <span>{counts.self}</span>
          </button>
          <button
            className={origin === 'external' ? 'apps-tab is-active' : 'apps-tab'}
            type="button"
            role="tab"
            aria-selected={origin === 'external'}
            onClick={() => {
              setOrigin('external')
              setExternalSource('all')
            }}
          >
            外部应用
            <span>{counts.external}</span>
          </button>
        </div>

        {origin === 'external' ? (
          <div className="apps-source-tabs" role="tablist" aria-label="外部应用来源">
            <span>外部来源</span>
            <button
              className={externalSource === 'all' ? 'apps-source-tab is-active' : 'apps-source-tab'}
              type="button"
              role="tab"
              aria-selected={externalSource === 'all'}
              onClick={() => setExternalSource('all')}
            >
              全部外部
              <span>{counts.external}</span>
            </button>
            <button
              className={externalSource === 'official' ? 'apps-source-tab is-active' : 'apps-source-tab'}
              type="button"
              role="tab"
              aria-selected={externalSource === 'official'}
              onClick={() => setExternalSource('official')}
            >
              官方提供
              <span>{counts.official}</span>
            </button>
            <button
              className={
                externalSource === 'third-party' ? 'apps-source-tab is-active' : 'apps-source-tab'
              }
              type="button"
              role="tab"
              aria-selected={externalSource === 'third-party'}
              onClick={() => setExternalSource('third-party')}
            >
              第三方提供
              <span>{counts['third-party']}</span>
            </button>
          </div>
        ) : null}

        <section className="apps-toolbar" aria-label="应用筛选">
          <label className="apps-search">
            <Icon name="i-search" size={15} />
            <span className="apps-sr-only">搜索应用</span>
            <input
              type="search"
              value={query}
              placeholder="搜索应用、分类或工作区"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="apps-filters">
            {categories.map((item) => (
              <button
                className={item === category ? 'apps-filter is-active' : 'apps-filter'}
                type="button"
                key={item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <span className="apps-count">{visibleApps.length} 个应用</span>
        </section>

        <div className="apps-grid">
          {visibleApps.map((app) => (
            <a className="apps-card" href={`/apps/${app.id}`} key={app.id}>
              <div className="apps-card-top">
                <span className="apps-card-icon">
                  <Icon name={app.icon} size={22} />
                </span>
                <div className="apps-card-title">
                  <strong>{app.name}</strong>
                  <span>{app.english}</span>
                </div>
                <span className={app.status === 'ready' ? 'apps-status is-ready' : 'apps-status'}>
                  <i aria-hidden="true" />
                  {app.status === 'ready' ? 'Ready' : 'Draft'}
                </span>
              </div>
              <div className="apps-card-source">
                {app.source !== 'self' ? <span className="apps-source-external">外部</span> : null}
                <span className={`apps-source is-${app.source}`}>{sourceLabels[app.source]}</span>
              </div>
              <p className="apps-card-desc">{app.description}</p>
              <div className="apps-card-tags">
                <span>{app.category}</span>
                <span>{app.surface}</span>
                <span>{app.workspace}</span>
              </div>
              <div className="apps-card-foot">
                <span>更新于 {app.updated}</span>
                <span className="apps-card-open">
                  Open
                  <Icon name="i-right" size={13} />
                </span>
              </div>
            </a>
          ))}

          {origin !== 'external' ? (
            <button className="apps-card apps-card-builder" type="button" onClick={() => setCreateOpen(true)}>
              <span className="apps-builder-icon">
                <Icon name="i-spark" size={22} />
              </span>
              <strong>做一个自己的应用</strong>
              <p>从 Builder 开始，把工作流做成自己的界面与入口。</p>
              <span className="apps-builder-action">
                开始构建
                <Icon name="i-right" size={13} />
              </span>
            </button>
          ) : null}
        </div>

        {visibleApps.length === 0 ? (
          <div className="apps-empty">
            <Icon name="i-apps" size={24} />
            <strong>没有匹配的应用</strong>
            <span>换一个关键词或分类再试。</span>
          </div>
        ) : null}

        {minimized ? (
          <aside className="apps-minimized" aria-label="已最小化的应用">
            <span className="apps-minimized-icon">
              <Icon name={minimized.icon} size={16} />
            </span>
            <span>
              <strong>{minimized.name}</strong>
              <small>已最小化</small>
            </span>
            <a href={`/apps/${minimized.id}`} aria-label={`重新打开 ${minimized.name}`}>
              重新打开
            </a>
            <a href="/apps" aria-label="关闭最小化入口">
              <Icon name="i-act-close" size={13} />
            </a>
          </aside>
        ) : null}
      </main>
      {createOpen ? (
        <CreateEntryModal
          kind="app"
          onClose={() => setCreateOpen(false)}
          onCreate={createSession}
        />
      ) : null}
    </div>
  )
}
