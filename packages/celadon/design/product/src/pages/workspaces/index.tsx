import { useEffect, useRef, useState } from 'react'
import { AppNav, type WorkspaceNavItem } from '../../components/app-nav'
import { Icon } from '../../components/icon'
import {
  childrenOf,
  computers,
  fileIcon,
  fileKind,
  readWorkspace,
  roleMeta,
  scopeMeta,
  workspaceSeed,
  type Workspace,
  type WorkspaceFile,
  type WorkspaceMember,
  type WorkspaceRole,
  type WorkspaceScope,
  type WorkspaceTab,
} from './data'
import './workspaces.css'

type CreateInput = { name: string; computerId: string; scope: WorkspaceScope }

export function WorkspacesPage({ workspaceId }: { workspaceId?: string }) {
  const initialPreviewPath = new URLSearchParams(window.location.search).get('preview') ?? undefined
  const [workspaces, setWorkspaces] = useState(workspaceSeed)
  const [selectedId, setSelectedId] = useState<string | undefined>(workspaceId)
  const [createOpen, setCreateOpen] = useState(false)

  const selected = selectedId ? readWorkspace(workspaces, selectedId) : undefined

  useEffect(() => {
    if (workspaceId && readWorkspace(workspaces, workspaceId)) setSelectedId(workspaceId)
  }, [workspaceId, workspaces])

  const navItems: WorkspaceNavItem[] = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    scope: workspace.scope,
    computer: workspace.computerName,
    role: roleMeta[workspace.role].label,
    readonly: workspace.role === 'viewer',
  }))

  function updateWorkspace(next: Workspace) {
    setWorkspaces((current) => current.map((workspace) => workspace.id === next.id ? next : workspace))
  }

  function selectWorkspace(id: string) {
    setSelectedId(id)
    window.history.replaceState(null, '', `/workspaces/${id}`)
  }

  function openOverview() {
    setSelectedId(undefined)
    window.history.replaceState(null, '', '/workspaces')
  }

  function deleteWorkspace(id: string) {
    setWorkspaces((current) => {
      const remaining = current.filter((workspace) => workspace.id !== id)
      const next = remaining[0]
      setSelectedId(next?.id)
      window.history.replaceState(null, '', next ? `/workspaces/${next.id}` : '/workspaces')
      return remaining
    })
  }

  function createWorkspace(input: CreateInput) {
    const computer = computers.find((item) => item.id === input.computerId) ?? computers[0]
    const id = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace'}-${Date.now().toString(36)}`
    const workspace: Workspace = {
      id,
      name: input.name,
      description: 'A new workspace, ready for files and sessions.',
      scope: input.scope,
      computerId: computer.id,
      computerName: computer.name,
      computerOs: computer.os,
      role: input.scope === 'team' ? 'editor' : 'owner',
      createdAt: '刚刚',
      updatedAt: '刚刚',
      files: [
        {
          name: 'README.md',
          path: '/README.md',
          type: 'file',
          size: '1 KB',
          updated: '刚刚',
          language: 'markdown',
          content: `# ${input.name}\n\nThis workspace lives on ${computer.name}. Add files, connect an App, or start a session from here.`,
        },
      ],
      members: input.scope === 'team'
        ? [{ id: 'wren', name: 'Wren', email: 'wren@yaoagents.com', role: 'editor' }]
        : [],
      apps: [],
    }
    setWorkspaces((current) => [workspace, ...current])
    setSelectedId(workspace.id)
    setCreateOpen(false)
    window.history.replaceState(null, '', `/workspaces/${workspace.id}`)
  }

  return (
    <div className="workspaces-shell">
      <AppNav
        section="workspaces"
        workspaceItems={navItems}
        workspaceSelectedId={selectedId}
        onWorkspaceSelect={selectWorkspace}
        onWorkspaceOverview={openOverview}
        onCreateWorkspace={() => setCreateOpen(true)}
      />
      <main className="workspaces-main">
        <section className="workspace-panel" aria-label="工作空间">
          {selected ? (
            <WorkspaceDetail
              key={selected.id}
              workspace={selected}
              onUpdate={updateWorkspace}
              onDelete={() => deleteWorkspace(selected.id)}
              onBack={openOverview}
              initialPreviewPath={initialPreviewPath}
            />
          ) : workspaces.length > 0 ? (
            <WorkspaceOverview
              workspaces={workspaces}
              onSelect={selectWorkspace}
              onCreate={() => setCreateOpen(true)}
            />
          ) : (
            <WorkspaceEmpty onCreate={() => setCreateOpen(true)} />
          )}
        </section>
      </main>
      {createOpen ? (
        <CreateWorkspaceDialog
          onClose={() => setCreateOpen(false)}
          onCreate={createWorkspace}
        />
      ) : null}
    </div>
  )
}

