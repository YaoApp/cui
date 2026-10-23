import { useEffect, useState } from 'react'
import type { IconId } from '../../../../app/src/platform/icons/icon-ids'
import { Icon } from './icon'
import './memory-panel.css'

type MemoryPanelProps = {
  variant: 'session' | 'bot'
  title: string
  english?: string
  icon?: IconId
  avatar?: string
  description?: string
  capabilities?: string[]
  workspace: string
  model: string
  agent: string
  createdAt?: string
  board?: { name: string; column: string }
  botId?: string
  onClose: () => void
}

type TabId = 'board' | 'identity' | 'session' | 'memory'

const logs = [
  {
    date: '2026-10-23',
    label: '今天',
    entries: ['确认合同审核的三条风险线', '把付款条款拆成客户版说明', '记录 Output 的引用格式'],
  },
  {
    date: '2026-10-22',
    label: '昨天',
    entries: ['确定看板默认列与任务归属', '整理会话头部与分享入口'],
  },
  {
    date: '2026-10-21',
    label: '10 月 21 日',
    entries: ['建立合同审核的初始约束'],
  },
]

export function MemoryPanel({
  variant,
  title,
  english,
  icon = 'i-bot',
  avatar,
  description,
  capabilities = [],
  workspace,
  model,
  agent,
  createdAt,
  board,
  botId,
  onClose,
}: MemoryPanelProps) {
  const [tab, setTab] = useState<TabId>('memory')
  const [enabled, setEnabled] = useState(true)
  const [compressed, setCompressed] = useState(false)
  const [openDate, setOpenDate] = useState('2026-10-23')

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const tabs: Array<{ id: TabId; label: string }> =
    variant === 'session'
      ? [
          { id: 'board', label: '看板' },
          { id: 'session', label: '会话' },
          { id: 'memory', label: '记忆' },
        ]
      : [
          { id: 'identity', label: '智能体' },
          { id: 'session', label: '会话' },
          { id: 'memory', label: '记忆' },
        ]

  return (
    <div
      className="mp-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside className="mp-panel" role="dialog" aria-modal="true" aria-labelledby="mp-title">
        <header className="mp-head">
          <div className="mp-head-copy">
            <span className="mp-eyebrow">MEMORY & IDENTITY</span>
            <h2 id="mp-title">{title}</h2>
            <p>{variant === 'bot' ? '智能体身份与会话记忆' : '会话构建与记忆管理'}</p>
          </div>
          <button className="mp-close" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="i-act-close" size={15} />
          </button>
        </header>

        <div className="mp-tabs" role="tablist" aria-label="记忆与身份">
          {tabs.map((item) => (
            <button
              className={tab === item.id ? 'mp-tab is-active' : 'mp-tab'}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              key={item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mp-body">
          {tab === 'board' ? <BoardView board={board} /> : null}
          {tab === 'identity' ? (
            <IdentityView
              title={title}
              english={english}
              icon={icon}
              avatar={avatar}
              description={description}
              capabilities={capabilities}
              workspace={workspace}
              botId={botId}
            />
          ) : null}
          {tab === 'session' ? (
            <SessionView
              title={title}
              workspace={workspace}
              model={model}
              agent={agent}
              createdAt={createdAt}
              board={board}
            />
          ) : null}
          {tab === 'memory' ? (
            <MemoryView
              variant={variant}
              enabled={enabled}
              compressed={compressed}
              openDate={openDate}
              setEnabled={setEnabled}
              setCompressed={setCompressed}
              setOpenDate={setOpenDate}
            />
          ) : null}
        </div>
      </aside>
    </div>
  )
}

function BoardView({ board }: { board?: { name: string; column: string } }) {
  return (
    <section className="mp-section">
      <div className="mp-section-head">
        <div>
          <span className="mp-eyebrow">BOARD CONSTRUCTION</span>
          <h3>{board?.name ?? '未归入看板'}</h3>
        </div>
        <span className="mp-badge">只读</span>
      </div>
      <p className="mp-copy">会话创建后会成为这张看板中的一张任务卡。看板与列在新建会话时确定。</p>
      <div className="mp-board-card">
        <span className="mp-board-icon"><Icon name="i-board" size={18} /></span>
        <div>
          <strong>{board?.name ?? '未选择看板'}</strong>
          <span>{board?.column ?? '未选择列'}</span>
        </div>
        <span className="mp-board-shape" aria-hidden="true" />
      </div>
      <div className="mp-scope-grid">
        <article className="mp-scope is-active">
          <span>看板构建</span>
          <strong>{board?.name ?? '—'} · {board?.column ?? '—'}</strong>
          <p>决定会话归属的工作域，不改变运行状态。</p>
        </article>
        <article className="mp-scope is-future">
          <span>看板记忆</span>
          <strong>后续支持</strong>
          <p>同一看板下的会话共享的长期上下文，与单独会话记忆分开存储。</p>
        </article>
      </div>
    </section>
  )
}

function IdentityView({
  title,
  english,
  icon,
  avatar,
  description,
  capabilities,
  workspace,
  botId,
}: {
  title: string
  english?: string
  icon: IconId
  avatar?: string
  description?: string
  capabilities: string[]
  workspace: string
  botId?: string
}) {
  return (
    <section className="mp-section">
      <div className="mp-section-head">
        <div>
          <span className="mp-eyebrow">AGENT IDENTITY</span>
          <h3>智能体构建</h3>
        </div>
        <span className="mp-badge">只读</span>
      </div>
      <div className="mp-identity">
        <span className="mp-identity-icon">
          {avatar ? <img src={avatar} alt="" /> : <Icon name={icon} size={24} />}
        </span>
        <div>
          <strong>{title}</strong>
          {english ? <span>{english}</span> : null}
          <p>{description ?? '这个智能体的身份由 Bots 定义固定。'}</p>
        </div>
      </div>
      <div className="mp-capabilities">
        {capabilities.length > 0 ? (
          capabilities.map((item) => <span key={item}>{item}</span>)
        ) : (
          <span>Workspace · {workspace}</span>
        )}
      </div>
      <div className="mp-fields">
        <div className="mp-field"><span>Workspace</span><strong>{workspace}</strong></div>
        <div className="mp-field"><span>身份来源</span><strong>Bots 定义</strong></div>
      </div>
      <p className="mp-note">会话内不修改 Bot 的身份、技能与策略。需要调整时到 Bots 模块编辑定义。</p>
      {botId ? <a className="mp-link" href={`/bots/${botId}`}>打开 Bots 定义 <Icon name="i-right" size={13} /></a> : null}
    </section>
  )
}

function SessionView({
  title,
  workspace,
  model,
  agent,
  createdAt,
  board,
}: {
  title: string
  workspace: string
  model: string
  agent: string
  createdAt?: string
  board?: { name: string; column: string }
}) {
  return (
    <section className="mp-section">
      <div className="mp-section-head">
        <div>
          <span className="mp-eyebrow">SESSION CONSTRUCTION</span>
          <h3>会话构建</h3>
        </div>
        <span className="mp-badge">本次会话</span>
      </div>
      <div className="mp-fields">
        <div className="mp-field"><span>标题</span><strong>{title}</strong></div>
        <div className="mp-field"><span>Workspace</span><strong>{workspace}</strong></div>
        <div className="mp-field"><span>主智能体</span><strong>{agent}</strong></div>
        <div className="mp-field"><span>模型</span><strong>{model}</strong></div>
        {board ? <div className="mp-field"><span>看板</span><strong>{board.name} · {board.column}</strong></div> : null}
        {createdAt ? <div className="mp-field"><span>开始时间</span><strong>{createdAt}</strong></div> : null}
      </div>
      <p className="mp-note">会话构建决定这次对话在哪里运行、由谁执行。修改运行参数从下一轮生效。</p>
    </section>
  )
}

function MemoryView({
  variant,
  enabled,
  compressed,
  openDate,
  setEnabled,
  setCompressed,
  setOpenDate,
}: {
  variant: 'session' | 'bot'
  enabled: boolean
  compressed: boolean
  openDate: string
  setEnabled: (enabled: boolean) => void
  setCompressed: (compressed: boolean) => void
  setOpenDate: (date: string) => void
}) {
  const size = compressed ? '2.4 KB' : '3.2 KB'
  const openLog = logs.find((log) => log.date === openDate) ?? logs[0]

  return (
    <section className="mp-section mp-memory">
      <div className="mp-section-head">
        <div>
          <span className="mp-eyebrow">MEMORY</span>
          <h3>记忆管理</h3>
        </div>
        <button
          className={enabled ? 'mp-switch is-on' : 'mp-switch'}
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="开启记忆"
          onClick={() => setEnabled(!enabled)}
        >
          <i />
        </button>
      </div>
      <p className="mp-copy">
        {enabled
          ? '会话结束后继续保留关键事实。每天写入日志，超过阈值时压缩为摘要。'
          : '记忆已关闭。已有日志保留，但后续轮次不再写入新记忆。'}
      </p>

      <div className="mp-scope-grid">
        <article className={enabled ? 'mp-scope is-active' : 'mp-scope'}>
          <span>会话记忆</span>
          <strong>独立存储</strong>
          <p>仅当前 Session 使用，不跨会话共享。</p>
        </article>
        {variant === 'session' ? (
          <article className="mp-scope is-future">
            <span>看板记忆</span>
            <strong>后续支持</strong>
            <p>同一看板下的会话共享，与单会话记忆分开。</p>
          </article>
        ) : null}
      </div>

      <div className="mp-section-subhead">
        <strong>按天日志</strong>
        <span>{logs.length} 天 · {logs.reduce((total, log) => total + log.entries.length, 0)} 条</span>
      </div>
      <div className="mp-logs">
        {logs.map((log) => (
          <div className="mp-log" key={log.date}>
            <button
              className={log.date === openDate ? 'mp-log-head is-open' : 'mp-log-head'}
              type="button"
              onClick={() => setOpenDate(log.date)}
              aria-expanded={log.date === openDate}
            >
              <span>
                <strong>{log.label}</strong>
                <small>{log.date} · {log.entries.length} 条</small>
              </span>
              <Icon name={log.date === openDate ? 'i-up' : 'i-down'} size={13} />
            </button>
            {log.date === openDate ? (
              <ul className="mp-log-entries">
                {openLog.entries.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mp-section-subhead">
        <strong>压缩摘要</strong>
        <span>MEMORY.md · {size} / 8 KB</span>
      </div>
      <div className="mp-summary">
        <div className="mp-meter"><i style={{ inlineSize: compressed ? '30%' : '40%' }} /></div>
        <p>
          {compressed
            ? '已压缩：保留当前目标、已确认的约束与未完成事项；旧日志按日期归档。'
            : '滚动记忆：当前目标、已确认的约束与最近完成的工作。旧内容会按日期归档。'}
        </p>
        <div className="mp-summary-foot">
          <span>{compressed ? '刚刚压缩' : '上次压缩 · 09:38'}</span>
          <button className="mp-action" type="button" onClick={() => setCompressed(true)}>
            压缩摘要
          </button>
        </div>
      </div>
      <div className="mp-files">
        {['MEMORY.md', 'INSTRUCTION.md', 'PREFERENCE.md'].map((file) => (
          <div className="mp-file" key={file}>
            <Icon name="i-file-text" size={14} />
            <span>{file}</span>
            <small>{file === 'MEMORY.md' ? size : file === 'INSTRUCTION.md' ? '0.4 KB' : '0.6 KB'}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
