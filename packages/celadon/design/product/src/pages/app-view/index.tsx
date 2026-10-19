import { useEffect, useState } from 'react'
import logo from '../../../../logo-mark-ghost.svg'
import { Icon } from '../../components/icon'
import { apps } from '../new-session/data'
import './app-view.css'

const details: Record<
  string,
  {
    placeholder: string
    summary: string
    bullets: string[]
    domain: string
    workspace: string
  }
> = {
  'poster-studio': {
    placeholder: '描述海报主题、目标尺寸、品牌与文案…',
    summary: '已生成 3 个海报方向与 2 个尺寸版本。',
    bullets: ['3 个视觉方向', '2 个尺寸版本', '品牌色与字体已套用'],
    domain: '/apps/poster-studio',
    workspace: 'Team handbook · Team',
  },
  'product-shots': {
    placeholder: '上传商品图，或粘贴商品链接与平台尺寸…',
    summary: '已生成主图、场景图与卖点标注。',
    bullets: ['1 张主图', '3 张场景图', '2 个平台尺寸'],
    domain: '/apps/product-shots',
    workspace: 'Sandbox · Private',
  },
  'teaching-aids': {
    placeholder: '输入课程主题、年级、课堂时长与知识点…',
    summary: '已生成教具清单、可打印卡片与课堂活动。',
    bullets: ['4 套教具', '12 张卡片', '1 份课堂活动'],
    domain: '/apps/teaching-aids',
    workspace: 'Team handbook · Team',
  },
}

export function AppViewPage({ appId }: { appId: string }) {
  const app = apps.find((item) => item.id === appId)
  const detail = details[appId]
  const fromNewSession = new URLSearchParams(window.location.search).get('from') === 'new-session'
  const backHref = fromNewSession ? '/new-session' : '/apps'
  const backLabel = fromNewSession ? '返回新会话' : '返回 Apps'
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')

  useEffect(() => {
    if (status !== 'running') return
    const timer = window.setTimeout(() => setStatus('done'), 900)
    return () => window.clearTimeout(timer)
  }, [status])

  if (!app || !detail) {
    return (
      <div className="av-page">
        <header className="av-head">
          <a className="av-back" href={backHref} aria-label={backLabel}>
            <Icon name="i-left" size={16} />
          </a>
          <a className="av-brand" href="/">
            <img src={logo} alt="" />
            <span>Yao Agents</span>
          </a>
          <span className="av-crumb">
            <a href="/apps">Apps</a>
          </span>
        </header>
        <main className="av-main">
          <div className="av-empty">
            <Icon name="i-apps" size={24} />
            <strong>找不到这个 App</strong>
            <a className="av-link" href="/apps">
              返回 Apps
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="av-page">
      <header className="av-head">
        <a className="av-back" href={backHref} aria-label={backLabel}>
          <Icon name="i-left" size={16} />
        </a>
        <a className="av-brand" href="/">
          <img src={logo} alt="" />
          <span>Yao Agents</span>
        </a>
        <span className="av-crumb">
          <a href="/apps">Apps</a>
          <span aria-hidden="true"> / </span>
          {app.english}
        </span>
        <div className="av-head-meta">
          <span>产品设计</span>
          <span className="status">草案</span>
        </div>
      </header>

      <main className="av-main">
        <section className="av-hero">
          <span className="av-icon">
            <Icon name={app.icon} size={28} />
          </span>
          <div className="av-hero-copy">
            <span className="eyebrow">APP</span>
            <h1>{app.name}</h1>
            <p>{app.description}</p>
          </div>
          <a className="av-new-session" href="/new-session">
            New session
            <Icon name="i-right" size={15} />
          </a>
        </section>

        <div className="av-grid">
          <section className="av-panel" aria-label="运行 App">
            <div className="av-panel-head">
              <div>
                <h2>Run</h2>
                <span>这个 App 有自己独立的交互界面，不占用 Chatbox。</span>
              </div>
              <span className="av-badge">App domain</span>
            </div>

            <label className="av-input-label" htmlFor="av-input">
              What should this app do?
            </label>
            <textarea
              id="av-input"
              className="av-input"
              rows={4}
              value={prompt}
              placeholder={detail.placeholder}
              onChange={(event) => setPrompt(event.target.value)}
            />

            <div className="av-run-actions">
              <button
                className="av-run"
                type="button"
                disabled={!prompt.trim() || status === 'running'}
                onClick={() => setStatus('running')}
              >
                <Icon name="i-act-play" size={16} />
                {status === 'running' ? 'Running…' : 'Run app'}
              </button>
              <a className="av-link" href="/new-session">
                Open in new session
              </a>
            </div>

            {status !== 'idle' ? (
              <div className="av-output" aria-live="polite">
                <div className="av-output-head">
                  <strong>{status === 'running' ? 'Working…' : 'Run complete'}</strong>
                  <span>{status === 'running' ? 'Just now' : 'Ready to review'}</span>
                </div>
                {status === 'done' ? (
                  <>
                    <p>{detail.summary}</p>
                    <ul>
                      {detail.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="av-muted">Preparing inputs and app domain…</p>
                )}
              </div>
            ) : (
              <div className="av-empty-run">
                <Icon name="i-spark" size={20} />
                <strong>No runs yet</strong>
                <span>输入一个任务，运行结果会留在这个 App 里。</span>
              </div>
            )}
          </section>

          <aside className="av-side">
            <section className="av-side-card">
              <h3>Resources</h3>
              <div className="av-resource">
                <Icon name="i-ws" size={16} />
                <span>
                  <small>Workspace</small>
                  {detail.workspace}
                </span>
              </div>
              <div className="av-resource">
                <Icon name="i-pc" size={16} />
                <span>
                  <small>Computer</small>
                  Mac mini · online
                </span>
              </div>
              <div className="av-resource">
                <Icon name="i-folder" size={16} />
                <span>
                  <small>App domain</small>
                  {detail.domain}
                </span>
              </div>
            </section>

            <section className="av-side-card">
              <h3>Share</h3>
              <p className="av-side-copy">App 入口可以分享给团队或指定链接，不共享 Workspace 与 Vault。</p>
              <span className="av-share-state">
                <Icon name="i-globe" size={14} />
                Team · Link
              </span>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