function WorkspaceOverview({
  workspaces,
  onSelect,
  onCreate,
}: {
  workspaces: Workspace[]
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  const groups = (['private', 'team'] as const).map((scope) => ({
    scope,
    label: scope === 'private' ? '我的工作空间' : '团队工作空间',
    items: workspaces.filter((workspace) => workspace.scope === scope),
  })).filter((group) => group.items.length > 0)
  const computers = new Set(workspaces.map((workspace) => workspace.computerId)).size

  return (
    <div className="workspace-overview">
      <header className="workspace-overview-head">
        <span className="workspace-detail-icon is-private"><Icon name="i-ws" size={18} /></span>
        <div>
          <h1>工作空间</h1>
          <span>{workspaces.length} 个工作空间 · {computers} 台 Computer</span>
        </div>
        <button className="workspace-primary" type="button" onClick={onCreate}>
          <Icon name="i-plus" size={14} />
          新建工作空间
        </button>
      </header>
      <div className="workspace-overview-body">
        <section className="workspace-overview-stats">
          <div><strong>{workspaces.length}</strong><span>全部工作空间</span></div>
          <div><strong>{workspaces.filter((workspace) => workspace.scope === 'private').length}</strong><span>Private</span></div>
          <div><strong>{workspaces.filter((workspace) => workspace.scope === 'team').length}</strong><span>Team</span></div>
          <div><strong>{computers}</strong><span>绑定 Computer</span></div>
        </section>
        {groups.map((group) => (
          <section className="workspace-overview-group" key={group.scope}>
            <div className="workspace-overview-group-head">
              <div><h2>{group.label}</h2><span>{group.items.length} 个</span></div>
            </div>
            <div className="workspace-overview-grid">
              {group.items.map((workspace) => (
                <button className="workspace-overview-card" type="button" key={workspace.id} onClick={() => onSelect(workspace.id)}>
                  <span className={`workspace-overview-card-icon is-${workspace.scope}`}><Icon name={workspace.scope === 'private' ? 'i-lock' : 'i-ws'} size={17} /></span>
                  <span className="workspace-overview-card-copy">
                    <span className="workspace-overview-card-title">
                      <strong>{workspace.name}</strong>
                      <span className={`workspace-scope is-${workspace.scope}`}>{scopeMeta[workspace.scope].label}</span>
                    </span>
                    <span>{workspace.computerName} · {workspace.computerOs}</span>
                    <span>{workspace.files.filter((file) => file.type === 'file').length} 个文件 · 更新于 {workspace.updatedAt}</span>
                  </span>
                  <span className={`workspace-role is-${roleMeta[workspace.role].tone}`}>{roleMeta[workspace.role].label}</span>
                  <Icon name="i-right" size={14} />
                </button>
              ))}
            </div>
          </section>
        ))}
        <div className="workspace-overview-tip">
          <Icon name="i-ws" size={15} />
          没有选择工作空间时显示这个概览。选择任意工作空间后进入文件、成员、应用与设置。
        </div>
      </div>
    </div>
  )
}

function WorkspaceEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="workspace-empty">
      <span className="workspace-empty-icon"><Icon name="i-ws" size={28} /></span>
      <span className="workspace-eyebrow">WORKSPACES</span>
      <h1>还没有工作空间</h1>
      <p>工作空间属于一台电脑。新建后可以把文件、App 与会话放在一起。</p>
      <button className="workspace-primary" type="button" onClick={onCreate}>
        <Icon name="i-plus" size={14} />
        新建工作空间
      </button>
    </div>
  )
}

