import { useState } from 'react'
import { ChatComposer } from '../../components/chat-composer'
import { Icon } from '../../components/icon'
import type { AppEntry } from '../apps-index/data'
import { ExclusiveCapsule, ShareDialog } from './exclusive'

const cards = [
  { id: 'solid', title: '固态', note: '冰', symbol: '固' },
  { id: 'liquid', title: '液态', note: '水', symbol: '液' },
  { id: 'gas', title: '气态', note: '水蒸气', symbol: '气' },
  { id: 'change', title: '三态变化', note: '加热 / 冷却', symbol: '变' },
]

export function TeachingAids({ app }: { app: AppEntry }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [tab, setTab] = useState<'cards' | 'activity' | 'print'>('cards')
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant' as const,
      text: '三年级「水的三态」教具包已经排好：4 张可剪卡片、1 份课堂活动和打印说明。',
    },
    {
      id: 2,
      role: 'user' as const,
      text: '卡片再大一点，留出手写区。',
    },
    {
      id: 3,
      role: 'assistant' as const,
      text: '已把卡片高度增加 12mm，每张卡片底部留出两行手写区。',
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
        text: '收到。我会更新教具包，并保持 A4 打印边距不变。',
      },
    ])
  }

  return (
    <div className="ex-page teach-page">
      <header className="ex-appbar teach-appbar">
        <span className="ex-appmark">
          <Icon name={app.icon} size={19} />
        </span>
        <div className="ex-apptitle">
          <strong>{app.name}</strong>
          <span>{app.english}</span>
        </div>
        <span className="teach-context">三年级 · 科学 · 40 分钟</span>
        <div className="ex-actions">
          <button type="button" onClick={() => setShareOpen(true)}>
            <Icon name="i-act-external" size={14} />
            分享
          </button>
          <button type="button">
            <Icon name="i-act-download" size={14} />
            打印包
          </button>
          <ExclusiveCapsule appId={app.id} />
        </div>
      </header>

      <div className="teach-body">
        <aside className="teach-chat" aria-label="教具设计对话">
          <div className="teach-chat-head">
            <span className="teach-chat-avatar">
              <Icon name="i-book" size={15} />
            </span>
            <div>
              <strong>教具助手</strong>
              <span>水的三态 · 三年级</span>
            </div>
            <i aria-hidden="true" />
          </div>
          <div className="teach-chat-feed">
            {messages.map((message) => (
              <div className={`teach-message is-${message.role}`} key={message.id}>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <ChatComposer
            className="teach-composer"
            value={prompt}
            onChange={setPrompt}
            onSubmit={send}
            placeholder="描述课程、年级或想调整的教具…"
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
                  <span>水的三态</span>
                </button>
                <button className="cc-resource" type="button">
                  <Icon name="i-file" size={14} />
                  <span>A4 · 双面</span>
                </button>
                <button className="cc-icon-button" type="button" aria-label="教具设置">
                  <Icon name="i-nav-settings" size={16} />
                </button>
              </>
            }
          />
        </aside>

        <main className="teach-workbench">
          <div className="teach-toolbar">
            <div className="teach-tabs">
              <button
                className={tab === 'cards' ? 'is-active' : ''}
                type="button"
                onClick={() => setTab('cards')}
              >
                教具
              </button>
              <button
                className={tab === 'activity' ? 'is-active' : ''}
                type="button"
                onClick={() => setTab('activity')}
              >
                活动
              </button>
              <button
                className={tab === 'print' ? 'is-active' : ''}
                type="button"
                onClick={() => setTab('print')}
              >
                打印
              </button>
            </div>
            <span>4 张卡片 · 1 份活动</span>
          </div>

          <div className="teach-layout">
            <section className="teach-paper-wrap" aria-label="教具预览">
              <article className="teach-paper">
                <header className="teach-paper-head">
                  <span>SCIENCE / GRADE 3</span>
                  <h2>水的三态</h2>
                  <p>剪下卡片，沿虚线对折，贴在观察记录本上。</p>
                </header>
                {tab === 'cards' ? (
                  <div className="teach-card-grid">
                    {cards.map((card) => (
                      <div className="teach-card" key={card.id}>
                        <span className="teach-card-symbol">{card.symbol}</span>
                        <strong>{card.title}</strong>
                        <span>{card.note}</span>
                        <i className="teach-cut-mark" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                ) : tab === 'activity' ? (
                  <div className="teach-activity">
                    <span className="teach-activity-kicker">课堂活动 / 15 分钟</span>
                    <h3>把三态排成一条变化链</h3>
                    <p>小组把卡片按固态、液态、气态排序，在卡片之间画出加热或冷却的箭头，并说出变化条件。</p>
                    <div className="teach-activity-flow" aria-label="三态变化">
                      <span>固态</span>
                      <i>→</i>
                      <span>液态</span>
                      <i>→</i>
                      <span>气态</span>
                    </div>
                  </div>
                ) : (
                  <div className="teach-print-preview">
                    <span className="teach-activity-kicker">打印预览</span>
                    <h3>双面短边翻转</h3>
                    <p>第 1 页是卡片正面，第 2 页是观察记录。纸张保留 10mm 边距，裁切线仅作参考。</p>
                    <div className="teach-print-specs">
                      <span>A4 · 纵向</span>
                      <span>4 张卡片</span>
                      <span>黑白友好</span>
                    </div>
                  </div>
                )}
                {tab === 'cards' ? (
                  <div className="teach-paper-note">
                    <span>教学提示</span>
                    <p>先让学生观察冰块融化，再把水加热，最后把卡片贴到观察记录本上。</p>
                  </div>
                ) : null}
                <footer className="teach-paper-foot">
                  <span>观察记录 · 姓名 __________</span>
                  <span>Yao Agents · Teaching Aids</span>
                </footer>
              </article>
            </section>

            <aside className="teach-inspector">
              <div className="teach-inspector-head">
                <strong>打印设置</strong>
                <span>A4</span>
              </div>
              <div className="teach-field">
                <span>纸张</span>
                <button type="button">A4 · 纵向 <Icon name="i-down" size={12} /></button>
              </div>
              <div className="teach-field">
                <span>卡片数量</span>
                <button type="button">4 张 <Icon name="i-down" size={12} /></button>
              </div>
              <div className="teach-field">
                <span>裁切线</span>
                <button type="button">显示 <Icon name="i-down" size={12} /></button>
              </div>
              <div className="teach-print-note">
                <Icon name="i-state-info" size={14} />
                打印时保留 10mm 边距，双面短边翻转。
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
