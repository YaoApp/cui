import logo from '../../../logo-mark-ghost.svg'
import { Icon } from './icon'
import { bots } from '../pages/new-session/data'
import './app-nav.css'

type NavSection = 'new' | 'apps' | 'bots' | 'inbox' | 'boards' | 'workspaces' | 'computers'

type AppNavProps = {
  section: NavSection
  botId?: string
  onCreateBot?: () => void
}

const primaryItems: Array<{
  id: Exclude<NavSection, 'bots'>
  label: string
  icon: 'i-new-task' | 'i-apps' | 'i-inbox' | 'i-board' | 'i-ws' | 'i-pc'
  href?: string
}> = [
  { id: 'new', label: '新会话', icon: 'i-new-task', href: '/new-session' },
  { id: 'apps', label: '应用', icon: 'i-apps', href: '/apps' },
  { id: 'inbox', label: '收件箱', icon: 'i-inbox' },
  { id: 'boards', label: '看板', icon: 'i-board' },
  { id: 'workspaces', label: '工作空间', icon: 'i-ws' },
  { id: 'computers', label: '电脑', icon: 'i-pc' },
]

export function AppNav({ section, botId, onCreateBot }: AppNavProps) {
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
        {primaryItems.slice(0, 1).map((item) => (
          <a
            className={`app-nav-row${section === item.id ? ' is-selected' : ''}`}
            href={item.href}
            key={item.id}
          >
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </a>
        ))}
        {primaryItems.slice(1, 2).map((item) => (
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
        {primaryItems.slice(2).map((item) => (
          <span className="app-nav-row is-muted" key={item.id}>
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </span>
        ))}
      </nav>

      {section === 'bots' && onCreateBot ? (
        <BotsSubnav botId={botId} onCreateBot={onCreateBot} />
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
