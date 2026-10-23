import { useEffect, useRef, useState } from 'react'
import { AppNav } from '../../components/app-nav'
import { ChatComposer } from '../../components/chat-composer'
import { CreateEntryModal } from '../../components/create-entry-modal'
import { Icon } from '../../components/icon'
import { MemoryPanel } from '../../components/memory-panel'
import { botProfiles, readBot, type BotProfile } from './data'
import './bots.css'

type ChatMessage = {
  id: number
  role: 'user' | 'bot'
  text: string
}

export function BotsPage({ botId }: { botId?: string }) {
  const bot = botId ? readBot(botId) : undefined
  const [createOpen, setCreateOpen] = useState(
    () => new URLSearchParams(window.location.search).get('create') === 'bot',
  )

  function createSession(description: string, avatar?: string) {
    const prompt = description.trim()
    const firstLine = prompt.split(/[。\n.!?]/)[0]?.trim()
    const title = (firstLine || '新智能体').slice(0, 20)
    const id = `bot-${Date.now()}`
    const createdAt = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())

    window.sessionStorage.setItem(
      `cui.session.${id}`,
      JSON.stringify({
        id,
        title,
        prompt,
        workspace: 'Research',
        computer: 'Mac mini',
        model: 'DeepSeek Flash 4.1',
        effort: 'Balanced',
        vault: 'No access',
        agent: '新智能体',
        avatar,
        runner: 'dsh',
        attachments: [],
        createdAt,
      }),
    )
    window.location.assign(`/sessions/${id}`)
  }

  return (
    <div className="bots-shell">
      <AppNav section="bots" botId={botId} onCreateBot={() => setCreateOpen(true)} />
      {bot ? (
        <BotChat bot={bot} />
      ) : (
        <BotsHome missing={Boolean(botId)} onCreate={() => setCreateOpen(true)} />
      )}
      {createOpen ? (
        <CreateEntryModal
          kind="bot"
          onClose={() => setCreateOpen(false)}
          onCreate={createSession}
        />
      ) : null}
    </div>
  )
}

function BotsHome({ missing, onCreate }: { missing: boolean; onCreate: () => void }) {
  return (
    <main className="bots-home">
      <header className="bots-home-head">
        <div>
          <span className="bots-eyebrow">BOTS</span>
          <h1>智能体</h1>
          <p>选择一个智能体，开始聊天。</p>
        </div>
        <button className="bots-new" type="button" onClick={onCreate}>
          <Icon name="i-plus" size={15} />
          新建智能体
        </button>
      </header>

      <section className="bots-empty" aria-label="选择智能体">
        <span className="bots-empty-icon">
          <Icon name="i-bot" size={34} />
        </span>
        <span className="bots-eyebrow">{missing ? 'NOT FOUND' : 'PICK A BOT'}</span>
        <h2>{missing ? '这个智能体不存在' : '先选择一个智能体'}</h2>
        <p>
          {missing
            ? '返回 Bots 列表，选择一个已有的智能体。'
            : '从左侧选择已有智能体，或新建一个。每个智能体都有自己的身份、技能和工作区。'}
        </p>
        <div className="bots-empty-actions">
          <button className="bots-primary-action" type="button" onClick={onCreate}>
            新建智能体
            <Icon name="i-right" size={14} />
          </button>
        </div>
      </section>

      <div className="bots-home-list" aria-label="推荐智能体">
        {botProfiles.map((item) => (
          <a className="bots-home-card" href={`/bots/${item.id}`} key={item.id}>
            <span className="bots-home-card-icon">
              {item.avatar ? <img src={item.avatar} alt="" /> : <Icon name={item.icon} size={18} />}
            </span>
            <span className="bots-home-card-copy">
              <strong>{item.name}</strong>
              <small>{item.english}</small>
              <span>{item.description}</span>
            </span>
            <Icon name="i-right" size={14} />
          </a>
        ))}
      </div>
    </main>
  )
}