function WorkspaceDetail({
  workspace,
  onUpdate,
  onDelete,
  onBack,
  initialPreviewPath,
}: {
  workspace: Workspace
  onUpdate: (workspace: Workspace) => void
  onDelete: () => void
  onBack: () => void
  initialPreviewPath?: string
}) {
  const [tab, setTab] = useState<WorkspaceTab>('files')
  const canWrite = workspace.role !== 'viewer'
  const scope = scopeMeta[workspace.scope]
  const role = roleMeta[workspace.role]
  const tabs: Array<{ id: WorkspaceTab; label: string; icon: 'i-folder' | 'i-nav-team' | 'i-apps' | 'i-nav-settings' }> = [
    { id: 'files', label: '文件', icon: 'i-folder' },
    ...(workspace.scope === 'team' ? [{ id: 'access' as const, label: '成员', icon: 'i-nav-team' as const }] : []),
    { id: 'apps', label: '应用', icon: 'i-apps' },
    { id: 'settings', label: '设置', icon: 'i-nav-settings' },
  ]

  return (
    <div className="workspace-detail">
      <header className="workspace-detail-head">
        <button className="workspace-back" type="button" aria-label="返回工作空间概览" onClick={onBack}>
          <Icon name="i-left" size={15} />
        </button>
        <span className={`workspace-detail-icon is-${workspace.scope}`}><Icon name="i-ws" size={18} /></span>
        <div className="workspace-detail-title">
          <div>
            <h1>{workspace.name}</h1>
            <span className={`workspace-scope is-${workspace.scope}`}>
              <Icon name={scope.icon} size={11} />
              {scope.label}
            </span>
            <span className={`workspace-role is-${role.tone}`}>{role.label}</span>
          </div>
          <span>{workspace.computerName} · {workspace.computerOs} · 更新于 {workspace.updatedAt}</span>
        </div>
        <div className="workspace-detail-actions">
          {workspace.scope === 'team' ? (
            <button className="workspace-secondary" type="button" onClick={() => setTab('access')}>
              <Icon name="i-nav-team" size={14} />
              成员
            </button>
          ) : null}
        </div>
      </header>

      <div className="workspace-tabs" role="tablist" aria-label="工作空间内容">
        {tabs.map((item) => (
          <button
            className={`workspace-tab${tab === item.id ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            key={item.id}
            onClick={() => setTab(item.id)}
          >
            <Icon name={item.icon} size={14} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="workspace-body">
        {!canWrite ? (
          <div className="workspace-readonly">
            <Icon name="i-lock" size={14} />
            <span>你在团队工作空间中是只读成员。可以查看、预览与下载，不能修改文件、成员或设置。</span>
          </div>
        ) : null}

        {tab === 'files' ? (
          <FilesTab workspace={workspace} onUpdate={onUpdate} canWrite={canWrite} initialPreviewPath={initialPreviewPath} />
        ) : null}
        {tab === 'access' ? (
          <AccessTab workspace={workspace} onUpdate={onUpdate} canManage={workspace.role === 'owner' || workspace.role === 'admin'} />
        ) : null}
        {tab === 'apps' ? <AppsTab workspace={workspace} /> : null}
        {tab === 'settings' ? (
          <SettingsTab workspace={workspace} onUpdate={onUpdate} onDelete={onDelete} canWrite={canWrite} />
        ) : null}
      </div>
    </div>
  )
}

function FilesTab({
  workspace,
  onUpdate,
  canWrite,
  initialPreviewPath,
}: {
  workspace: Workspace
  onUpdate: (workspace: Workspace) => void
  canWrite: boolean
  initialPreviewPath?: string
}) {
  const initialFile = initialPreviewPath ? workspace.files.find((file) => file.path === initialPreviewPath && file.type === 'file') ?? null : null
  const [currentPath, setCurrentPath] = useState(() => initialFile ? initialFile.path.slice(0, initialFile.path.lastIndexOf('/') + 1) || '/' : '/')
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(initialFile)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [shareFile, setShareFile] = useState<WorkspaceFile | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const entries = childrenOf(workspace.files, currentPath)
  const breadcrumbs = currentPath.split('/').filter(Boolean)
  const folders = workspace.files.filter((file) => file.type === 'folder')

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2400)
    return () => window.clearTimeout(timer)
  }, [notice])

  function updateFiles(files: WorkspaceFile[]) {
    onUpdate({ ...workspace, files, updatedAt: '刚刚' })
  }

  function openEntry(file: WorkspaceFile) {
    if (file.type === 'folder') {
      setCurrentPath(file.path)
      setSelectedFile(null)
    } else {
      setSelectedFile(file)
    }
  }

  function createFolder() {
    const name = folderName.trim()
    if (!name || !canWrite) return
    const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
    if (workspace.files.some((file) => file.path === path)) {
      setNotice('同名文件夹已经存在')
      return
    }
    updateFiles([...workspace.files, { name, path, type: 'folder', updated: '刚刚' }])
    setFolderName('')
    setNewFolderOpen(false)
    setNotice('文件夹已创建')
  }

  function uploadFiles(files: FileList | null) {
    if (!files || !canWrite) return
    const next = Array.from(files).map((file): WorkspaceFile => ({
      name: file.name,
      path: currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`,
      type: 'file',
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      updated: '刚刚',
      content: '',
      language: 'text',
    }))
    updateFiles([...workspace.files, ...next])
    setNotice(`${next.length} 个文件已加入`)
  }

  function deleteFile(file: WorkspaceFile) {
    if (!canWrite) return
    updateFiles(workspace.files.filter((item) => item.path !== file.path && !item.path.startsWith(`${file.path}/`)))
    if (selectedFile?.path === file.path) setSelectedFile(null)
    setNotice('已删除')
  }

  function renameFile(file: WorkspaceFile, nextName: string) {
    const name = nextName.trim()
    if (!canWrite || !name || name === file.name) return
    const parent = file.path.slice(0, file.path.lastIndexOf('/') + 1)
    const nextPath = `${parent}${name}`
    if (workspace.files.some((item) => item.path === nextPath)) {
      setNotice('同名文件已经存在')
      return
    }
    const nextFile = { ...file, name, path: nextPath }
    updateFiles(workspace.files.map((item) => item.path === file.path ? nextFile : item))
    setSelectedFile(nextFile)
    setNotice('已重命名')
  }

  if (selectedFile) {
    return (
      <div className="workspace-files">
        <WorkspaceFilePreview
          file={selectedFile}
          currentPath={currentPath}
          folders={folders}
          canWrite={canWrite}
          onBack={() => setSelectedFile(null)}
          onDirectoryChange={(path) => {
            setCurrentPath(path)
            setSelectedFile(null)
          }}
          onShare={() => setShareFile(selectedFile)}
          onDelete={() => deleteFile(selectedFile)}
          onRename={(name) => renameFile(selectedFile, name)}
          onOpenBrowser={() => window.open(`/workspaces/${workspace.id}?preview=${encodeURIComponent(selectedFile.path)}`, '_blank', 'noopener')}
        />
        {shareFile ? <ShareFileDialog file={shareFile} onClose={() => setShareFile(null)} /> : null}
      </div>
    )
  }

  return (
    <div className="workspace-files">
      <div className="workspace-files-toolbar">
        <div className="workspace-breadcrumb">
          <button type="button" onClick={() => { setCurrentPath('/'); setSelectedFile(null) }}>
            <Icon name="i-home" size={13} />
          </button>
          {breadcrumbs.map((part, index) => (
            <span key={`${part}-${index}`}>
              <Icon name="i-right" size={11} />
              <button
                type="button"
                onClick={() => {
                  const path = `/${breadcrumbs.slice(0, index + 1).join('/')}`
                  setCurrentPath(path)
                  setSelectedFile(null)
                }}
              >
                {part}
              </button>
            </span>
          ))}
        </div>
        <div className="workspace-file-actions">
          <button
            className="workspace-secondary"
            type="button"
            disabled={!canWrite}
            title={!canWrite ? '只读成员不能新建文件夹' : undefined}
            onClick={() => { setNewFolderOpen(true); setFolderName('') }}
          >
            <Icon name="i-plus" size={13} />
            新建文件夹
          </button>
          <button
            className="workspace-secondary"
            type="button"
            disabled={!canWrite}
            title={!canWrite ? '只读成员不能上传文件' : undefined}
            onClick={() => uploadRef.current?.click()}
          >
            <Icon name="i-act-upload" size={13} />
            上传
          </button>
          <input ref={uploadRef} className="workspace-hidden-input" type="file" multiple onChange={(event) => uploadFiles(event.target.files)} />
        </div>
      </div>

      {notice ? <div className="workspace-notice">{notice}</div> : null}

      <div className="workspace-file-list">
        <div className="workspace-file-list-head">
            <span>名称</span>
            <span>更新时间</span>
            <span>大小</span>
          </div>
          {newFolderOpen ? (
            <div className="workspace-file-row is-folder">
              <span className="workspace-file-name">
                <span className="workspace-file-icon"><Icon name="i-folder" size={15} /></span>
                <input
                  value={folderName}
                  placeholder="文件夹名称，回车创建"
                  autoFocus
                  onChange={(event) => setFolderName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') createFolder()
                    if (event.key === 'Escape') setNewFolderOpen(false)
                  }}
                />
              </span>
              <span>刚刚</span>
              <span>—</span>
            </div>
          ) : null}
          {entries.length === 0 && !newFolderOpen ? (
            <div className="workspace-file-empty">
              <Icon name="i-folder" size={26} />
              <strong>这个目录是空的</strong>
              <span>{canWrite ? '新建文件夹或上传文件开始使用。' : '只读成员可以查看其他目录。'}</span>
            </div>
          ) : null}
          {entries.map((file) => (
            <button
              className={`workspace-file-row${selectedFile?.path === file.path ? ' is-selected' : ''}${file.type === 'folder' ? ' is-folder' : ''}`}
              type="button"
              key={file.path}
              onClick={() => openEntry(file)}
            >
              <span className="workspace-file-name">
                <span className={`workspace-file-icon is-${fileKind(file)}`}><Icon name={fileIcon(file)} size={15} /></span>
                <strong>{file.name}</strong>
                {file.git ? (
                  <span className="workspace-git-badge" title={`Git ${file.git.branch}${file.git.changes ? `，${file.git.changes} 个变更` : ''}`}>
                    <Icon name="i-branch" size={11} />
                    {file.git.changes > 0 ? file.git.changes : null}
                  </span>
                ) : null}
              </span>
              <span>{file.updated}</span>
              <span>{file.size ?? '—'}</span>
            </button>
          ))}
        </div>

      {shareFile ? <ShareFileDialog file={shareFile} onClose={() => setShareFile(null)} /> : null}
    </div>
  )
}

