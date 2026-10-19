import logo from '../../../../logo-mark-ghost.svg'
import { Icon } from '../../components/icon'
import { apps } from '../new-session/data'
import '../app-view/app-view.css'
import './apps-index.css'

export function AppsIndexPage() {
  return (
    <div className="av-page">
      <header className="av-head">
        <a className="av-back" href="/" aria-label="返回模块">
          <Icon name="i-left" size={16} />
        </a>
        <a className="av-brand" href="/">
          <img src={logo} alt="" />
          <span>Yao Agents</span>
        </a>
        <span className="av-crumb">Apps</span>
        <div className="av-head-meta">
          <span>产品设计</span>
          <span className="status">草案</span>
        </div>
      </header>

      <main className="av-main">
        <section className="av-hero">
          <span className="av-icon">
            <Icon name="i-apps" size={28} />
          </span>
          <div className="av-hero-copy">
            <span className="eyebrow">APPS</span>
            <h1>Apps</h1>
            <p>可复用的应用入口。每个 App 有自己的界面、绑定资源与分享入口。</p>
          </div>
          <a className="av-new-session" href="/new-session">
            New session
            <Icon name="i-right" size={15} />
          </a>
        </section>

        <div className="ai-grid">
          {apps.map((app) => (
            <a className="ai-card" href={`/apps/${app.id}`} key={app.id}>
              <span className="ai-card-icon">
                <Icon name={app.icon} size={22} />
              </span>
              <span className="ai-card-copy">
                <span className="ai-card-title">
                  <strong>{app.name}</strong>
                  <em>{app.english}</em>
                </span>
                <span className="ai-card-desc">{app.description}</span>
                <span className="ai-card-foot">
                  <span>{app.meta}</span>
                  <span className="ai-card-open">Open</span>
                </span>
              </span>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
