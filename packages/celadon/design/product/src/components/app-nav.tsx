import type { IconId } from '../../../../app/src/platform/icons/icon-ids'
import logo from '../../../logo-mark-ghost.svg'
import { Icon } from './icon'
import { bots } from '../pages/new-session/data'
import './app-nav.css'

type NavSection = 'new' | 'apps' | 'bots' | 'inbox' | 'boards' | 'workspaces' | 'computers'

export type InboxNavFilter = 'all' | 'unread' | 'bot' | 'notice'

export type InboxNavItem = {
  id: string
  title: string
  preview: string
  time: string
  group: '今天' | '昨天'
  unread: boolean
  kind: 'bot' | 'notification' | 'share'
  icon?: IconId
  tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'brand'
}

export type WorkspaceNavItem = {
  id: string
  name: string
  scope: 'private' | 'team'
  computer: string
  role: string
  readonly: boolean
}

export type BoardNavItem = {
  id: string
  title: string
  english: string
  icon: IconId
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'brand'
  count: number
}

type AppNavProps = {
  section: NavSection
  botId?: string
  inboxUnread?: number
  inboxItems?: InboxNavItem[]
  inboxSelectedId?: string
  inboxFilter?: InboxNavFilter
  inboxCounts?: Record<InboxNavFilter, number>
  onInboxFilterChange?: (filter: InboxNavFilter) => void
  onInboxSelect?: (id: string) => void
  onInboxOverview?: () => void
  boardItems?: BoardNavItem[]
  boardSelectedId?: string
  onBoardSelect?: (id: string) => void
  onCreateBoard?: () => void
  onCreateBot?: () => void
  workspaceItems?: WorkspaceNavItem[]
  workspaceSelectedId?: string
  onWorkspaceSelect?: (id: string) => void
  onWorkspaceOverview?: () => void
  onCreateWorkspace?: () => void
}

const primaryItems: Array<{
  id: Exclude<NavSection, 'bots'>
  label: string
  icon: 'i-new-task' | 'i-apps' | 'i-inbox' | 'i-board' | 'i-ws' | 'i-pc'
  href?: string
}> = [
  { id: 'new', label: '新会话', icon: 'i-new-task', href: '/new-session' },
  { id: 'apps', label: '应用', icon: 'i-apps', href: '/apps' },
  { id: 'inbox', label: '收件箱', icon: 'i-inbox', href: '/inbox' },
  { id: 'boards', label: '看板', icon: 'i-board', href: '/boards' },
  { id: 'workspaces', label: '工作空间', icon: 'i-ws', href: '/workspaces' },
  { id: 'computers', label: '电脑', icon: 'i-pc', href: '/computers' },
]

export function AppNav({
  section,
  botId,
  inboxUnread = 4,
  inboxItems,
  inboxSelectedId,
  inboxFilter = 'all',
  inboxCounts,
  onInboxFilterChange,
  onInboxSelect,
  onInboxOverview,
  boardItems,
  boardSelectedId,
  onBoardSelect,
  onCreateBoard,
  onCreateBot,
  workspaceItems,
  workspaceSelectedId,
  onWorkspaceSelect,
  onWorkspaceOverview,
  onCreateWorkspace,
}: AppNavProps) {
  return (
    <aside className="app-nav" aria-label="主导航">
      <div className="app-nav-brand">
        <a className="app-nav-brand-link" href="/">
          <img src={logo} alt="" />
          <span>Yao Agents</span>
        </a>
        <button className="app-nav-collapse" type="button" aria-label="收起导航">
          <Icon name="i-panel-left" size={15} />
        </button>
      </div>

      <nav className="app-nav-primary" aria-label="一级导航">
        {primaryItems.slice(0, 2).map((item) => (
          <a
            className={`app-nav-row${section === item.id ? ' is-selected' : ''}`}
            href={item.href}
            key={item.id}
          >
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </a>
        ))}
        <a className={`app-nav-row${section === 'bots' ? ' is-selected' : ''}`} href="/bots">
          <Icon name="i-bot" size={17} />
          <span>智能体</span>
        </a>
        {primaryItems.slice(2).map((item) =>
          item.href ? (
            <a
              className={`app-nav-row${section === item.id ? ' is-selected' : ''}`}
              href={item.href}
              key={item.id}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {item.id === 'inbox' && !inboxItems && inboxUnread > 0 ? <span className="app-nav-badge">{inboxUnread}</span> : null}
            </a>
          ) : (
            <span className="app-nav-row is-muted" key={item.id}>
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </span>
          ),
        )}
      </nav>

      {section === 'bots' && onCreateBot ? (
        <BotsSubnav botId={botId} onCreateBot={onCreateBot} />
      ) : null}

      {section === 'inbox' && inboxItems ? (
        <InboxSubnav
          items={inboxItems}
          selectedId={inboxSelectedId}
          filter={inboxFilter}
          counts={inboxCounts}
          unread={inboxUnread}
          onFilterChange={onInboxFilterChange}
          onSelect={onInboxSelect}
          onOverview={onInboxOverview}
        />
      ) : null}

      {section === 'workspaces' && workspaceItems ? (
        <WorkspaceSubnav
          items={workspaceItems}
          selectedId={workspaceSelectedId}
          onSelect={onWorkspaceSelect}
          onOverview={onWorkspaceOverview}
          onCreate={onCreateWorkspace}
        />
      ) : null}

      {section === 'boards' && boardItems ? (
        <BoardsSubnav
          items={boardItems}
          selectedId={boardSelectedId}
          onSelect={onBoardSelect}
          onCreate={onCreateBoard}
        />
      ) : null}

      <div className="app-nav-user">
        <span className="app-nav-avatar" aria-hidden="true">M</span>
        <span className="app-nav-user-name">Mock OAuth User</span>
        <button className="app-nav-user-action" type="button" aria-label="消息">
          <Icon name="i-mail" size={14} />
        </button>
        <button className="app-nav-user-action" type="button" aria-label="设置">
          <Icon name="i-nav-settings" size={14} />
        </button>
      </div>
    </aside>
  )
}

