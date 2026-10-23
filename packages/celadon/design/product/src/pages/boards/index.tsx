import type { IconId } from '../../../../app/src/platform/icons/icon-ids'
import { useEffect, useMemo, useState } from 'react'
import { AppNav, type BoardNavItem } from '../../components/app-nav'
import { ChatComposer } from '../../components/chat-composer'
import { Icon } from '../../components/icon'
import {
  boards,
  countStatus,
  filterTasks,
  statusMeta,
  type BoardData,
  type BoardFilter,
  type BoardTask,
  type BoardColumn,
  type BoardTone,
} from './data'
import './boards.css'

const FILTERS: Array<{ id: BoardFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待开始' },
  { id: 'running', label: '运行中' },
  { id: 'waiting', label: '等待中' },
  { id: 'completed', label: '已完成' },
  { id: 'failed', label: '失败' },
]

type TaskTab = 'chat' | 'info' | 'files' | 'run'

export function BoardsPage() {
  const [boardId, setBoardId] = useState('board-ops')
  const [filter, setFilter] = useState<BoardFilter>('all')
  const [query, setQuery] = useState('')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [createdTasks, setCreatedTasks] = useState<Record<string, BoardTask[]>>({})
  const [customBoards, setCustomBoards] = useState<BoardData[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createBoardOpen, setCreateBoardOpen] = useState(false)
  const [createColumn, setCreateColumn] = useState('')

  const allBoards = useMemo(() => [...Object.values(boards), ...customBoards], [customBoards])
  const board = allBoards.find((item) => item.id === boardId) ?? allBoards[0]
  const boardTasks = [...board.tasks, ...(createdTasks[boardId] ?? [])]
  const visibleTasks = filterTasks(boardTasks, filter, query)
  const selectedTask = boardTasks.find((task) => task.id === taskId) ?? null
  const selectedColumn = selectedTask ? board.columns.find((column) => column.id === selectedTask.columnId) ?? null : null

  useEffect(() => {
    setTaskId(null)
    setFilter('all')
    setQuery('')
  }, [boardId])

  useEffect(() => {
    if (!taskId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTaskId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [taskId])

  const navItems: BoardNavItem[] = allBoards.map((item) => ({
    id: item.id,
    title: item.title,
    english: item.english,
    icon: item.icon,
    tone: item.tone,
    count: item.tasks.length + (createdTasks[item.id]?.length ?? 0),
  }))

  function addBoard(input: { title: string; english: string; icon: IconId; tone: BoardTone }) {
    const id = `board-${Date.now()}`
    const columns: BoardColumn[] = [
      { id: `${id}-todo`, title: '待办', icon: 'i-state-queued', tone: 'neutral' },
      { id: `${id}-doing`, title: '进行中', icon: 'i-state-loading', tone: 'brand' },
      { id: `${id}-done`, title: '已完成', icon: 'i-check', tone: 'success' },
    ]
    const next: BoardData = {
      id,
      title: input.title,
      english: input.english,
      icon: input.icon,
      tone: input.tone,
      description: '新建看板',
      updatedAt: '刚刚',
      columns,
      tasks: [],
    }
    setCustomBoards((current) => [...current, next])
    setCreateBoardOpen(false)
    setBoardId(id)
  }

  function addTask(input: { title: string; description: string; columnId: string }) {
    const task: BoardTask = {
      id: `task-created-${Date.now()}`,
      title: input.title,
      description: input.description,
      status: 'pending',
      columnId: input.columnId,
      workspace: 'new-workspace',
      assistant: '未分配',
      tags: ['新建'],
      updatedAt: '刚刚',
      messages: input.description
        ? [{ from: 'user', text: input.description, time: '刚刚' }]
        : undefined,
    }
    setCreatedTasks((current) => ({
      ...current,
      [boardId]: [...(current[boardId] ?? []), task],
    }))
    setCreateOpen(false)
    setFilter('all')
    setQuery('')
    setTaskId(task.id)
  }

  return (
    <div className="boards-shell">
      <AppNav
        section="boards"
        boardItems={navItems}
        boardSelectedId={boardId}
        onBoardSelect={setBoardId}
        onCreateBoard={() => setCreateBoardOpen(true)}
      />
      <main className="boards-main">
        <section className="boards-panel" aria-label={`${board.title} 看板`}>
          <header className="boards-head">
            <span className={`boards-head-icon is-${board.tone}`}>
              <Icon name={board.icon} size={17} />
            </span>
            <div className="boards-head-copy">
              <h1>{board.title}</h1>
              <span>{board.english} · {boardTasks.length} 个任务 · {board.updatedAt}</span>
            </div>
          </header>

          <div className="boards-toolbar">
            <div className="boards-filters" role="tablist" aria-label="任务状态筛选">
              {FILTERS.map((item) => (
                <button
                  className={filter === item.id ? 'boards-filter is-active' : 'boards-filter'}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                  <span>{countStatus(boardTasks, item.id)}</span>
                </button>
              ))}
            </div>
            <label className="boards-search">
              <Icon name="i-search" size={14} />
              <input
                type="search"
                value={query}
                placeholder="搜索任务、Workspace 或 Bot"
                aria-label="搜索任务"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button
              className="boards-create-task"
              type="button"
              onClick={() => {
                setCreateColumn(board.columns[0].id)
                setCreateOpen(true)
              }}
            >
              <Icon name="i-plus" size={14} />
              新建任务
            </button>
          </div>

          <div className="boards-surface">
            {visibleTasks.length === 0 && boardTasks.length > 0 ? (
              <div className="boards-empty">
                <span><Icon name="i-board" size={24} /></span>
                <strong>没有匹配的任务</strong>
                <p>调整筛选或搜索词后再试。</p>
              </div>
            ) : (
              <div className="boards-columns">
                {board.columns.map((column) => (
                  <BoardColumnView
                    key={column.id}
                    column={column}
                    tasks={visibleTasks.filter((task) => task.columnId === column.id)}
                    selectedTaskId={taskId}
                    onSelect={setTaskId}
                    onAddTask={() => {
                      setCreateColumn(column.id)
                      setCreateOpen(true)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {selectedTask && selectedColumn ? (
          <TaskPanel
            task={selectedTask}
            column={selectedColumn}
            onClose={() => setTaskId(null)}
          />
        ) : null}
      </main>

      {createOpen ? (
        <CreateTaskDialog
          board={board}
          defaultColumn={createColumn || board.columns[0].id}
          onClose={() => setCreateOpen(false)}
          onCreate={addTask}
        />
      ) : null}
      {createBoardOpen ? (
        <CreateBoardDialog
          onClose={() => setCreateBoardOpen(false)}
          onCreate={addBoard}
        />
      ) : null}
    </div>
  )
}

function BoardColumnView({
  column,
  tasks,
  selectedTaskId,
  onSelect,
  onAddTask,
}: {
  column: BoardColumn
  tasks: BoardTask[]
  selectedTaskId: string | null
  onSelect: (id: string) => void
  onAddTask: () => void
}) {
  const sorted = [...tasks].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))

  return (
    <section className="board-column" aria-label={column.title}>
      <header className="board-column-head">
        <span className={`board-column-icon is-${column.tone}`}>
          <Icon name={column.icon} size={14} />
        </span>
        <strong>{column.title}</strong>
        <span className="board-column-count">{tasks.length}</span>
        <button className="board-column-add" type="button" aria-label={`在${column.title}添加任务`} onClick={onAddTask}>
          <Icon name="i-plus" size={14} />
        </button>
      </header>
      <div className="board-column-cards">
        {sorted.length === 0 ? (
          <div className="board-column-empty">暂无任务</div>
        ) : (
          sorted.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              selected={task.id === selectedTaskId}
              onClick={() => onSelect(task.id)}
            />
          ))
        )}
      </div>
      <button className="board-column-new" type="button" onClick={onAddTask}>
        <Icon name="i-plus" size={13} />
        新建任务
      </button>
    </section>
  )
}

function TaskCard({ task, selected, onClick }: { task: BoardTask; selected: boolean; onClick: () => void }) {
  const status = statusMeta[task.status]

  return (
    <button
      className={`board-task-card${selected ? ' is-selected' : ''}`}
      type="button"
      onClick={onClick}
    >
      <span className="board-task-top">
        <span className={`board-task-status is-${status.tone}`}>
          <Icon name={status.icon} size={14} />
        </span>
        <strong>{task.title}</strong>
        {task.pinned ? <span className="board-task-pin">置顶</span> : null}
      </span>
      <span className="board-task-description">{task.description}</span>
      {task.activity ? (
        <span className={`board-task-activity is-${status.tone}`}>
          <Icon name={status.icon} size={12} />
          {task.activity}
        </span>
      ) : null}
      {task.status === 'running' && task.progress !== undefined ? (
        <span className="board-task-progress" aria-label={`进度 ${task.progress}%`}>
          <span style={{ inlineSize: `${task.progress}%` }} />
        </span>
      ) : null}
      <span className="board-task-tags">
        {task.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
      </span>
      <span className="board-task-footer">
        <span className={`board-task-label is-${status.tone}`}>
          <Icon name={status.icon} size={11} />
          {status.label}
        </span>
        {task.schedule ? (
          <span className="board-task-schedule">
            <Icon name="i-clock" size={11} />
            {task.nextRun ?? task.schedule}
          </span>
        ) : null}
        <span className="board-task-time">{task.updatedAt}</span>
      </span>
      <span className="board-task-meta">
        <span><Icon name="i-folder" size={12} />{task.workspace}</span>
        <span><Icon name="i-bot" size={12} />{task.assistant}</span>
      </span>
    </button>
  )
}

function TaskPanel({ task, column, onClose }: { task: BoardTask; column: BoardColumn; onClose: () => void }) {
  const [tab, setTab] = useState<TaskTab>('chat')
  const status = statusMeta[task.status]
  const messages = task.messages ?? [
    { from: 'user' as const, text: task.description, time: '09:00' },
    {
      from: 'bot' as const,
      text: task.activity ?? '任务已创建，等待开始处理。',
      time: '09:01',
    },
  ]

  useEffect(() => {
    setTab('chat')
  }, [task.id])

  const tabs: Array<{ id: TaskTab; label: string; count?: number }> = [
    { id: 'chat', label: '会话', count: messages.length },
    { id: 'info', label: '信息' },
    { id: 'files', label: '文件', count: (task.inputs?.length ?? 0) + (task.outputs?.length ?? 0) },
    { id: 'run', label: '运行' },
  ]

  return (
    <aside className="board-task-panel" aria-label={`${task.title} 详情`}>
      <header className="board-panel-head">
        <span className={`board-panel-status is-${status.tone}`}>
          <Icon name={status.icon} size={15} />
        </span>
        <div>
          <strong>{task.title}</strong>
          <span>{column.title} · {status.label}</span>
        </div>
        <button className="board-panel-close" type="button" aria-label="关闭任务详情" onClick={onClose}>
          <Icon name="i-act-close" size={16} />
        </button>
      </header>

      <div className="board-panel-tabs" role="tablist" aria-label="任务详情分区">
        {tabs.map((item) => (
          <button
            className={tab === item.id ? 'board-panel-tab is-active' : 'board-panel-tab'}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            key={item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.count !== undefined ? <span>{item.count}</span> : null}
          </button>
        ))}
      </div>

      <div className="board-panel-body">
        {tab === 'chat' ? <TaskChat task={task} messages={messages} /> : null}
        {tab === 'info' ? <TaskInfo task={task} column={column} /> : null}
        {tab === 'files' ? <TaskFiles task={task} /> : null}
        {tab === 'run' ? <TaskRun task={task} /> : null}
      </div>
    </aside>
  )
}

function TaskChat({ task, messages }: { task: BoardTask; messages: NonNullable<BoardTask['messages']> }) {
  const [draft, setDraft] = useState('')

  return (
    <div className="board-chat">
      <div className="board-chat-scroll">
        {messages.map((message, index) => (
          <div className={`board-message is-${message.from}`} key={`${message.time}-${index}`}>
            {message.from === 'bot' ? (
              <span className="board-message-avatar"><Icon name="i-bot" size={13} /></span>
            ) : null}
            <div className="board-message-main">
              <div className="board-bubble">{message.text}</div>
              {message.attachment ? (
                <span className="board-attachment"><Icon name="i-file-text" size={12} />{message.attachment}</span>
              ) : null}
              <span className="board-message-time">{message.time}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="board-chat-composer">
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSubmit={() => setDraft('')}
          placeholder="继续这个任务..."
          canSend={draft.trim().length > 0}
          rows={2}
          context={<span className="board-composer-context"><Icon name="i-bot" size={12} />{task.assistant}</span>}
          onFiles={() => undefined}
          onMic={() => undefined}
          onVoiceChat={() => undefined}
        />
      </div>
    </div>
  )
}

function TaskInfo({ task, column }: { task: BoardTask; column: BoardColumn }) {
  return (
    <div className="board-info">
      <p className="board-info-description">{task.description}</p>
      <div className="board-info-rows">
        <InfoRow label="状态" value={statusMeta[task.status].label} />
        <InfoRow label="分组" value={column.title} />
        <InfoRow label="Workspace" value={task.workspace} />
        <InfoRow label="Bot" value={task.assistant} />
        <InfoRow label="运行次数" value={task.runCount !== undefined ? `${task.runCount} 次` : '未运行'} />
        <InfoRow label="定时" value={task.schedule ?? '未设置'} />
        <InfoRow label="下次运行" value={task.nextRun ?? '—'} />
        <InfoRow label="更新时间" value={task.updatedAt} />
      </div>
      <div className="board-info-tags">
        {task.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </div>
  )
}

function TaskFiles({ task }: { task: BoardTask }) {
  return (
    <div className="board-files">
      <FileSection title="输入" files={task.inputs} empty="没有输入文件" />
      <FileSection title="产出" files={task.outputs} empty="还没有产出" />
    </div>
  )
}

function FileSection({ title, files, empty }: { title: string; files?: BoardTask['inputs']; empty: string }) {
  return (
    <section className="board-file-section">
      <div className="board-section-title"><strong>{title}</strong><span>{files?.length ?? 0}</span></div>
      {files && files.length > 0 ? (
        <div className="board-file-list">
          {files.map((file) => (
            <div className="board-file-row" key={file.name}>
              <span className="board-file-icon"><Icon name={fileIcon(file.kind)} size={15} /></span>
              <span className="board-file-copy"><strong>{file.name}</strong><small>{file.size}</small></span>
              <Icon name="i-act-download" size={14} />
            </div>
          ))}
        </div>
      ) : (
        <span className="board-file-empty">{empty}</span>
      )}
    </section>
  )
}

function TaskRun({ task }: { task: BoardTask }) {
  return (
    <div className="board-run">
      <div className="board-info-rows">
        <InfoRow label="状态" value={statusMeta[task.status].label} />
        <InfoRow label="定时" value={task.schedule ?? '未设置'} />
        <InfoRow label="下次运行" value={task.nextRun ?? '—'} />
        <InfoRow label="运行次数" value={task.runCount !== undefined ? `${task.runCount} 次` : '—'} />
      </div>
      <section className="board-file-section">
        <div className="board-section-title"><strong>服务</strong><span>{task.services?.length ?? 0}</span></div>
        {task.services && task.services.length > 0 ? (
          <div className="board-service-list">
            {task.services.map((service) => (
              <div className="board-service-row" key={service.name}>
                <span className={`board-service-dot is-${service.status}`} />
                <strong>{service.name}</strong>
                <span>:{service.port}</span>
                <small>{service.status === 'running' ? '运行中' : '已停止'}</small>
              </div>
            ))}
          </div>
        ) : (
          <span className="board-file-empty">没有运行中的服务</span>
        )}
      </section>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="board-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function fileIcon(kind: 'pdf' | 'sheet' | 'file' | 'code'): IconId {
  if (kind === 'pdf') return 'i-file-pdf'
  if (kind === 'sheet') return 'i-file-sheet'
  if (kind === 'code') return 'i-file-code'
  return 'i-file-text'
}

function CreateTaskDialog({
  board,
  defaultColumn,
  onClose,
  onCreate,
}: {
  board: BoardData
  defaultColumn: string
  onClose: () => void
  onCreate: (input: { title: string; description: string; columnId: string }) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [columnId, setColumnId] = useState(defaultColumn)

  const canCreate = useMemo(() => title.trim().length > 0, [title])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="board-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="board-dialog" role="dialog" aria-modal="true" aria-labelledby="board-dialog-title">
        <header className="board-dialog-head">
          <div>
            <span className="boards-eyebrow">NEW TASK</span>
            <h2 id="board-dialog-title">新建任务</h2>
          </div>
          <button className="board-panel-close" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="i-act-close" size={16} />
          </button>
        </header>
        <label className="board-field">
          <span>标题</span>
          <input value={title} autoFocus placeholder="例如：整理本月的客户反馈" onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="board-field">
          <span>描述</span>
          <textarea value={description} rows={4} placeholder="补充目标、范围或产出要求" onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="board-field">
          <span>分组</span>
          <select value={columnId} onChange={(event) => setColumnId(event.target.value)}>
            {board.columns.map((column) => (
              <option value={column.id} key={column.id}>{column.title}</option>
            ))}
          </select>
        </label>
        <footer className="board-dialog-actions">
          <button className="board-dialog-cancel" type="button" onClick={onClose}>取消</button>
          <button
            className="board-dialog-create"
            type="button"
            disabled={!canCreate}
            onClick={() => onCreate({ title: title.trim(), description: description.trim(), columnId })}
          >
            创建任务
          </button>
        </footer>
      </section>
    </div>
  )
}

function CreateBoardDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (input: { title: string; english: string; icon: IconId; tone: BoardTone }) => void
}) {
  const [title, setTitle] = useState('')
  const [english, setEnglish] = useState('')
  const [icon, setIcon] = useState<IconId>('i-board')
  const [tone, setTone] = useState<BoardTone>('brand')

  const canCreate = useMemo(() => title.trim().length > 0, [title])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const icons: IconId[] = ['i-board', 'i-tasks', 'i-bot', 'i-book']
  const tones: BoardTone[] = ['brand', 'success', 'warning', 'danger']

  return (
    <div className="board-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="board-dialog" role="dialog" aria-modal="true" aria-labelledby="create-board-title">
        <header className="board-dialog-head">
          <div>
            <span className="boards-eyebrow">NEW BOARD</span>
            <h2 id="create-board-title">新建看板</h2>
          </div>
          <button className="board-panel-close" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="i-act-close" size={16} />
          </button>
        </header>
        <label className="board-field">
          <span>名称</span>
          <input value={title} autoFocus placeholder="例如：内容运营" onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="board-field">
          <span>英文名</span>
          <input value={english} placeholder="Content operations" onChange={(event) => setEnglish(event.target.value)} />
        </label>
        <div className="board-choice-group">
          <span>图标</span>
          <div className="board-choice-grid">
            {icons.map((name) => (
              <button
                className={icon === name ? 'board-choice is-selected' : 'board-choice'}
                type="button"
                aria-label="选择看板图标"
                aria-pressed={icon === name}
                key={name}
                onClick={() => setIcon(name)}
              >
                <Icon name={name} size={16} />
              </button>
            ))}
          </div>
        </div>
        <div className="board-choice-group">
          <span>颜色</span>
          <div className="board-choice-grid">
            {tones.map((item) => (
              <button
                className={tone === item ? `board-tone-choice is-${item} is-selected` : `board-tone-choice is-${item}`}
                type="button"
                aria-label={`选择${item}色`}
                aria-pressed={tone === item}
                key={item}
                onClick={() => setTone(item)}
              />
            ))}
          </div>
        </div>
        <div className="board-column-preview">
          <span>默认列</span>
          <div>
            <span>待办</span>
            <span>进行中</span>
            <span>已完成</span>
          </div>
        </div>
        <footer className="board-dialog-actions">
          <button className="board-dialog-cancel" type="button" onClick={onClose}>取消</button>
          <button
            className="board-dialog-create"
            type="button"
            disabled={!canCreate}
            onClick={() => onCreate({ title: title.trim(), english: english.trim() || 'New board', icon, tone })}
          >
            创建看板
          </button>
        </footer>
      </section>
    </div>
  )
}
