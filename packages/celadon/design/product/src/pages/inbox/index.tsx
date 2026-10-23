import { useEffect, useState } from 'react'
import { AppNav, type InboxNavFilter } from '../../components/app-nav'
import { ChatComposer } from '../../components/chat-composer'
import { Icon } from '../../components/icon'
import { inboxItems, kindOfFilter, type InboxItem } from './data'
import './inbox.css'

export function InboxPage() {
  const [items, setItems] = useState(inboxItems)
  const [filter, setFilter] = useState<InboxNavFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const unreadCount = items.filter((item) => item.unread).length
  const visibleItems = items.filter((item) => kindOfFilter(item, filter))
  const counts: Record<InboxNavFilter, number> = {
    all: items.length,
    unread: unreadCount,
    bot: items.filter((item) => item.kind === 'bot').length,
    notice: items.filter((item) => item.kind !== 'bot').length,
  }
  const selected = items.find((item) => item.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId) return
    if (!visibleItems.some((item) => item.id === selectedId)) {
      setSelectedId(null)
    }
  }, [selectedId, visibleItems])

  function select(item: InboxItem) {
    setSelectedId(item.id)
    if (item.unread) {
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)))
    }
  }

  function selectById(id: string) {
    const item = items.find((entry) => entry.id === id)
    if (item) select(item)
  }

  function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, unread: false })))
  }

  return (
    <div className="inbox-shell">
      <AppNav
        section="inbox"
        inboxUnread={unreadCount}
        inboxItems={visibleItems}
        inboxSelectedId={selectedId ?? undefined}
        inboxFilter={filter}
        inboxCounts={counts}
        onInboxFilterChange={setFilter}
        onInboxSelect={selectById}
        onInboxOverview={() => setSelectedId(null)}
      />
      <main className="inbox-main">
        <div className={selected?.kind === 'bot' ? 'inbox-content is-session' : 'inbox-content'}>
          {selected?.kind === 'bot' ? (
            <InboxDetail item={selected} />
          ) : (
            <>
              <header className="inbox-head">
                <span className="inbox-title-icon"><Icon name="i-inbox" size={16} /></span>
                <h1>收件箱</h1>
                <div className="inbox-head-actions">
                  <button className="inbox-mark-all" type="button" disabled={unreadCount === 0} onClick={markAllRead}>
                    <Icon name="i-check" size={14} />
                    全部标为已读
                  </button>
                </div>
              </header>
              {selected ? <InboxDetail item={selected} /> : <InboxSummary items={items} onSelect={select} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function InboxSummary({ items, onSelect }: { items: InboxItem[]; onSelect: (item: InboxItem) => void }) {
  const unread = items.filter((item) => item.unread)
  const approvals = items.filter((item) => item.approval)
  const completed = items.filter((item) => item.status === '已完成')
  const priority = (unread.length > 0 ? unread : items).slice(0, 3)

  return (
    <section className="inbox-summary">
      <div className="inbox-summary-head">
        <span className="inbox-eyebrow">OVERVIEW</span>
        <h2>今天先处理这些</h2>
        <p>左侧是收件箱的二级列表。选中一条会话、通知或审批，右侧会展开对应的处理界面。</p>
      </div>
      <div className="inbox-summary-stats">
        <div><strong>{unread.length}</strong><span>未读</span></div>
        <div><strong>{approvals.length}</strong><span>等待审批</span></div>
        <div><strong>{completed.length}</strong><span>今日完成</span></div>
      </div>
      <div className="inbox-summary-section">
        <div className="inbox-section-title">
          <strong>优先处理</strong>
          <span>{priority.length} 条</span>
        </div>
        <div className="inbox-summary-list">
          {priority.map((item) => (
            <button className="inbox-summary-row" type="button" key={item.id} onClick={() => onSelect(item)}>
              <InboxAvatar item={item} />
              <span className="inbox-summary-copy">
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.time}</small>
                </span>
                <span>{item.preview}</span>
              </span>
              <Icon name="i-right" size={13} />
            </button>
          ))}
        </div>
      </div>
      <div className="inbox-summary-tip">
        <Icon name="i-inbox" size={15} />
        没有选择消息时显示这个汇总；选择左侧条目后进入处理界面。
      </div>
    </section>
  )
}

function InboxAvatar({ item }: { item: InboxItem }) {
  if (item.avatar) {
    return (
      <span className="inbox-avatar">
        <img src={item.avatar} alt="" />
      </span>
    )
  }
  return (
    <span className={`inbox-avatar inbox-avatar--icon is-${item.tone ?? 'neutral'}`}>
      <Icon name={item.icon ?? 'i-inbox'} size={17} />
    </span>
  )
}

function InboxDetail({ item }: { item: InboxItem }) {
  const sessionHref = `/sessions/${item.sessionId ?? 'demo'}`
  const isBot = item.kind === 'bot'
  const isShare = item.kind === 'share'

  return (
    <article className="inbox-detail">
      <div className="inbox-detail-body">
        {isBot ? <BotThread item={item} /> : null}
        {isShare ? <ShareDetail item={item} /> : null}
        {item.approval ? <ApprovalView item={item} /> : null}
        {item.kind === 'notification' && !item.approval ? <NotificationDetail item={item} sessionHref={sessionHref} /> : null}
      </div>
      {isBot ? <InboxReply item={item} /> : null}
    </article>
  )
}

function BotThread({ item }: { item: InboxItem }) {
  return (
    <>
      <div className="inbox-context-line">
        {item.board ? (
          <span className="inbox-context-chip">
            <Icon name="i-board" size={13} />
            {item.board.name} · {item.board.column}
          </span>
        ) : null}
        <span>{item.meta}</span>
        <span className="inbox-context-spacer" />
        <span>会话记忆已开启</span>
      </div>
      <div className="inbox-thread">
        {(item.messages ?? []).map((message, index) => (
          <div className={`inbox-message is-${message.from}`} key={`${message.time}-${index}`}>
            {message.from === 'bot' ? (
              <span className="inbox-message-avatar">
                {item.avatar ? <img src={item.avatar} alt="" /> : <Icon name="i-bot" size={14} />}
              </span>
            ) : null}
            <div className="inbox-message-main">
              <div className="inbox-bubble">{message.text}</div>
              {message.attachment ? (
                <span className="inbox-attachment">
                  <Icon name="i-file-text" size={13} />
                  {message.attachment}
                </span>
              ) : null}
              <span className="inbox-message-time">{message.time}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function InboxReply({ item }: { item: InboxItem }) {
  const [draft, setDraft] = useState('')
  return (
    <div className="inbox-reply">
      <ChatComposer
        value={draft}
        onChange={setDraft}
        onSubmit={() => setDraft('')}
        placeholder="回复这条会话..."
        canSend={draft.trim().length > 0}
        rows={2}
        context={
          <div className="inbox-reply-context">
            <Icon name="i-bot" size={13} />
            {item.subtitle}
          </div>
        }
        resources={<span className="inbox-reply-resource">DeepSeek Flash 4.1 · Balanced</span>}
        onFiles={() => undefined}
        onMic={() => undefined}
        onVoiceChat={() => undefined}
      />
    </div>
  )
}

function ApprovalView({ item }: { item: InboxItem }) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const approval = item.approval
  if (!approval) return null

  return (
    <>
      <div className="inbox-approval-hero">
        <span className="inbox-approval-icon"><Icon name="i-state-warning" size={24} /></span>
        <div>
          <span className="inbox-eyebrow">APPROVAL · TOOL CALL</span>
          <h3>需要你批准</h3>
          <p>{item.detail}</p>
        </div>
      </div>
      <div className="inbox-command">
        <span>将要运行</span>
        <code>{approval.command}</code>
      </div>
      <div className="inbox-facts">
        <div><span>用途</span><strong>{approval.reason}</strong></div>
        <div><span>影响</span><strong>{approval.risk}</strong></div>
        <div><span>范围</span><strong>{approval.scope}</strong></div>
      </div>
      <div className="inbox-approval-form">
        <div className="inbox-section-title">
          <strong>审批决定</strong>
          <span>{decision === 'approved' ? '已批准' : decision === 'rejected' ? '已拒绝' : '等待你选择'}</span>
        </div>
        {decision ? (
          <p className="inbox-approval-result">
            {decision === 'approved' ? '已批准一次。Agent 可以继续执行这条命令。' : '已拒绝。Agent 会停止这条命令，可以回到会话说明原因。'}
          </p>
        ) : (
          <div className="inbox-approval-actions">
            <button className="inbox-approval-primary" type="button" onClick={() => setDecision('approved')}>
              批准一次
            </button>
            <button className="inbox-approval-secondary" type="button" onClick={() => setDecision('rejected')}>
              拒绝
            </button>
          </div>
        )}
        <label className="inbox-approval-remember">
          <input type="checkbox" />
          本会话内记住这个范围
        </label>
      </div>
    </>
  )
}

function NotificationDetail({ item, sessionHref }: { item: InboxItem; sessionHref: string }) {
  return (
    <>
      <div className={`inbox-notice-hero is-${item.tone ?? 'neutral'}`}>
        <span className="inbox-notice-icon">
          <Icon name={item.icon ?? 'i-inbox'} size={24} />
        </span>
        <div>
          <span className="inbox-eyebrow">{item.subtitle}</span>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
        </div>
      </div>
      <div className="inbox-facts">
        <div><span>状态</span><strong>{item.status ?? '已通知'}</strong></div>
        <div><span>来源</span><strong>{item.meta}</strong></div>
        <div><span>时间</span><strong>{item.group} · {item.time}</strong></div>
      </div>
      <a className="inbox-related" href={sessionHref}>
        <span className="inbox-related-icon"><Icon name="i-chat" size={16} /></span>
        <span>
          <strong>审查合同条款</strong>
          <small>回到会话查看完整结果</small>
        </span>
        <Icon name="i-right" size={14} />
      </a>
    </>
  )
}

function ShareDetail({ item }: { item: InboxItem }) {
  return (
    <>
      <div className="inbox-share-card">
        <span className="inbox-share-avatar">
          {item.avatar ? <img src={item.avatar} alt="" /> : <Icon name="i-bot" size={24} />}
        </span>
        <div>
          <span className="inbox-eyebrow">SHARED BOT</span>
          <h3>研究员</h3>
          <p>{item.detail}</p>
        </div>
      </div>
      <div className="inbox-facts">
        <div><span>能力</span><strong>{item.meta}</strong></div>
        <div><span>身份来源</span><strong>分享方的 Bot 定义</strong></div>
        <div><span>Workspace</span><strong>Research · Private</strong></div>
      </div>
      <div className="inbox-thread-foot">
        <div>
          <strong>在你的 Workspace 开始</strong>
          <span>会创建新的 Session，分享方的会话与文件不会暴露。</span>
        </div>
        <span className="inbox-thread-actions">
          <a className="inbox-secondary" href="/bots/researcher">查看 Bot</a>
          <a className="inbox-primary" href={`/sessions/${item.sessionId ?? 'demo'}`}>开始对话</a>
        </span>
      </div>
    </>
  )
}
