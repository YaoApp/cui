import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '../../components/icon'
import './session-detail.css'

type SessionData = {
  id: string
  title: string
  prompt: string
  workspace: string
  computer: string
  model: string
  effort: string
  vault: string
  agent: string
  attachments: string[]
  createdAt: string
}

type Thread = {
  id: string
  title: string
  count: number
}
type BrowserPage = { kind: 'thread'; thread: Thread } | { kind: 'workspace' }
type SectionId = 'agents' | 'jobs' | 'daemons' | 'files'

const fallbackSession: SessionData = {
  id: 'demo',
  title: '审查合同条款',
  prompt: '帮我读一下这份 12 页合同，重点看付款、违约金、保密期与终止条款。',
  workspace: 'Research',
  computer: 'Mac mini',
  model: 'DeepSeek Flash 4.1',
  effort: 'Balanced',
  vault: '1 group · 2 secrets',
  agent: 'Yao Agent',
  attachments: ['contract.pdf'],
  createdAt: '09:38',
}

const fileChanges = [
  { name: 'review-notes.md', change: '+48 −0', state: 'Created' },
  { name: 'risk-report.csv', change: '+12 −3', state: 'Modified' },
]

type SettingsView = 'main' | 'vault'

type VaultItem = {
  id: string
  name: string
  kind: string
}

type VaultGroup = {
  id: string
  name: string
  vault: string
  permission: string
  items: VaultItem[]
}

const vaultGroups: VaultGroup[] = [
  {
    id: 'github-cui',
    name: 'GitHub · yao/cui',
    vault: 'Team Vault · Yao Agents',
    permission: 'Repository write',
    items: [
      { id: 'github-cui-token', name: 'GITHUB_TOKEN', kind: 'Token' },
      { id: 'github-cui-ssh', name: 'SSH deploy key', kind: 'SSH key' },
    ],
  },
  {
    id: 'ai-providers',
    name: 'AI providers',
    vault: 'Personal Vault',
    permission: 'API access',
    items: [
      { id: 'openai-key', name: 'OPENAI_API_KEY', kind: 'API key' },
      { id: 'anthropic-key', name: 'ANTHROPIC_API_KEY', kind: 'API key' },
    ],
  },
  {
    id: 'cloudflare-dns',
    name: 'Cloudflare · DNS',
    vault: 'Team Vault · Yao Agents',
    permission: 'DNS edit',
    items: [{ id: 'cloudflare-token', name: 'CLOUDFLARE_API_TOKEN', kind: 'Token' }],
  },
]

const lifetimes = [
  { id: 'stop', label: 'Stop when idle' },
  { id: 'keep', label: 'Keep running' },
  { id: 'serve', label: 'Serve while App is active' },
]

const approvals = [
  { id: 'writes', label: 'Ask before writes' },
  { id: 'every', label: 'Ask before every tool' },
  { id: 'auto', label: 'Auto-approve' },
]

function readSession(id: string): SessionData {
  try {
    const raw = window.sessionStorage.getItem(`cui.session.${id}`)
    if (!raw) return { ...fallbackSession, id }
    const stored = JSON.parse(raw) as Partial<SessionData>
    return { ...fallbackSession, ...stored, id }
  } catch {
    return { ...fallbackSession, id }
  }
}