function InboxSubnav({
  items,
  selectedId,
  filter,
  counts,
  unread,
  onFilterChange,
  onSelect,
  onOverview,
}: {
  items: InboxNavItem[]
  selectedId?: string
  filter: InboxNavFilter
  counts?: Record<InboxNavFilter, number>
  unread: number
  onFilterChange?: (filter: InboxNavFilter) => void
  onSelect?: (id: string) => void
  onOverview?: () => void
}) {
  const numbers = counts ?? {
    all: items.length,
    unread: items.filter((item) => item.unread).length,
    bot: items.filter((item) => item.kind === 'bot').length,
    notice: items.filter((item) => item.kind !== 'bot').length,
  }
  const filters: Array<{ id: InboxNavFilter; label: string }> = [
    { id: 'all', label: '全部' },
    { id: 'unread', label: '未读' },
    { id: 'bot', label: '会话' },
    { id: 'notice', label: '通知' },
  ]
  const groups = (['今天', '昨天'] as const)
    .map((group) => ({ group, entries: items.filter((item) => item.group === group) }))
    .filter((entry) => entry.entries.length > 0)

  return (
    <div className="app-nav-sub app-nav-sub--inbox">
      <div className="app-nav-sub-head">
        <button className="app-nav-inbox-overview" type="button" onClick={onOverview}>
          收件箱
        </button>
        <span>{unread} 条未读</span>
      </div>
      <div className="app-nav-inbox-filters" role="tablist" aria-label="收件箱筛选">
        {filters.map((item) => (
          <button
            className={filter === item.id ? 'app-nav-inbox-filter is-active' : 'app-nav-inbox-filter'}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            key={item.id}
            onClick={() => onFilterChange?.(item.id)}
          >
            {item.label}
            <span>{numbers[item.id]}</span>
          </button>
        ))}
      </div>
      <div className="app-nav-inbox-list">
        {groups.length === 0 ? (
          <span className="app-nav-inbox-empty">没有内容</span>
        ) : (
          groups.map((entry) => (
            <div className="app-nav-inbox-group" key={entry.group}>
              <span className="app-nav-inbox-group-label">{entry.group}</span>
              {entry.entries.map((item) => (
                <button
                  className={`app-nav-inbox-row${item.id === selectedId ? ' is-selected' : ''}${item.unread ? ' is-unread' : ''}`}
                  type="button"
                  key={item.id}
                  onClick={() => onSelect?.(item.id)}
                >
                  <span className={`app-nav-inbox-icon is-${item.tone ?? 'neutral'}`}>
                    <Icon
                      name={item.icon ?? (item.kind === 'bot' ? 'i-chat' : item.kind === 'share' ? 'i-bot' : 'i-inbox')}
                      size={14}
                    />
                  </span>
                  <span className="app-nav-inbox-copy">
                    <span className="app-nav-inbox-title">
                      <strong>{item.title}</strong>
                      <small>{item.time}</small>
                    </span>
                    <span>{item.preview}</span>
                  </span>
                  {item.unread ? <span className="app-nav-inbox-dot" aria-label="未读" /> : null}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function BoardsSubnav({
  items,
  selectedId,
  onSelect,
  onCreate,
}: {
  items: BoardNavItem[]
  selectedId?: string
  onSelect?: (id: string) => void
  onCreate?: () => void
}) {
  return (
    <div className="app-nav-sub app-nav-sub--boards">
      <div className="app-nav-sub-head">
        <span>看板</span>
        <span>{items.length} 个</span>
      </div>
      <nav className="app-nav-board-list" aria-label="看板列表">
        {items.map((item) => (
          <button
            className={`app-nav-board-row${item.id === selectedId ? ' is-selected' : ''}`}
            type="button"
            key={item.id}
            onClick={() => onSelect?.(item.id)}
          >
            <span className={`app-nav-board-icon is-${item.tone}`}>
              <Icon name={item.icon} size={14} />
            </span>
            <span className="app-nav-board-copy">
              <strong>{item.title}</strong>
              <small>{item.english}</small>
            </span>
            <span className="app-nav-board-count">{item.count}</span>
          </button>
        ))}
      </nav>
      {onCreate ? (
        <button className="app-nav-sub-new" type="button" onClick={onCreate}>
          <Icon name="i-plus" size={14} />
          <span>新建看板</span>
        </button>
      ) : null}
    </div>
  )
}

function BotsSubnav({ botId, onCreateBot }: { botId?: string; onCreateBot: () => void }) {
  return (
    <div className="app-nav-sub">
      <div className="app-nav-sub-head">
        <span>智能体</span>
        <button className="app-nav-sub-add" type="button" aria-label="新建智能体" onClick={onCreateBot}>
          <Icon name="i-plus" size={14} />
        </button>
      </div>
      <nav className="app-nav-sub-list" aria-label="智能体列表">
        {bots.map((bot) => (
          <a
            className={`app-nav-sub-row${bot.id === botId ? ' is-selected' : ''}`}
            href={`/bots/${bot.id}`}
            key={bot.id}
          >
            <span className="app-nav-bot-icon">
              {bot.avatar ? <img src={bot.avatar} alt="" /> : <Icon name={bot.icon} size={14} />}
            </span>
            <span className="app-nav-sub-copy">
              <strong>{bot.name}</strong>
              <small>{bot.english}</small>
            </span>
          </a>
        ))}
      </nav>
      <button className="app-nav-sub-new" type="button" onClick={onCreateBot}>
        <Icon name="i-plus" size={14} />
        <span>新建智能体</span>
      </button>
    </div>
  )
}

function WorkspaceSubnav({
  items,
  selectedId,
  onSelect,
  onOverview,
  onCreate,
}: {
  items: WorkspaceNavItem[]
  selectedId?: string
  onSelect?: (id: string) => void
  onOverview?: () => void
  onCreate?: () => void
}) {
  const groups = (['private', 'team'] as const).map((scope) => ({
    scope,
    label: scope === 'private' ? '我的工作空间' : '团队工作空间',
    entries: items.filter((item) => item.scope === scope),
  })).filter((group) => group.entries.length > 0)

  return (
    <div className="app-nav-sub app-nav-sub--workspaces">
      <div className="app-nav-sub-head">
        <button className="app-nav-workspace-overview" type="button" onClick={onOverview}>
          工作空间
        </button>
        <span>{items.length} 个</span>
      </div>
      <div className="app-nav-workspace-list">
        {groups.map((group) => (
          <div className="app-nav-workspace-group" key={group.scope}>
            <span className="app-nav-workspace-group-label">{group.label}</span>
            {group.entries.map((item) => (
              <button
                className={`app-nav-workspace-row${item.id === selectedId ? ' is-selected' : ''}`}
                type="button"
                key={item.id}
                onClick={() => onSelect?.(item.id)}
              >
                <span className={`app-nav-workspace-icon is-${item.scope}`}>
                  <Icon name={item.scope === 'private' ? 'i-lock' : 'i-ws'} size={14} />
                </span>
                <span className="app-nav-workspace-copy">
                  <span className="app-nav-workspace-title">
                    <strong>{item.name}</strong>
                    {item.readonly ? <small>只读</small> : null}
                  </span>
                  <span>{item.computer} · {item.role}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
      {onCreate ? (
        <button className="app-nav-sub-new" type="button" onClick={onCreate}>
          <Icon name="i-plus" size={14} />
          <span>新建工作空间</span>
        </button>
      ) : null}
    </div>
  )
}