function BotChat({ bot }: { bot: BotProfile }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [attachments, setAttachments] = useState<string[]>([])
  const [recording, setRecording] = useState(false)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const replyTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (replyTimer.current !== null) window.clearTimeout(replyTimer.current)
    }
  }, [])

  useEffect(() => {
    if (messages.length === 0) return
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  function suggest(prompt: string) {
    setDraft(prompt)
  }

  function send() {
    const text = draft.trim()
    if (!text || pending) return
    setDraft('')
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text }])
    setPending(true)
    replyTimer.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: `${bot.name}收到。这个原型先把请求放进会话；下一步会按「${bot.capabilities[0]}」能力开始处理。`,
        },
      ])
      setPending(false)
      replyTimer.current = null
    }, 500)
  }

  return (
    <main className="bots-chat">
      <header className="bots-chat-head">
        <a className="bots-head-back" href="/bots" aria-label="返回智能体列表">
          <Icon name="i-left" size={15} />
        </a>
        <span className="bots-status-icon" role="img" aria-label="Ready" title="Ready">
          <Icon name="i-check" size={12} />
        </span>
        {bot.avatar ? <img className="bots-head-avatar" src={bot.avatar} alt="" /> : null}
        <div className="bots-chat-title">
          <h1>{bot.name}</h1>
        </div>
        <button className="bots-share" type="button">
          <Icon name="i-act-external" size={13} />
          分享
        </button>
        <button className="bots-memory" type="button" aria-label="记忆与身份" onClick={() => setMemoryOpen(true)}>
          <Icon name="i-memory" size={14} />
          <span>Memory</span>
        </button>
        <button className="bots-workspace" type="button" aria-label={`Workspace ${bot.workspace}`}>
          <Icon name="i-ws" size={14} />
          <span>{bot.workspace}</span>
          <Icon name="i-right" size={12} />
        </button>
      </header>

      <div className="bots-chat-body" ref={messagesRef}>
        {messages.length === 0 ? (
          <BotWelcome bot={bot} onSuggest={suggest} />
        ) : (
          <div className="bots-messages">
            {messages.map((message) =>
              message.role === 'user' ? (
                <div className="bots-message is-user" key={message.id}>
                  <div className="bots-bubble">{message.text}</div>
                </div>
              ) : (
                <div className="bots-message is-bot" key={message.id}>
                  <span className="bots-message-avatar">
                    {bot.avatar ? <img src={bot.avatar} alt="" /> : <Icon name={bot.icon} size={15} />}
                  </span>
                  <div className="bots-message-copy">
                    <div className="bots-message-author">{bot.name}</div>
                    <p>{message.text}</p>
                  </div>
                </div>
              ),
            )}
            {pending ? (
              <div className="bots-message is-bot">
                <span className="bots-message-avatar">
                  {bot.avatar ? <img src={bot.avatar} alt="" /> : <Icon name={bot.icon} size={15} />}
                </span>
                <div className="bots-typing" aria-label={`${bot.name} 正在输入`}>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <ChatComposer
        className="bots-chat-composer"
        value={draft}
        onChange={setDraft}
        onSubmit={send}
        placeholder={`给${bot.name}发消息…`}
        canSend={Boolean(draft.trim()) && !pending}
        rows={3}
        submitKey="mod-enter"
        recording={recording}
        onMic={() => setRecording((current) => !current)}
        onVoiceChat={() => {}}
        onFiles={(files) =>
          setAttachments((current) => [...current, ...files.map((file) => file.name)])
        }
        resources={
          <>
            <button className="cc-resource" type="button">
              <Icon name="i-ws" size={14} />
              <span>{bot.workspace}</span>
            </button>
            <button className="cc-resource" type="button">
              <Icon name="i-obj-model" size={14} />
              <span>{bot.model} · {bot.effort}</span>
            </button>
            <button className="cc-icon-button" type="button" aria-label="打开设置">
              <Icon name="i-nav-settings" size={17} />
            </button>
          </>
        }
        attachments={
          attachments.length > 0 ? (
            <div className="cc-attachments">
              {attachments.map((name) => (
                <span className="cc-attachment" key={name}>
                  <Icon name="i-file" size={14} />
                  {name}
                  <button
                    type="button"
                    aria-label={`移除 ${name}`}
                    onClick={() =>
                      setAttachments((current) => current.filter((item) => item !== name))
                    }
                  >
                    <Icon name="i-act-close" size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : undefined
        }
      />
      {memoryOpen ? (
        <MemoryPanel
          variant="bot"
          title={bot.name}
          english={bot.english}
          icon={bot.icon}
          avatar={bot.avatar}
          description={bot.description}
          capabilities={bot.capabilities}
          workspace={bot.workspace}
          model={`${bot.model} · ${bot.effort}`}
          agent={bot.name}
          createdAt="09:38"
          botId={bot.id}
          onClose={() => setMemoryOpen(false)}
        />
      ) : null}
    </main>
  )
}

function BotWelcome({ bot, onSuggest }: { bot: BotProfile; onSuggest: (prompt: string) => void }) {
  return (
    <section className="bots-welcome">
      <span className="bots-welcome-avatar">
        {bot.avatar ? <img src={bot.avatar} alt="" /> : <Icon name={bot.icon} size={30} />}
      </span>
      <span className="bots-eyebrow">{bot.english.toUpperCase()}</span>
      <h2>你好，我是{bot.name}</h2>
      <p>{bot.welcome}</p>
      <div className="bots-capabilities">
        {bot.capabilities.map((capability) => (
          <span key={capability}>{capability}</span>
        ))}
      </div>
      <div className="bots-prompts">
        {bot.prompts.map((prompt) => (
          <button type="button" key={prompt} onClick={() => onSuggest(prompt)}>
            <span>{prompt}</span>
            <Icon name="i-right" size={14} />
          </button>
        ))}
      </div>
      <p className="bots-welcome-note">Bot 的身份、技能和工作区由定义固定。</p>
    </section>
  )
}