function WorkspaceFilePreview({
  file,
  currentPath,
  folders,
  canWrite,
  onBack,
  onDirectoryChange,
  onShare,
  onDelete,
  onRename,
  onOpenBrowser,
}: {
  file: WorkspaceFile
  currentPath: string
  folders: WorkspaceFile[]
  canWrite: boolean
  onBack: () => void
  onDirectoryChange: (path: string) => void
  onShare: () => void
  onDelete: () => void
  onRename: (name: string) => void
  onOpenBrowser: () => void
}) {
  const kind = fileKind(file)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(file.name)

  function download() {
    if (!file.content) return
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="workspace-file-preview">
      <header className="workspace-file-preview-head">
        <button className="workspace-secondary workspace-file-preview-back" type="button" onClick={onBack}>
          <Icon name="i-left" size={13} />
          文件
        </button>
        <span className={`workspace-file-icon is-${kind}`}><Icon name={fileIcon(file)} size={16} /></span>
        <div className="workspace-file-preview-title">
          {editing ? (
            <input
              className="workspace-preview-name-input"
              value={draftName}
              autoFocus
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onRename(draftName)
                  setEditing(false)
                }
                if (event.key === 'Escape') setEditing(false)
              }}
              onBlur={() => setEditing(false)}
            />
          ) : (
            <strong>{file.name}</strong>
          )}
          <span>{file.path}</span>
        </div>
        <div className="workspace-file-preview-actions">
          <button className="workspace-secondary" type="button" onClick={onOpenBrowser}>
            <Icon name="i-apps" size={13} />
            在 Browser 打开
          </button>
          <button className="workspace-secondary" type="button" onClick={onShare}>
            <Icon name="i-act-copy" size={13} />
            分享链接
          </button>
          <button
            className="workspace-secondary"
            type="button"
            disabled={!file.content}
            title={!file.content ? '原型未包含二进制文件内容' : undefined}
            onClick={download}
          >
            <Icon name="i-act-download" size={13} />
            下载
          </button>
          {canWrite && !editing ? (
            <button className="workspace-icon-button" type="button" aria-label="重命名" onClick={() => { setDraftName(file.name); setEditing(true) }}>
              <Icon name="i-act-edit" size={14} />
            </button>
          ) : null}
          {confirmDelete ? (
            <span className="workspace-delete-inline">
              删除？
              <button type="button" onClick={onDelete}>确认</button>
              <button type="button" onClick={() => setConfirmDelete(false)}>取消</button>
            </span>
          ) : (
            <button
              className="workspace-icon-button"
              type="button"
              aria-label="删除文件"
              disabled={!canWrite}
              title={!canWrite ? '只读成员不能删除文件' : undefined}
              onClick={() => setConfirmDelete(true)}
            >
              <Icon name="i-act-trash" size={14} />
            </button>
          )}
        </div>
      </header>
      <div className="workspace-file-preview-bar">
        <span>目录</span>
        <select value={currentPath} onChange={(event) => onDirectoryChange(event.target.value)}>
          <option value="/">/ 根目录</option>
          {folders.map((folder) => <option value={folder.path} key={folder.path}>{folder.path}</option>)}
        </select>
        <span className="workspace-file-preview-dir-note">{folders.length} 个目录</span>
      </div>
      <div className="workspace-file-preview-content">
        {kind === 'image' ? (
          <div className="workspace-image-preview">
            <Icon name="i-file-image" size={30} />
            <span>图片预览</span>
            <small>{file.name}</small>
          </div>
        ) : file.content ? (
          <pre>{file.content}</pre>
        ) : (
          <div className="workspace-preview-empty-inline">
            <Icon name="i-file" size={24} />
            <span>这个文件还没有可预览的内容。</span>
          </div>
        )}
      </div>
    </div>
  )
}

