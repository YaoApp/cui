import { useState } from 'react'
import { ChatComposer } from '../../components/chat-composer'
import { Icon } from '../../components/icon'
import type { AppEntry } from '../apps-index/data'
import { ExclusiveCapsule, ShareDialog } from './exclusive'

type Shot = {
  id: string
  label: string
  kind: string
  size: string
  shape: 'bottle' | 'box' | 'bag' | 'set'
}

const shots: Shot[] = [
  { id: 'hero', label: '主图', kind: '白底 / 商品', size: '1200 × 1200', shape: 'bottle' },
  { id: 'scene', label: '场景图', kind: '浴室 / 暖光', size: '1600 × 1200', shape: 'box' },
  { id: 'features', label: '卖点图', kind: '成分 / 标注', size: '1200 × 1200', shape: 'bag' },
  { id: 'set', label: '组合图', kind: '礼盒 / 全套', size: '1600 × 1200', shape: 'set' },
]

export function ProductShots({ app }: { app: AppEntry }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [selected, setSelected] = useState('hero')
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant' as const,
      text: '主图、场景图和卖点图已经对齐同一套光线。当前选中主图，可以直接切换平台尺寸。',
    },
    {
      id: 2,
      role: 'user' as const,
      text: '把主图改成更适合独立站的留白比例。',
    },
    {
      id: 3,
      role: 'assistant' as const,
      text: '主图已调整为 1:1 留白，背景保持暖白。场景图会同步更新光线。',
    },
  ])

  const shot = shots.find((item) => item.id === selected) ?? shots[0]

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
        text: '收到。我会按当前商品和平台规格生成新的版本，不改变已有主图。',
      },
    ])
  }

  return (
    <div className="ex-page prod-page">
      <header className="ex-appbar prod-appbar">
        <span className="ex-appmark">
          <Icon name={app.icon} size={19} />
        </span>
        <div className="ex-apptitle">
          <strong>{app.name}</strong>
          <span>{app.english}</span>
        </div>
        <span className="prod-context">Aster / 3 SKU · 4 个输出</span>
        <div className="ex-actions">
          <button type="button" onClick={() => setShareOpen(true)}>
            <Icon name="i-act-external" size={14} />
            分享
          </button>
          <button type="button">
            <Icon name="i-act-download" size={14} />
            导出全部
          </button>
          <ExclusiveCapsule appId={app.id} />
        </div>
      </header>

      <div className="prod-body">
        <aside className="prod-chat" aria-label="商品图对话">
          <div className="prod-chat-head">
            <span className="prod-chat-avatar">
              <Icon name="i-spark" size={15} />
            </span>
            <div>
              <strong>商品图助手</strong>
              <span>Aster 洗护系列</span>
            </div>
            <i aria-hidden="true" />
          </div>
          <div className="prod-chat-feed">
            {messages.map((message) => (
              <div className={`prod-message is-${message.role}`} key={message.id}>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <ChatComposer
            className="prod-composer"
            value={prompt}
            onChange={setPrompt}
            onSubmit={send}
            placeholder="描述商品、平台或想改的图…"
            canSend={Boolean(prompt.trim())}
            rows={2}
            submitKey="mod-enter"
            onFiles={() => {}}
            onMic={() => {}}
            onVoiceChat={() => {}}
            resources={
              <>
                <button className="cc-resource" type="button">
                  <Icon name="i-file-sheet" size={14} />
                  <span>Aster / 3 SKU</span>
                </button>
                <button className="cc-resource" type="button">
                  <Icon name="i-maximize" size={14} />
                  <span>独立站 1:1</span>
                </button>
                <button className="cc-icon-button" type="button" aria-label="商品图设置">
                  <Icon name="i-nav-settings" size={16} />
                </button>
              </>
            }
          />
        </aside>

        <main className="prod-workbench">
          <div className="prod-toolbar">
            <div className="prod-tabs">
              <button className="is-active" type="button">商品图</button>
              <button type="button">场景图</button>
              <button type="button">平台尺寸</button>
            </div>
            <span>4 个输出 · 3 个变体</span>
          </div>

          <div className="prod-layout">
            <section className="prod-gallery" aria-label="商品图输出">
              {shots.map((item) => (
                <button
                  className={item.id === selected ? 'prod-tile is-selected' : 'prod-tile'}
                  type="button"
                  key={item.id}
                  onClick={() => setSelected(item.id)}
                >
                  <span className={`prod-thumb is-${item.shape}`}>
                    <span className="prod-object" />
                    <span className="prod-shadow" />
                  </span>
                  <span className="prod-tile-copy">
                    <strong>{item.label}</strong>
                    <small>{item.kind}</small>
                  </span>
                  {item.id === selected ? (
                    <span className="prod-selected-mark">
                      <Icon name="i-check" size={11} />
                    </span>
                  ) : null}
                </button>
              ))}
              <div className="prod-batch">
                <div className="prod-batch-head">
                  <span>本次生成</span>
                  <strong>4 个输出 · 09:12</strong>
                </div>
                <div className="prod-batch-list">
                  <span>主图 v3</span>
                  <span>场景图 · 浴室</span>
                  <span>卖点图 · 成分</span>
                  <span>组合图 · 礼盒</span>
                </div>
              </div>
              <button className="prod-drop" type="button">
                <Icon name="i-act-upload" size={18} />
                <span>
                  <strong>上传新商品图</strong>
                  <small>或拖入一组 SKU，生成新的主图与场景图</small>
                </span>
              </button>
            </section>

            <aside className="prod-inspector">
              <div className="prod-inspector-head">
                <div>
                  <strong>{shot.label}</strong>
                  <span>{shot.size}</span>
                </div>
                <button type="button" aria-label="更多"><Icon name="i-dots" size={15} /></button>
              </div>
              <div className="prod-preview">
                <span className={`prod-preview-object is-${shot.shape}`} />
                <span className="prod-preview-caption">Aster · Daily repair</span>
              </div>
              <div className="prod-field">
                <span>输出平台</span>
                <button type="button">独立站 · 1:1 <Icon name="i-down" size={12} /></button>
              </div>
              <div className="prod-field">
                <span>背景</span>
                <button type="button">暖白 <Icon name="i-down" size={12} /></button>
              </div>
              <div className="prod-field">
                <span>卖点标注</span>
                <button type="button">关闭 <Icon name="i-down" size={12} /></button>
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
