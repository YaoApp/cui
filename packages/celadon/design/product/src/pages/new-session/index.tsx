import { useEffect, useRef, useState } from 'react'
import logo from '../../../../logo-mark-ghost.svg'
import { Icon } from '../../components/icon'
import { apps, bots, type Recommendation } from './data'
import './new-session.css'

const workspaceGroups = [
  {
    computer: 'Mac mini',
    status: 'online',
    items: [
      { id: 'research', label: 'Research', scope: 'Private' },
      { id: 'handbook', label: 'Team handbook', scope: 'Team' },
    ],
  },
  {
    computer: 'Windows box',
    status: 'online',
    items: [{ id: 'sandbox', label: 'Sandbox', scope: 'Private' }],
  },
  {
    computer: 'Linux pool',
    status: 'available',
    items: [{ id: 'lab-notes', label: 'Lab notes', scope: 'Team' }],
  },
]

const workspaces = workspaceGroups.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    computer: group.computer,
  })),
)

const models = [
  { id: 'deepseek-flash-4-1', label: 'DeepSeek Flash 4.1' },
  { id: 'deepseek-pro-4-1', label: 'DeepSeek Pro 4.1' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
]

const efforts = [
  { id: 'fast', label: 'Fast' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'deep', label: 'Deep' },
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
    id: 'cloudflare-dns',
    name: 'Cloudflare · DNS',
    vault: 'Team Vault · Yao Agents',
    permission: 'DNS edit',
    items: [{ id: 'cloudflare-token', name: 'CLOUDFLARE_API_TOKEN', kind: 'Token' }],
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
]

type CreateMode = 'app' | 'bot' | null

export function NewSessionPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState<CreateMode>(null)
  const [prompt, setPrompt] = useState('')
  const [workspaceId, setWorkspaceId] = useState(workspaces[0].id)
  const [modelId, setModelId] = useState(models[0].id)
  const [effortId, setEffortId] = useState(efforts[1].id)
  const [vaultItems, setVaultItems] = useState<string[]>([])
  const [vaultPickerOpen, setVaultPickerOpen] = useState(false)
  const [vaultQuery, setVaultQuery] = useState('')
  const [lifetimeId, setLifetimeId] = useState(lifetimes[0].id)
  const [approvalId, setApprovalId] = useState(approvals[0].id)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const selected = [...apps, ...bots].find((item) => item.id === selectedId) ?? null
  const workspace = workspaces.find((item) => item.id === workspaceId) ?? workspaces[0]
  const model = models.find((item) => item.id === modelId) ?? models[0]
  const effort = efforts.find((item) => item.id === effortId) ?? efforts[1]
  const selectedGroupCount = vaultGroups.filter(
    (group) => group.items.length > 0 && group.items.every((item) => vaultItems.includes(item.id)),
  ).length
  const vaultSecretLabel = `${vaultItems.length} ${vaultItems.length === 1 ? 'secret' : 'secrets'}`
  const vaultSummary =
    vaultItems.length === 0
      ? 'No access'
      : selectedGroupCount > 0
        ? `${selectedGroupCount} ${selectedGroupCount === 1 ? 'group' : 'groups'} · ${vaultSecretLabel}`
        : vaultSecretLabel
  const normalizedVaultQuery = vaultQuery.trim().toLowerCase()
  const visibleVaultGroups = vaultGroups
    .map((group) => {
      const groupText = `${group.name} ${group.permission} ${group.vault}`.toLowerCase()
      const groupMatch = normalizedVaultQuery.length === 0 || groupText.includes(normalizedVaultQuery)
      const items = groupMatch
        ? group.items
        : group.items.filter((item) =>
            `${item.name} ${item.kind}`.toLowerCase().includes(normalizedVaultQuery),
          )
      return { group, items }
    })
    .filter(({ items }) => items.length > 0)
  const canSend = prompt.trim().length > 0

  useEffect(() => {
    if (!advancedOpen && !vaultPickerOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setAdvancedOpen(false)
      setVaultPickerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [advancedOpen, vaultPickerOpen])

  function choose(item: Recommendation) {
    setSelectedId(item.id)
    setCreateMode(null)
    composerRef.current?.focus()
  }

  function create(mode: Exclude<CreateMode, null>) {
    setCreateMode(mode)
    setSelectedId(null)
    composerRef.current?.focus()
  }

  function submit() {
    if (!canSend) return
    setRecording(false)
    setAdvancedOpen(false)
    setVaultPickerOpen(false)

    const now = new Date()
    const id = `s-${now.getTime().toString(36)}`
    const cleanPrompt = prompt.trim().replace(/\s+/g, ' ')
    const title = cleanPrompt.length > 32 ? `${cleanPrompt.slice(0, 32)}…` : cleanPrompt
    const session = {
      id,
      title,
      prompt: prompt.trim(),
      workspace: workspace.label,
      computer: workspace.computer,
      model: model.label,
      effort: effort.label,
      vault: vaultSummary,
      agent:
        createMode === 'app'
          ? 'Create App'
          : createMode === 'bot'
            ? 'Create Bot'
            : selected?.name ?? 'Yao Agent',
      attachments,
      createdAt: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }

    try {
      window.sessionStorage.setItem(`cui.session.${id}`, JSON.stringify(session))
    } catch {
      // The detail page falls back to its sample session when storage is unavailable.
    }
    window.location.assign(`/sessions/${id}`)
  }

  function toggleVaultItem(id: string) {
    setVaultItems((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleVaultGroup(group: VaultGroup) {
    const allSelected = group.items.every((item) => vaultItems.includes(item.id))
    setVaultItems((current) => {
      if (allSelected) {
        return current.filter((id) => !group.items.some((item) => item.id === id))
      }
      return Array.from(new Set([...current, ...group.items.map((item) => item.id)]))
    })
  }

  return (
    <div className="ns-page">
      <header className="ns-head">
        <a className="ns-brand" href="/">
          <img src={logo} alt="" />
          <span>Yao Agents</span>
        </a>
        <a className="ns-crumb" href="/">← Modules</a>
        <div className="ns-head-meta">
          <span>产品设计</span>
          <span className="status">草案</span>
        </div>
      </header>

      <main className="ns-main">
        <section className="ns-intro">
          <span className="eyebrow">01 · NEW SESSION</span>
          <h1>今天想完成什么？</h1>
          <p className="lede">从推荐的 App 或 Bot 开始，也可以直接描述任务。</p>
        </section>

        <section className="ns-chatbox" aria-label="Chatbox">
          <div className="ns-chapter-head">
            <div className="ns-chapter-title">
              <span className="eyebrow">02 · CHATBOX</span>
              <h2>Chatbox</h2>
            </div>
            <span className="ns-chapter-note">Workspace 决定 Computer，两者合并在一个选择里。</span>
          </div>

          <div className="ns-composer">
            {selected ? (
              <div className="ns-context">
                <span className="ns-context-icon">
                  <Icon name={selected.icon} size={16} />
                </span>
                <span>
                  Chatting with <strong>{selected.name}</strong>
                </span>
                <button
                  className="ns-context-close"
                  type="button"
                  aria-label={`取消选择 ${selected.name}`}
                  onClick={() => setSelectedId(null)}
                >
                  <Icon name="i-act-close" size={14} />
                </button>
              </div>
            ) : null}

            {createMode ? (
              <div className="ns-context is-create">
                <span className="ns-context-icon">
                  <Icon name={createMode === 'app' ? 'i-apps' : 'i-bot'} size={16} />
                </span>
                <span>Create {createMode === 'app' ? 'App' : 'Bot'}</span>
                <button
                  className="ns-context-close"
                  type="button"
                  aria-label="取消创建"
                  onClick={() => setCreateMode(null)}
                >
                  <Icon name="i-act-close" size={14} />
                </button>
              </div>
            ) : null}

            <textarea
              ref={composerRef}
              className="ns-input"
              rows={3}
              value={prompt}
              placeholder={
                createMode === 'app'
                  ? '描述你要创建的 App：解决什么问题，给谁用。'
                  : createMode === 'bot'
                    ? '描述 Bot 的职责、技能与工作方式。'
                    : '描述任务，或选择下面的推荐…'
              }
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault()
                  submit()
                }
              }}
            />

            {recording ? (
              <div className="ns-listening" aria-live="polite">
                <span className="ns-run-dot" />
                Listening…
              </div>
            ) : null}

            <div className="ns-composer-foot">
              <div className="ns-resources">
                <label className="ns-select ns-workspace-select">
                  <Icon name="i-ws" size={16} />
                  <span className="ns-select-label">Workspace 与 Computer</span>
                  <select
                    value={workspaceId}
                    aria-label="Workspace 与 Computer"
                    onChange={(event) => setWorkspaceId(event.target.value)}
                  >
                    {workspaceGroups.map((group) => (
                      <optgroup label={`${group.computer} · ${group.status}`} key={group.computer}>
                        {group.items.map((item) => (
                          <option value={item.id} key={item.id}>
                            {item.label} · {item.scope} · {group.computer}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>

                <label className="ns-choice ns-model-choice">
                  <Icon name="i-obj-model" size={15} />
                  <span className="ns-select-label">模型与思考强度</span>
                  <select
                    value={`${modelId}::${effortId}`}
                    aria-label="模型与思考强度"
                    onChange={(event) => {
                      const [nextModel, nextEffort] = event.target.value.split('::')
                      if (nextModel && nextEffort) {
                        setModelId(nextModel)
                        setEffortId(nextEffort)
                      }
                    }}
                  >
                    {models.map((model) =>
                      efforts.map((effort) => (
                        <option value={`${model.id}::${effort.id}`} key={`${model.id}::${effort.id}`}>
                          {model.label} · {effort.label}
                        </option>
                      )),
                    )}
                  </select>
                </label>
                <button
                  className="ns-icon-button ns-advanced-button"
                  type="button"
                  aria-label="高级设置"
                  aria-expanded={advancedOpen}
                  aria-controls="ns-advanced"
                  onClick={() => setAdvancedOpen((current) => !current)}
                >
                  <Icon name="i-nav-settings" size={17} />
                </button>
              </div>

              <div className="ns-send-area">
                <input
                  ref={fileRef}
                  className="ns-file-input"
                  type="file"
                  multiple
                  onChange={(event) => {
                    const names = Array.from(event.target.files ?? []).map((file) => file.name)
                    setAttachments((current) => [...current, ...names])
                    event.target.value = ''
                  }}
                />
                <button
                  className="ns-icon-button"
                  type="button"
                  aria-label="添加附件"
                  onClick={() => fileRef.current?.click()}
                >
                  <Icon name="i-act-attach" size={18} />
                </button>
                {canSend ? (
                  <button className="ns-send" type="button" aria-label="开始会话" onClick={submit}>
                    <Icon name="i-arrow-up" size={16} />
                  </button>
                ) : (
                  <>
                    <button
                      className={recording ? 'ns-icon-button is-recording' : 'ns-icon-button'}
                      type="button"
                      aria-label={recording ? '停止语音输入' : '语音输入'}
                      aria-pressed={recording}
                      onClick={() => setRecording((current) => !current)}
                    >
                      <Icon name="i-mic" size={18} />
                    </button>
                    <button className="ns-icon-button" type="button" aria-label="Voice Chat">
                      <Icon name="i-phone" size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {advancedOpen ? (
              <div className="ns-advanced" id="ns-advanced" role="dialog" aria-label="高级设置">
                <div className="ns-advanced-head">
                  <strong>高级设置</strong>
                  <button
                    className="ns-context-close"
                    type="button"
                    aria-label="关闭高级设置"
                    onClick={() => setAdvancedOpen(false)}
                  >
                    <Icon name="i-act-close" size={14} />
                  </button>
                </div>
                <label className="ns-field">
                  <span>Computer 生命周期</span>
                  <select value={lifetimeId} onChange={(event) => setLifetimeId(event.target.value)}>
                    {lifetimes.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ns-field">
                  <span>Vault access</span>
                  <button
                    className="ns-vault-trigger"
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => {
                      setAdvancedOpen(false)
                      setVaultPickerOpen(true)
                    }}
                  >
                    <span className="ns-vault-summary">{vaultSummary}</span>
                    <Icon name="i-right" size={13} />
                  </button>
                </div>
                <label className="ns-field">
                  <span>工具审批</span>
                  <select value={approvalId} onChange={(event) => setApprovalId(event.target.value)}>
                    {approvals.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="ns-advanced-note">不选择就不访问 Vault；可按分组或单条密钥授权，值不会显示在界面里。</p>
              </div>
            ) : null}

            {vaultPickerOpen ? (
              <div className="ns-vault-picker" role="dialog" aria-label="选择 Vault 访问">
                <div className="ns-vault-head">
                  <div>
                    <strong>Vault access</strong>
                    <span>只授权本次会话需要的分组或密钥。</span>
                  </div>
                  <button
                    className="ns-context-close"
                    type="button"
                    aria-label="关闭 Vault 选择"
                    onClick={() => setVaultPickerOpen(false)}
                  >
                    <Icon name="i-act-close" size={14} />
                  </button>
                </div>

                <input
                  className="ns-vault-search"
                  type="search"
                  autoFocus
                  value={vaultQuery}
                  placeholder="搜索分组或密钥"
                  aria-label="搜索分组或密钥"
                  onChange={(event) => setVaultQuery(event.target.value)}
                />

                <div className="ns-vault-list">
                  {visibleVaultGroups.length === 0 ? (
                    <p className="ns-vault-empty">没有匹配的分组或密钥。</p>
                  ) : (
                    visibleVaultGroups.map(({ group, items }) => {
                      const allSelected = group.items.every((item) => vaultItems.includes(item.id))
                      const someSelected = group.items.some((item) => vaultItems.includes(item.id))
                      return (
                        <div className="ns-vault-group" key={group.id}>
                          <label className="ns-vault-group-label">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(element) => {
                                if (element) element.indeterminate = someSelected && !allSelected
                              }}
                              onChange={() => toggleVaultGroup(group)}
                            />
                            <span className="ns-vault-group-copy">
                              <strong>{group.name}</strong>
                              <small>
                                {group.permission} · {group.vault}
                              </small>
                            </span>
                          </label>
                          <div className="ns-vault-items">
                            {items.map((item) => (
                              <label className="ns-vault-item" key={item.id}>
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

                <div className="ns-vault-foot">
                  <span>{vaultItems.length} selected</span>
                  <button
                    className="ns-vault-clear"
                    type="button"
                    disabled={vaultItems.length === 0}
                    onClick={() => setVaultItems([])}
                  >
                    Clear
                  </button>
                  <button
                    className="ns-vault-done"
                    type="button"
                    onClick={() => setVaultPickerOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}

            {attachments.length > 0 ? (
              <div className="ns-attachments ns-composer-attachments">
                {attachments.map((name) => (
                  <span className="ns-attachment" key={name}>
                    <Icon name="i-file" size={14} />
                    {name}
                    <button
                      className="ns-attachment-remove"
                      type="button"
                      aria-label={`移除 ${name}`}
                      onClick={() => setAttachments((current) => current.filter((item) => item !== name))}
                    >
                      <Icon name="i-act-close" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="ns-recommend" aria-label="推荐的 Apps 和 Bots">
          <div className="ns-recommend-head">
            <div>
              <span className="eyebrow">03 · START HERE</span>
              <h2>推荐</h2>
            </div>
            <div className="ns-create-actions">
              <button className="ns-create" type="button" onClick={() => create('app')}>
                <Icon name="i-plus" size={15} />
                Create App
              </button>
              <button className="ns-create" type="button" onClick={() => create('bot')}>
                <Icon name="i-plus" size={15} />
                Create Bot
              </button>
            </div>
          </div>

          <RecommendationRow
            title="Apps"
            note="点击进入独立 App 界面"
            items={apps}
            selectedId={selectedId}
            onChoose={choose}
          />
          <RecommendationRow
            title="Bots"
            note="固定形态的 App，点击进入对话"
            items={bots}
            selectedId={selectedId}
            onChoose={choose}
          />
        </section>
      </main>
    </div>
  )
}

function RecommendationRow({
  title,
  note,
  items,
  selectedId,
  onChoose,
}: {
  title: string
  note: string
  items: Recommendation[]
  selectedId: string | null
  onChoose: (item: Recommendation) => void
}) {
  return (
    <div className="ns-row">
      <div className="ns-row-head">
        <h3>{title}</h3>
        <span>{note}</span>
      </div>
      <div className="ns-cards">
        {items.map((item) => {
          const selected = item.id === selectedId
          const content = (
            <>
              <span className="ns-card-icon">
                <Icon name={item.icon} size={20} />
              </span>
              <span className="ns-card-copy">
                <span className="ns-card-title">
                  <strong>{item.name}</strong>
                  <em>{item.english}</em>
                </span>
                <span className="ns-card-desc">{item.description}</span>
                <span className="ns-card-foot">
                  <span className="ns-card-meta">{item.meta}</span>
                  <span className="ns-card-open">{item.kind === 'app' ? 'Open' : selected ? 'Selected' : 'Chat'}</span>
                </span>
              </span>
            </>
          )

          if (item.kind === 'app') {
            return (
              <a
                className="ns-card"
                href={`/apps/${item.id}?from=new-session`}
                key={item.id}
              >
                {content}
              </a>
            )
          }

          return (
            <button
              className={selected ? 'ns-card is-selected' : 'ns-card'}
              type="button"
              key={item.id}
              aria-pressed={selected}
              onClick={() => onChoose(item)}
            >
              {content}
            </button>
          )
        })}
      </div>
    </div>
  )
}