function AccessTab({
  workspace,
  onUpdate,
  canManage,
}: {
  workspace: Workspace
  onUpdate: (workspace: Workspace) => void
  canManage: boolean
}) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  function updateRole(memberId: string, role: WorkspaceRole) {
    if (!canManage) return
    onUpdate({
      ...workspace,
      members: workspace.members.map((member) => member.id === memberId ? { ...member, role } : member),
    })
  }

  function invite() {
    const email = inviteEmail.trim()
    if (!email || !canManage) return
    const name = email.split('@')[0]
    const member: WorkspaceMember = { id: `member-${Date.now()}`, name, email, role: 'viewer' }
    onUpdate({ ...workspace, members: [...workspace.members, member] })
    setInviteEmail('')
    setInviteOpen(false)
  }

  return (
    <div className="workspace-access">
      <div className="workspace-section-head">
        <div>
          <h2>成员与权限</h2>
          <p>Team Owner / Admin 可以调整成员角色。Owner 自动拥有管理权，成员默认是只读。</p>
        </div>
        <button className="workspace-secondary" type="button" disabled={!canManage} onClick={() => setInviteOpen(true)}>
          <Icon name="i-plus" size={13} />
          邀请成员
        </button>
      </div>

      <div className="workspace-member-table">
        <div className="workspace-member-head">
          <span>成员</span>
          <span>角色</span>
          <span>权限</span>
        </div>
        {workspace.members.map((member) => (
          <div className="workspace-member-row" key={member.id}>
            <span className="workspace-member-person">
              <span className="workspace-member-avatar">{member.name.slice(0, 1).toUpperCase()}</span>
              <span><strong>{member.name}</strong><small>{member.email}</small></span>
            </span>
            <span>
              {canManage && member.role !== 'owner' ? (
                <select
                  className="workspace-role-select"
                  value={member.role}
                  aria-label={`${member.name} 的角色`}
                  onChange={(event) => updateRole(member.id, event.target.value as WorkspaceRole)}
                >
                  <option value="admin">管理员</option>
                  <option value="editor">编辑者</option>
                  <option value="viewer">只读</option>
                </select>
              ) : (
                <span className={`workspace-role is-${roleMeta[member.role].tone}`}>{roleMeta[member.role].label}</span>
              )}
            </span>
            <span className="workspace-member-permission">
              {member.role === 'viewer' ? '读取、预览、下载' : member.role === 'editor' ? '读取与写入' : '读取、写入与管理'}
            </span>
          </div>
        ))}
      </div>

      {!canManage ? (
        <p className="workspace-inline-note">你在这个工作空间里没有成员管理权限。</p>
      ) : null}

      {inviteOpen ? (
        <div className="workspace-invite">
          <input
            type="email"
            value={inviteEmail}
            placeholder="输入成员邮箱"
            autoFocus
            onChange={(event) => setInviteEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') invite()
              if (event.key === 'Escape') setInviteOpen(false)
            }}
          />
          <button className="workspace-primary" type="button" disabled={!inviteEmail.trim()} onClick={invite}>邀请为只读</button>
          <button className="workspace-secondary" type="button" onClick={() => setInviteOpen(false)}>取消</button>
        </div>
      ) : null}
    </div>
  )
}

