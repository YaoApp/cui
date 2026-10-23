import { useEffect, useState } from 'react'
import { Icon } from '../../components/icon'
import './app-view.css'

export function ExclusiveCapsule({ appId }: { appId: string }) {
  return (
    <div className="ex-capsule" aria-label="应用窗口控制">
      <a href={`/apps?minimized=${appId}`} aria-label="最小化">
        <Icon name="i-minus" size={14} />
      </a>
      <a href="/apps" aria-label="关闭应用">
        <Icon name="i-act-close" size={14} />
      </a>
    </div>
  )
}

export function ShareDialog({
  appId,
  appName,
  onClose,
}: {
  appId: string
  appName: string
  onClose: () => void
}) {
  const [visibility, setVisibility] = useState('team')
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/apps/${appId}`

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className="ex-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="ex-share" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <header className="ex-share-head">
          <div>
            <span className="ex-eyebrow">SHARE APP</span>
            <h2 id="share-title">分享 {appName}</h2>
          </div>
          <button className="ex-share-close" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="i-act-close" size={15} />
          </button>
        </header>

        <p className="ex-share-copy">
          分享的是应用入口，不会共享 Builder 的 Workspace、Vault 或运行数据。
        </p>

        <label className="ex-share-field">
          <span>访问范围</span>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            <option value="team">Team · 仅团队可见</option>
            <option value="link">Anyone with link · 拿到链接即可访问</option>
          </select>
        </label>

        <div className="ex-share-link">
          <span>{url}</span>
          <button type="button" onClick={copyLink}>
            {copied ? '已复制' : '复制链接'}
          </button>
        </div>

        <footer className="ex-share-foot">
          <span>当前：{visibility === 'team' ? 'Team' : 'Link'} · 只读入口</span>
          <button className="ex-share-done" type="button" onClick={onClose}>
            Done
          </button>
        </footer>
      </section>
    </div>
  )
}

export function MissingApp() {
  return (
    <div className="ex-missing">
      <span className="ex-eyebrow">APP</span>
      <Icon name="i-apps" size={30} />
      <h1>找不到这个应用</h1>
      <p>它可能已被移除，或没有访问权限。</p>
      <a href="/apps">返回应用列表</a>
    </div>
  )
}
