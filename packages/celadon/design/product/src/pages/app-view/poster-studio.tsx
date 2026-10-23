import { useState } from 'react'
import { ChatComposer } from '../../components/chat-composer'
import { Icon } from '../../components/icon'
import type { AppEntry } from '../apps-index/data'
import { ExclusiveCapsule, ShareDialog } from './exclusive'

export function PosterStudio({ app }: { app: AppEntry }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant' as const,
      text: '海报方向已经准备好。我保留了春季会员活动的安静感，并把主标题压到左侧三分线。',
    },
    {
      id: 2,
      role: 'user' as const,
      text: '再给我一版更克制的，适合门店立牌。',
    },
    {
      id: 3,
      role: 'assistant' as const,
      text: '已生成 3 个克制方向，当前画布是 1080 × 1440 的竖版。可以直接在右侧微调版式。',
    },
  ])

  function send() {
    const text = prompt.trim()
    if (!text) return
    setPrompt('')
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text },
      {
        id: Date.now() + 1,
        role: 'assistant',
        text: '收到。我会把这一版作为新的变体，保留当前画布尺寸和品牌色。',
      },
    ])
  }

  return (
    <div className="ex-page ps-page">
      <header className="ex-appbar ps-appbar">
        <span className="ex-appmark">
          <Icon name={app.icon} size={19} />
        </span>
        <div className="ex-apptitle">
          <strong>{app.name}</strong>
          <span>{app.english}</span>
        </div>
        <span className="ps-context">Field Notes · Spring 2026</span>
        <div className="ex-actions">
          <button type="button" onClick={() => setShareOpen(true)}>
            <Icon name="i-act-external" size={14} />
            分享
          </button>
          <button type="button">
            <Icon name="i-act-download" size={14} />
            导出
          </button>
          <ExclusiveCapsule appId={app.id} />
        </div>
      </header>

      <div className="ps-body">
        <aside className="ps-chat" aria-label="海报设计对话">
          <div className="ps-chat-head">
            <span className="ps-chat-avatar">
              <Icon name="i-spark" size={15} />
            </span>
            <div>
              <strong>设计助手</strong>
              <span>正在看这张画布</span>
            </div>
            <i aria-hidden="true" />
          </div>
          <div className="ps-chat-feed">
            {messages.map((message) => (
              <div className={`ps-message is-${message.role}`} key={message.id}>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <ChatComposer
            className="ps-composer"
            value={prompt}
            onChange={setPrompt}
            onSubmit={send}
            placeholder="描述新的方向、尺寸或文案…"
            canSend={Boolean(prompt.trim())}
            rows={2}
            submitKey="mod-enter"
            onFiles={() => {}}
            onMic={() => {}}
            onVoiceChat={() => {}}
            resources={
              <>
                <button className="cc-resource" type="button">
                  <Icon name="i-book" size={14} />
                  <span>Field Notes</span>
                </button>
                <button className="cc-resource" type="button">
                  <Icon name="i-maximize" size={14} />
                  <span>1080 × 1440</span>
                </button>
                <button className="cc-icon-button" type="button" aria-label="海报设置">
                  <Icon name="i-nav-settings" size={16} />
                </button>
              </>
            }
          />
        </aside>

        <main className="ps-canvas">
          <div className="ps-canvas-toolbar">
            <div className="ps-tabs">
              <button className="is-active" type="button">画布</button>
              <button type="button">变体 <span>3</span></button>
              <button type="button">规格</button>
            </div>
            <div className="ps-canvas-tools">
              <button type="button" aria-label="撤销"><Icon name="i-act-undo" size={15} /></button>
              <button type="button" aria-label="重做"><Icon name="i-act-redo" size={15} /></button>
              <span>100%</span>
            </div>
          </div>

          <div className="ps-stage">
            <div className="ps-artboard">
              <article className="ps-poster">
                <span className="ps-poster-kicker">FIELD NOTES / 01</span>
                <h2>Make room<br />for the quiet.</h2>
                <p>Spring membership<br />2026</p>
                <span className="ps-poster-mark">FN</span>
                <span className="ps-poster-orbit" aria-hidden="true" />
              </article>
              <div className="ps-artboard-foot">
                <span>1080 × 1440 · RGB</span>
                <span>Direction 02 / 03</span>
              </div>
            </div>

            <aside className="ps-inspector">
              <div className="ps-inspector-head">
                <strong>画布</strong>
                <span>竖版</span>
              </div>
              <div className="ps-property">
                <span>尺寸</span>
                <strong>1080 × 1440</strong>
              </div>
              <div className="ps-property">
                <span>版式</span>
                <strong>左对齐 / 三分线</strong>
              </div>
              <div className="ps-property">
                <span>品牌</span>
                <strong>Field Notes</strong>
              </div>
              <div className="ps-swatches" aria-label="品牌色">
                <i />
                <i />
                <i />
              </div>
              <div className="ps-variants">
                <strong>方向</strong>
                <div>
                  <button className="is-active" type="button">01</button>
                  <button type="button">02</button>
                  <button type="button">03</button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {shareOpen ? (
        <ShareDialog appId={app.id} appName={app.name} onClose={() => setShareOpen(false)} />
      ) : null}
    </div>
  )
}
