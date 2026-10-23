import { useEffect, useRef, useState } from 'react'
import { botAvatars, defaultBotAvatar } from '../data/avatars'
import { Icon } from './icon'
import './create-entry-modal.css'

type EntryKind = 'app' | 'bot'

const copy = {
  app: {
    eyebrow: 'NEW APP',
    title: '新建应用',
    description: '描述它要解决的问题、给谁用，以及你希望它怎么工作。创建后直接进入会话。',
    label: '应用需求',
    placeholder: '例如：给门店做一张春季会员活动海报，能按品牌规范导出竖版和立版。',
    action: '创建并开始会话',
  },
  bot: {
    eyebrow: 'NEW BOT',
    title: '新建智能体',
    description: '描述它要做什么、怎么工作。创建后直接进入会话。',
    label: '职责描述',
    placeholder: '例如：帮我读合同、核对风险条款，并给出带引用的结论。',
    action: '创建并开始会话',
  },
}

export function CreateEntryModal({
  kind,
  onClose,
  onCreate,
}: {
  kind: EntryKind
  onClose: () => void
  onCreate: (description: string, avatar?: string) => void
}) {
  const [description, setDescription] = useState('')
  const [avatarId, setAvatarId] = useState(defaultBotAvatar.id)
  const [customAvatar, setCustomAvatar] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const text = copy[kind]
  const canCreate = description.trim().length > 0
  const selectedAvatar = customAvatar ?? botAvatars.find((avatar) => avatar.id === avatarId)?.src ?? defaultBotAvatar.src

  useEffect(() => {
    inputRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function submit() {
    if (!canCreate) return
    onCreate(description, kind === 'bot' ? selectedAvatar : undefined)
  }

  return (
    <div
      className="cm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="cm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-entry-title"
        aria-describedby="create-entry-description"
      >
        <header className="cm-head">
          <div>
            <span className="cm-eyebrow">{text.eyebrow}</span>
            <h2 id="create-entry-title">{text.title}</h2>
          </div>
          <button className="cm-close" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="i-act-close" size={15} />
          </button>
        </header>

        <p className="cm-copy" id="create-entry-description">
          {text.description}
        </p>

        {kind === 'bot' ? (
          <div className="cm-avatar">
            <div className="cm-avatar-head">
              <div>
                <span>头像</span>
              </div>
              <div className="cm-avatar-current">
                <button type="button" onClick={() => fileRef.current?.click()}>
                  <Icon name="i-act-upload" size={13} />
                  上传
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      if (typeof reader.result === 'string') setCustomAvatar(reader.result)
                    }
                    reader.readAsDataURL(file)
                    event.target.value = ''
                  }}
                />
              </div>
            </div>
            <div className="cm-avatar-grid">
              {botAvatars.map((avatar) => (
                <button
                  className={!customAvatar && avatar.id === avatarId ? 'cm-avatar-option is-selected' : 'cm-avatar-option'}
                  type="button"
                  key={avatar.id}
                  aria-pressed={!customAvatar && avatar.id === avatarId}
                  aria-label={`${avatar.name} · ${avatar.role}`}
                  title={`${avatar.name} · ${avatar.role}：${avatar.description}`}
                  onClick={() => {
                    setAvatarId(avatar.id)
                    setCustomAvatar(null)
                  }}
                >
                  <img src={avatar.src} alt="" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <label className="cm-field">
          <span>{text.label}</span>
          <textarea
            ref={inputRef}
            rows={5}
            value={description}
            placeholder={text.placeholder}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
          />
        </label>

        <footer className="cm-foot">
          <span className="cm-hint">⌘/Ctrl + Enter 创建</span>
          <button className="cm-secondary" type="button" onClick={onClose}>
            取消
          </button>
          <button className="cm-primary" type="button" disabled={!canCreate} onClick={submit}>
            {text.action}
          </button>
        </footer>
      </section>
    </div>
  )
}