function AppsTab({ workspace }: { workspace: Workspace }) {
  if (workspace.apps.length === 0) {
    return (
      <div className="workspace-apps-empty">
        <span><Icon name="i-apps" size={28} /></span>
        <h2>还没有应用使用这个工作空间</h2>
        <p>发布 App 时选择这个工作空间与 Computer，App 会把指定的 App 域挂载进来。</p>
      </div>
    )
  }

  return (
    <div className="workspace-apps">
      <div className="workspace-section-head">
        <div>
          <h2>使用这个工作空间的 App</h2>
          <p>App 只访问发布时指定的 App 域，不会遍历整个工作空间。</p>
        </div>
      </div>
      <div className="workspace-app-grid">
        {workspace.apps.map((app) => (
          <article className="workspace-app-card" key={app.id}>
            <span className={`workspace-app-icon is-${app.tone}`}><Icon name={app.icon} size={18} /></span>
            <div>
              <strong>{app.name}</strong>
              <p>{app.description}</p>
              <span className="workspace-app-domain"><Icon name="i-folder" size={11} />{app.domain}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function SettingsTab({
  workspace,
  onUpdate,
  onDelete,
  canWrite,
}: {
  workspace: Workspace
  onUpdate: (workspace: Workspace) => void
  onDelete: () => void
  canWrite: boolean
}) {
  const [name, setName] = useState(workspace.name)
  const [scope, setScope] = useState<WorkspaceScope>(workspace.scope)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saved, setSaved] = useState(false)

  function save() {
    if (!canWrite || !name.trim()) return
    onUpdate({
      ...workspace,
      name: name.trim(),
      scope,
      updatedAt: '刚刚',
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="workspace-settings">
      <div className="workspace-section-head">
        <div>
          <h2>工作空间设置</h2>
          <p>工作空间绑定一台 Computer。更改名称与作用域不会移动文件。</p>
        </div>
        {saved ? <span className="workspace-saved">已保存</span> : null}
      </div>

      <div className="workspace-form">
        <label>
          <span>名称</span>
          <input value={name} disabled={!canWrite} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="workspace-field">
          <span>作用域</span>
          <div className="workspace-scope-options">
            {(['private', 'team'] as const).map((item) => (
              <button
                className={scope === item ? 'workspace-scope-option is-selected' : 'workspace-scope-option'}
                type="button"
                key={item}
                disabled={!canWrite}
                onClick={() => setScope(item)}
              >
                <Icon name={scopeMeta[item].icon} size={14} />
                <span><strong>{scopeMeta[item].label}</strong><small>{scopeMeta[item].description}</small></span>
              </button>
            ))}
          </div>
        </div>
        <div className="workspace-bound">
          <span>所在 Computer</span>
          <strong>{workspace.computerName}</strong>
          <small>{workspace.computerOs}。绑定后不能直接更换，需要复制或重新创建工作空间。</small>
        </div>
      </div>

      <div className="workspace-settings-actions">
        <button className="workspace-primary" type="button" disabled={!canWrite || !name.trim()} onClick={save}>保存更改</button>
      </div>

      <div className="workspace-danger-zone">
        <div>
          <strong>删除工作空间</strong>
          <p>删除后文件与成员关系会从当前工作空间移除，操作不可恢复。</p>
        </div>
        {confirmDelete ? (
          <div className="workspace-delete-confirm">
            <span>确定删除？</span>
            <button className="workspace-danger-button" type="button" onClick={onDelete}>确认删除</button>
            <button className="workspace-secondary" type="button" onClick={() => setConfirmDelete(false)}>取消</button>
          </div>
        ) : (
          <button className="workspace-danger-link" type="button" disabled={!canWrite} onClick={() => setConfirmDelete(true)}>
            <Icon name="i-act-trash" size={13} />
            删除
          </button>
        )}
      </div>
    </div>
  )
}

function CreateWorkspaceDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (input: CreateInput) => void }) {
  const [name, setName] = useState('')
  const [computerId, setComputerId] = useState(computers[0].id)
  const [scope, setScope] = useState<WorkspaceScope>('private')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="workspace-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="workspace-dialog" role="dialog" aria-modal="true" aria-labelledby="create-workspace-title">
        <header className="workspace-dialog-head">
          <div><span className="workspace-eyebrow">NEW WORKSPACE</span><h2 id="create-workspace-title">新建工作空间</h2></div>
          <button className="workspace-icon-button" type="button" aria-label="关闭" onClick={onClose}><Icon name="i-act-close" size={16} /></button>
        </header>
        <p className="workspace-dialog-copy">工作空间会绑定一台 Computer，文件存储在那台电脑上。</p>
        <label className="workspace-form-label">
          <span>名称</span>
          <input value={name} placeholder="例如：Campaign Notes" autoFocus onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="workspace-form-label">
          <span>所在 Computer</span>
          <select value={computerId} onChange={(event) => setComputerId(event.target.value)}>
            {computers.map((computer) => <option value={computer.id} key={computer.id}>{computer.name} · {computer.os}</option>)}
          </select>
        </label>
        <div className="workspace-form-label">
          <span>作用域</span>
          <div className="workspace-scope-options">
            {(['private', 'team'] as const).map((item) => (
              <button
                className={scope === item ? 'workspace-scope-option is-selected' : 'workspace-scope-option'}
                type="button"
                key={item}
                onClick={() => setScope(item)}
              >
                <Icon name={scopeMeta[item].icon} size={14} />
                <span><strong>{scopeMeta[item].label}</strong><small>{scopeMeta[item].description}</small></span>
              </button>
            ))}
          </div>
        </div>
        <footer className="workspace-dialog-actions">
          <button className="workspace-secondary" type="button" onClick={onClose}>取消</button>
          <button className="workspace-primary" type="button" disabled={!name.trim()} onClick={() => onCreate({ name: name.trim(), computerId, scope })}>创建工作空间</button>
        </footer>
      </section>
    </div>
  )
}

function ShareFileDialog({ file, onClose }: { file: WorkspaceFile; onClose: () => void }) {
  const [days, setDays] = useState(7)
  const [created, setCreated] = useState(false)
  const [copied, setCopied] = useState(false)
  const link = `https://yao.run/s/${file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="workspace-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="workspace-dialog" role="dialog" aria-modal="true" aria-labelledby="share-file-title">
        <header className="workspace-dialog-head">
          <div><span className="workspace-eyebrow">SHARE LINK</span><h2 id="share-file-title">创建分享链接</h2></div>
          <button className="workspace-icon-button" type="button" aria-label="关闭" onClick={onClose}><Icon name="i-act-close" size={16} /></button>
        </header>
        <p className="workspace-dialog-copy">只复制这个文件，不暴露目录结构、Git 历史或其他文件。</p>
        <div className="workspace-share-file"><Icon name={fileIcon(file)} size={16} /><span>{file.name}</span><small>{file.size}</small></div>
        {created ? (
          <div className="workspace-share-result">
            <span>分享链接</span>
            <code>{link}</code>
            <small>{days} 天后自动清理</small>
          </div>
        ) : (
          <label className="workspace-form-label">
            <span>有效期</span>
            <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
              <option value={1}>1 天</option>
              <option value={7}>7 天</option>
              <option value={30}>30 天</option>
            </select>
          </label>
        )}
        <footer className="workspace-dialog-actions">
          <button className="workspace-secondary" type="button" onClick={onClose}>关闭</button>
          {created
            ? <button className="workspace-primary" type="button" onClick={copyLink}>{copied ? '已复制' : '复制链接'}</button>
            : <button className="workspace-primary" type="button" onClick={() => setCreated(true)}>创建分享链接</button>}
        </footer>
      </section>
    </div>
  )
}