export function SessionDetailPage({ sessionId }: { sessionId: string }) {
  const data = readSession(sessionId)
  const modelOptions = Array.from(new Set([data.model, 'DeepSeek Flash 4.1', 'DeepSeek Pro 4.1', 'Claude Sonnet 4.5']))
  const effortOptions = Array.from(new Set([data.effort, 'Fast', 'Balanced', 'Deep']))
  const [threads, setThreads] = useState<Thread[]>([
    { id: 'payment', title: 'Payment terms', count: 3 },
    { id: 'termination', title: 'Termination window', count: 2 },
  ])
  const [browserPage, setBrowserPage] = useState<BrowserPage | null>(null)
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<Array<{ id: number; text: string; at: string }>>([])
  const [jobOpen, setJobOpen] = useState(false)
  const [daemonStatus, setDaemonStatus] = useState<'running' | 'restarting'>('running')
  const [restarts, setRestarts] = useState(0)
  const [openDetail, setOpenDetail] = useState<SectionId | null>(null)
  const [threadMenuOpen, setThreadMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsView, setSettingsView] = useState<SettingsView>('main')
  const [lifetimeId, setLifetimeId] = useState('stop')
  const [approvalId, setApprovalId] = useState('writes')
  const [modelEffort, setModelEffort] = useState(() => `${data.model}::${data.effort}`)
  const [vaultItems, setVaultItems] = useState<string[]>(['github-cui-token', 'github-cui-ssh'])
  const [vaultQuery, setVaultQuery] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)

  const selectedGroupCount = vaultGroups.filter(
    (group) => group.items.length > 0 && group.items.every((item) => vaultItems.includes(item.id)),
  ).length
  const vaultSummary =
    vaultItems.length === 0
      ? 'No access'
      : selectedGroupCount > 0
        ? `${selectedGroupCount} ${selectedGroupCount === 1 ? 'group' : 'groups'} · ${vaultItems.length} ${
            vaultItems.length === 1 ? 'secret' : 'secrets'
          }`
        : `${vaultItems.length} ${vaultItems.length === 1 ? 'secret' : 'secrets'}`
  const normalizedVaultQuery = vaultQuery.trim().toLowerCase()
  const visibleVaultGroups = vaultGroups
    .map((group) => {
      const groupMatches =
        normalizedVaultQuery.length === 0 ||
        `${group.name} ${group.permission} ${group.vault}`.toLowerCase().includes(normalizedVaultQuery)
      const items = groupMatches
        ? group.items
        : group.items.filter((item) =>
            `${item.name} ${item.kind}`.toLowerCase().includes(normalizedVaultQuery),
          )
      return { group, items }
    })
    .filter(({ items }) => items.length > 0)

  useEffect(() => {
    if (sent.length === 0) return
    const element = messagesRef.current
    element?.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
  }, [sent])

  useEffect(() => {
    if (!openDetail) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenDetail(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openDetail])

  useEffect(() => {
    if (!threadMenuOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setThreadMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [threadMenuOpen])

  useEffect(() => {
    if (!settingsOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSettingsOpen(false)
        setSettingsView('main')
        setVaultQuery('')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [settingsOpen])

  useEffect(() => {
    if (!settingsOpen) return
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Element)) return
      if (event.target.closest('.sd-settings-button') || event.target.closest('.sd-settings-panel')) return
      closeSettings()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [settingsOpen])

  function send() {
    if (!draft.trim()) return
    setSent((current) => [
      ...current,
      {
        id: Date.now(),
        text: draft.trim(),
        at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setDraft('')
  }

  function restartDaemon() {
    setDaemonStatus('restarting')
    window.setTimeout(() => {
      setDaemonStatus('running')
      setRestarts((current) => current + 1)
    }, 700)
  }

  function toggleDetail(section: SectionId) {
    setOpenDetail((current) => (current === section ? null : section))
  }

  function openThread(thread: Thread) {
    setBrowserPage({ kind: 'thread', thread })
    setThreadMenuOpen(false)
  }

  function openWorkspace() {
    setBrowserPage({ kind: 'workspace' })
  }

  function closeSettings() {
    setSettingsOpen(false)
    setSettingsView('main')
    setVaultQuery('')
  }

  function toggleSettings() {
    if (settingsOpen) {
      closeSettings()
      return
    }
    setSettingsView('main')
    setVaultQuery('')
    setSettingsOpen(true)
  }

  function toggleVaultItem(id: string) {
    setVaultItems((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleVaultGroup(group: VaultGroup) {
    const allSelected = group.items.every((item) => vaultItems.includes(item.id))
    setVaultItems((current) =>
      allSelected
        ? current.filter((id) => !group.items.some((item) => item.id === id))
        : Array.from(new Set([...current, ...group.items.map((item) => item.id)])),
    )
  }

  function createThread() {
    const thread: Thread = {
      id: `thread-${Date.now()}`,
      title: `New thread ${threads.length + 1}`,
      count: 0,
    }
    setThreads((current) => [...current, thread])
    openThread(thread)
  }

  function openPaymentThread() {
    const thread = threads.find((item) => item.id === 'payment')
    if (thread) openThread(thread)
  }

  return (
    <div className="sd-shell">
      <div className="sd-page">
      <header className="sd-head">
        <a className="sd-head-back" href="/new-session" aria-label="返回新会话">
          <Icon name="i-left" size={15} />
        </a>
        <span className="sd-status-icon" role="img" aria-label="Ready" title="Ready">
          <Icon name="i-check" size={12} />
        </span>
        <div className="sd-head-title">
          <h1>{data.title}</h1>
          <div
            className="sd-thread-badge-wrap"
            onMouseEnter={() => setThreadMenuOpen(true)}
            onMouseLeave={() => setThreadMenuOpen(false)}
          >
            <button
              className="sd-thread-badge"
              type="button"
              aria-haspopup="menu"
              aria-expanded={threadMenuOpen}
              aria-controls="sd-thread-menu"
              aria-label={`Threads (${threads.length})`}
              onClick={() => setThreadMenuOpen((current) => !current)}
              onFocus={() => setThreadMenuOpen(true)}
            >
              <Icon name="i-split" size={13} />
              Threads
              <span>({threads.length})</span>
              <Icon name={threadMenuOpen ? 'i-up' : 'i-down'} size={12} />
            </button>
            {threadMenuOpen ? (
              <div className="sd-thread-menu" id="sd-thread-menu" role="menu">
                <div className="sd-thread-menu-head">
                  <span>{data.title}</span>
                  <small>Session</small>
                </div>
                {threads.map((thread) => (
                  <button
                    className="sd-thread-tree-item"
                    type="button"
                    role="menuitem"
                    key={thread.id}
                    onClick={() => openThread(thread)}
                  >
                    <span>
                      <strong>{thread.title}</strong>
                      <small>{thread.count} messages</small>
                    </span>
                    <Icon name="i-right" size={13} />
                  </button>
                ))}
                <div className="sd-thread-menu-foot">Open in Browser</div>
              </div>
            ) : null}
          </div>
        </div>
        <>
          {settingsOpen ? (
            <div className="sd-settings-panel" id="sd-settings" role="dialog" aria-label="高级设置">
              {settingsView === 'main' ? (
                <>
                  <div className="sd-settings-head">
                    <strong>高级设置</strong>
                    <button
                      className="sd-settings-close"
                      type="button"
                      aria-label="关闭高级设置"
                      onClick={closeSettings}
                    >
                      <Icon name="i-act-close" size={14} />
                    </button>
                  </div>
                  <label className="sd-setting-row">
                    <span>Computer 生命周期</span>
                    <select value={lifetimeId} onChange={(event) => setLifetimeId(event.target.value)}>
                      {lifetimes.map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="sd-setting-row">
                    <span>Vault access</span>
                    <button
                      className="sd-vault-trigger"
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => setSettingsView('vault')}
                    >
                      <span>{vaultSummary}</span>
                      <Icon name="i-right" size={13} />
                    </button>
                  </div>
                  <label className="sd-setting-row">
                    <span>工具审批</span>
                    <select value={approvalId} onChange={(event) => setApprovalId(event.target.value)}>
                      {approvals.map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="sd-settings-note">
                    不选择就不访问 Vault；可按分组或单条密钥授权，值不会显示在界面里。
                  </p>
                </>
              ) : (
                <>
                  <div className="sd-settings-head">
                    <button
                      className="sd-settings-back"
                      type="button"
                      aria-label="返回高级设置"
                      onClick={() => setSettingsView('main')}
                    >
                      <Icon name="i-left" size={14} />
                    </button>
                    <strong>Vault access</strong>
                    <button
                      className="sd-settings-close"
                      type="button"
                      aria-label="关闭高级设置"
                      onClick={closeSettings}
                    >
                      <Icon name="i-act-close" size={14} />
                    </button>
                  </div>
                  <input
                    className="sd-vault-search"
                    type="search"
                    autoFocus
                    value={vaultQuery}
                    placeholder="搜索分组或密钥"
                    aria-label="搜索分组或密钥"
                    onChange={(event) => setVaultQuery(event.target.value)}
                  />
                  <div className="sd-vault-list">
                    {visibleVaultGroups.length === 0 ? (
                      <p className="sd-vault-empty">没有匹配的分组或密钥。</p>
                    ) : (
                      visibleVaultGroups.map(({ group, items }) => {
                        const allSelected = group.items.every((item) => vaultItems.includes(item.id))
                        const someSelected = group.items.some((item) => vaultItems.includes(item.id))
                        return (
                          <div className="sd-vault-group" key={group.id}>
                            <label className="sd-vault-group-label">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(element) => {
                                  if (element) element.indeterminate = someSelected && !allSelected
                                }}
                                onChange={() => toggleVaultGroup(group)}
                              />
                              <span className="sd-vault-group-copy">
                                <strong>{group.name}</strong>
                                <small>
                                  {group.permission} · {group.vault}
                                </small>
                              </span>
                            </label>
                            <div className="sd-vault-items">
                              {items.map((item) => (
                                <label className="sd-vault-item" key={item.id}>
                                  <input
                                    type="checkbox"
                                    checked={vaultItems.includes(item.id)}
                                    onChange={() => toggleVaultItem(item.id)}
                                  />
                                  <span>{item.name}</span>
                                  <small>{item.kind}</small>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="sd-vault-foot">
                    <span>{vaultItems.length} selected</span>
                    <button
                      className="sd-vault-clear"
                      type="button"
                      disabled={vaultItems.length === 0}
                      onClick={() => setVaultItems([])}
                    >
                      Clear
                    </button>
                    <button className="sd-vault-done" type="button" onClick={() => setSettingsView('main')}>
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </>
        <button
          className={browserPage?.kind === 'workspace' ? 'sd-workspace-button is-active' : 'sd-workspace-button'}
          type="button"
          aria-label={`Workspace ${data.workspace}`}
          onClick={openWorkspace}
        >
          <Icon name="i-ws" size={14} />
          <span>{data.workspace}</span>
          <Icon name="i-right" size={12} />
        </button>
        </header>

      <main className="sd-main">
        <section className="sd-conversation" aria-label="会话消息">
            <div className="sd-messages" ref={messagesRef}>
              <>
                  <SessionMessage label="You" time={data.createdAt} tone="user">
                    <p>{data.prompt}</p>
                    {data.attachments.length > 0 ? (
                      <div className="sd-attachments">
                        {data.attachments.map((name) => (
                          <span className="sd-attachment" key={name}>
                            <Icon name="i-file" size={14} />
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </SessionMessage>

                  <SessionMessage label="Agent" time="09:39">
                    <p>合同共 12 页。我先抽出条款，再对照风险清单逐条检查。</p>
                  </SessionMessage>

                  <ExecutionCard
                    kind="job"
                    title="Extract contract text"
                    state="Completed"
                    icon="i-tasks"
                  >
                    <code className="sd-command">pdftotext contract.pdf -</code>
                    <p className="sd-exec-copy">12 pages · 8,421 characters · exit 0</p>
                    <div className="sd-exec-foot">
                      <span>job_01J8K3</span>
                      <button className="sd-link" type="button" onClick={() => setJobOpen((current) => !current)}>
                        {jobOpen ? 'Hide logs' : 'View logs'}
                      </button>
                    </div>
                    {jobOpen ? (
                      <pre className="sd-log">{`contract.pdf
page 1 ... 12
extracted 8,421 characters in 1.2s`}</pre>
                    ) : null}
                  </ExecutionCard>

                  <ExecutionCard
                    kind="agent"
                    title="Contract reviewer"
                    state="Completed"
                    icon="i-bot"
                  >
                    <p className="sd-exec-copy">
                      按付款、违约金、保密期、终止四条线核对，发现 3 个高风险点。
                    </p>
                    <div className="sd-exec-foot">
                      <span>01:42 · Session-level run</span>
                      <button className="sd-link" type="button" onClick={openPaymentThread}>
                        Open thread
                      </button>
                    </div>
                  </ExecutionCard>

                  <ExecutionCard
                    kind="daemon"
                    title="Clause preview"
                    state={daemonStatus === 'running' ? 'Running' : 'Restarting'}
                    icon="i-pc"
                  >
                    <p className="sd-exec-copy">带批注的合同预览已启动。</p>
                    <div className="sd-daemon-url">
                      <code>http://localhost:4173</code>
                      <a href="http://localhost:4173" target="_blank" rel="noreferrer">
                        Open
                        <Icon name="i-act-external" size={13} />
                      </a>
                    </div>
                    <div className="sd-exec-foot">
                      <span>daemon_01J8K7 · restarts {restarts}</span>
                      <button className="sd-link" type="button" onClick={restartDaemon}>
                        {daemonStatus === 'running' ? 'Restart' : 'Restarting…'}
                      </button>
                    </div>
                  </ExecutionCard>

                  <SessionMessage label="Agent" time="09:41">
                    <p>已定位 3 个高风险点。</p>
                    <ol className="sd-risks">
                      <li>第二笔付款在验收后 30 天支付，但合同没有定义验收标准。</li>
                      <li>违约金只写了上限，没有覆盖逾期付款的逐日计算。</li>
                      <li>保密义务没有期限，终止后仍然无限期有效。</li>
                    </ol>
                    <p>
                      详细批注放在 <button className="sd-inline-link" type="button" onClick={openPaymentThread}>Payment terms</button>{' '}
                      Thread。合同预览已启动，可以直接打开带批注的版本。
                    </p>
                  </SessionMessage>

                  <div className="sd-receipt">
                    <span className="sd-receipt-dot" />
                    Job settled · Extract contract text · exit 0
                  </div>
                </>

              {sent.map((message) => (
                <SessionMessage label="You" time={message.at} tone="user" key={message.id}>
                  <p>{message.text}</p>
                </SessionMessage>
              ))}
              {sent.length > 0 ? (
                <SessionMessage label="Agent" time="now">
                  <p className="sd-working">
                    <span className="sd-status-dot" />
                    Working on your message…
                  </p>
                </SessionMessage>
              ) : null}
            </div>

            <div className="sd-composer-wrap">
              <div className="sd-detail-panel" id="sd-detail-panel" hidden={!openDetail}>
                {openDetail === 'agents' ? (
                  <div className="sd-detail-list">
                    <div className="sd-detail-row">
                      <span className="sd-runtime-icon is-agent"><Icon name="i-bot" size={14} /></span>
                      <span className="sd-detail-row-copy">
                        <strong>Contract reviewer</strong>
                        <small>Session-level run · 01:42 · 3 risks</small>
                      </span>
                      <span className="sd-detail-state is-completed">Completed</span>
                    </div>
                    <div className="sd-detail-row">
                      <span className="sd-runtime-icon is-agent"><Icon name="i-bot" size={14} /></span>
                      <span className="sd-detail-row-copy">
                        <strong>Clause check</strong>
                        <small>Payment terms · 00:18</small>
                      </span>
                      <span className="sd-detail-state is-completed">Completed</span>
                    </div>
                  </div>
                ) : null}

                {openDetail === 'jobs' ? (
                  <div className="sd-detail-list">
                    <div className="sd-detail-row">
                      <span className="sd-runtime-icon is-job"><Icon name="i-tasks" size={14} /></span>
                      <span className="sd-detail-row-copy">
                        <strong>Extract contract text</strong>
                        <small>pdftotext contract.pdf - · exit 0 · 1.2s</small>
                      </span>
                      <span className="sd-detail-state is-completed">Completed</span>
                    </div>
                  </div>
                ) : null}

                {openDetail === 'daemons' ? (
                  <div className="sd-detail-list">
                    <div className="sd-detail-row">
                      <span className="sd-runtime-icon is-daemon"><Icon name="i-pc" size={14} /></span>
                      <span className="sd-detail-row-copy">
                        <strong>Clause preview</strong>
                        <small>http://localhost:4173 · restarts {restarts}</small>
                      </span>
                      <span className={daemonStatus === 'running' ? 'sd-detail-state is-running' : 'sd-detail-state is-restarting'}>
                        {daemonStatus === 'running' ? 'Running' : 'Restarting'}
                      </span>
                    </div>
                  </div>
                ) : null}

                {openDetail === 'files' ? (
                  <div className="sd-detail-list">
                    {fileChanges.map((file) => (
                      <div className="sd-detail-row" key={file.name}>
                        <span className="sd-runtime-icon is-file"><Icon name="i-file" size={14} /></span>
                        <span className="sd-detail-row-copy">
                          <strong>{file.name}</strong>
                          <small>{file.change}</small>
                        </span>
                        <span className="sd-detail-state">{file.state}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                </div>

              <div className="sd-context-bar">
                <button
                  className={openDetail === 'agents' ? 'sd-context-chip is-active' : 'sd-context-chip'}
                  type="button"
                  aria-expanded={openDetail === 'agents'}
                  aria-controls="sd-detail-panel"
                  onClick={() => toggleDetail('agents')}
                >
                  <Icon name="i-bot" size={13} />
                  Agents
                  <span>2 completed</span>
                  <Icon name={openDetail === 'agents' ? 'i-up' : 'i-down'} size={12} />
                </button>
                <button
                  className={openDetail === 'jobs' ? 'sd-context-chip is-active' : 'sd-context-chip'}
                  type="button"
                  aria-expanded={openDetail === 'jobs'}
                  aria-controls="sd-detail-panel"
                  onClick={() => toggleDetail('jobs')}
                >
                  <Icon name="i-tasks" size={13} />
                  Backend jobs
                  <span>1 completed</span>
                  <Icon name={openDetail === 'jobs' ? 'i-up' : 'i-down'} size={12} />
                </button>
                <button
                  className={openDetail === 'daemons' ? 'sd-context-chip is-active' : 'sd-context-chip'}
                  type="button"
                  aria-expanded={openDetail === 'daemons'}
                  aria-controls="sd-detail-panel"
                  onClick={() => toggleDetail('daemons')}
                >
                  <Icon name="i-pc" size={13} />
                  Daemons
                  <span>1 running</span>
                  <Icon name={openDetail === 'daemons' ? 'i-up' : 'i-down'} size={12} />
                </button>
                <button
                  className={openDetail === 'files' ? 'sd-context-chip is-active' : 'sd-context-chip'}
                  type="button"
                  aria-expanded={openDetail === 'files'}
                  aria-controls="sd-detail-panel"
                  onClick={() => toggleDetail('files')}
                >
                  <Icon name="i-file" size={13} />
                  Files
                  <span>{fileChanges.length} changed</span>
                  <Icon name={openDetail === 'files' ? 'i-up' : 'i-down'} size={12} />
                </button>
                <button className="sd-new-thread" type="button" onClick={createThread}>
                  <Icon name="i-plus" size={13} />
                  New thread
                </button>
              </div>

              <div className="sd-composer">
                <textarea
                  className="sd-input"
                  rows={2}
                  value={draft}
                  placeholder="Reply in this thread…"
                  aria-label="回复"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      send()
                    }
                  }}
                />
                <div className="sd-composer-bar">
                  <div className="sd-composer-left">
                    <label className="sd-choice sd-model-choice">
                      <span className="sd-sr-only">模型与思考强度</span>
                      <select
                        value={modelEffort}
                        aria-label="模型与思考强度"
                        onChange={(event) => setModelEffort(event.target.value)}
                      >
                        {modelOptions.map((model) =>
                          effortOptions.map((effort) => (
                            <option value={`${model}::${effort}`} key={`${model}::${effort}`}>
                              {model} · {effort}
                            </option>
                          )),
                        )}
                      </select>
                    </label>
                    <button
                      className={
                        settingsOpen
                          ? 'sd-settings-button sd-composer-settings is-active'
                          : 'sd-settings-button sd-composer-settings'
                      }
                      type="button"
                      aria-label="高级设置"
                      aria-expanded={settingsOpen}
                      aria-controls="sd-settings"
                      onClick={toggleSettings}
                    >
                      <Icon name="i-nav-settings" size={15} />
                    </button>
                  </div>
                  <div className="sd-composer-right">
                    <button className="sd-icon-button" type="button" aria-label="添加附件">
                      <Icon name="i-act-attach" size={17} />
                    </button>
                    {draft.trim() ? (
                      <button className="sd-send" type="button" aria-label="发送" onClick={send}>
                        <Icon name="i-arrow-up" size={16} />
                      </button>
                    ) : (
                      <>
                        <button className="sd-icon-button" type="button" aria-label="语音输入">
                          <Icon name="i-mic" size={17} />
                        </button>
                        <button className="sd-icon-button sd-voice-chat" type="button" aria-label="Voice Chat">
                          <Icon name="i-phone" size={17} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="sd-usage">
                <span className="sd-usage-group">
                  <Icon name="i-clock" size={12} />
                  11 turns · 72 steps · 264 tok/s
                </span>
                <span>3.5M tok · Cache hit 98%</span>
                <span>10% context</span>
              </div>
            </div>
          </section>
      </main>
      </div>

      {browserPage ? (
        <aside className="sd-browser" aria-label="Browser">
          <header className="sd-browser-head">
            <span className="sd-browser-kicker">Browser</span>
            <button
              className="sd-browser-close"
              type="button"
              aria-label="关闭 Browser"
              onClick={() => setBrowserPage(null)}
            >
              <Icon name="i-act-close" size={15} />
            </button>
          </header>
          {browserPage.kind === 'thread' ? (
            <>
              <div className="sd-browser-tab">
                <Icon name="i-split" size={13} />
                <span>{browserPage.thread.title}</span>
                <small>{browserPage.thread.count} messages</small>
              </div>
              <div className="sd-browser-body">
                <span className="sd-browser-mark">
                  <Icon name="i-split" size={22} />
                </span>
                <h2>{browserPage.thread.title}</h2>
                <p>This thread has its own chat page in Browser. The main session stays on Main.</p>
                <span className="sd-browser-note">Thread detail is outside this prototype.</span>
              </div>
            </>
          ) : (
            <>
              <div className="sd-browser-tab">
                <Icon name="i-ws" size={13} />
                <span>{data.workspace}</span>
                <small>Workspace</small>
              </div>
              <div className="sd-browser-files" role="list" aria-label="Workspace files">
                <div className="sd-browser-path">
                  <span>{data.workspace}</span>
                  <small>Workspace files</small>
                </div>
                <div className="sd-browser-file" role="listitem">
                  <Icon name="i-folder" size={14} />
                  <span>contracts</span>
                  <small>Folder</small>
                </div>
                <div className="sd-browser-file" role="listitem">
                  <Icon name="i-file" size={14} />
                  <span>contract.pdf</span>
                  <small>12 pages</small>
                </div>
                <div className="sd-browser-file" role="listitem">
                  <Icon name="i-file" size={14} />
                  <span>review-notes.md</span>
                  <small>Modified</small>
                </div>
                <div className="sd-browser-file" role="listitem">
                  <Icon name="i-file-sheet" size={14} />
                  <span>risk-report.csv</span>
                  <small>Modified</small>
                </div>
              </div>
            </>
          )}
        </aside>
      ) : null}
    </div>
  )
}

function SessionMessage({
  label,
  time,
  tone = 'assistant',
  children,
}: {
  label: string
  time: string
  tone?: 'user' | 'assistant'
  children: ReactNode
}) {
  return (
    <article className={`sd-message sd-message--${tone}`}>
      <div className="sd-message-head">
        <span>{label}</span>
        <time>{time}</time>
      </div>
      <div className="sd-message-body">{children}</div>
    </article>
  )
}

function ExecutionCard({
  kind,
  title,
  state,
  icon,
  children,
}: {
  kind: 'agent' | 'job' | 'daemon'
  title: string
  state: string
  icon: 'i-bot' | 'i-tasks' | 'i-pc'
  children: ReactNode
}) {
  return (
    <article className={`sd-exec sd-exec--${kind}`}>
      <span className="sd-exec-icon">
        <Icon name={icon} size={17} />
      </span>
      <div className="sd-exec-main">
        <div className="sd-exec-head">
          <div className="sd-exec-title">
            <span>{kind === 'agent' ? 'Agent' : kind === 'job' ? 'Backend job' : 'Daemon'}</span>
            <strong>{title}</strong>
          </div>
          <span className={`sd-exec-state is-${state.toLowerCase().replace('…', '')}`}>{state}</span>
        </div>
        {children}
      </div>
    </article>
  )
}
