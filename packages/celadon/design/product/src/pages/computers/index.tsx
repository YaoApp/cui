import { useEffect, useState } from 'react'
import { AppNav } from '../../components/app-nav'
import { Icon } from '../../components/icon'
import {
  availableNodes as initialAvailableNodes,
  computerPools,
  connectionServer,
  defaultFolder,
  recentFolders,
  personalNodes as initialPersonalNodes,
  policyMeta,
  requestCopy,
  statusMeta,
  type ComputerNode,
  type ComputerPool,
  type ComputerScope,
} from './data'
import './computers.css'

type RequestState = 'pending' | 'approved'

export function ComputersPage() {
  const [availableNodes, setAvailableNodes] = useState(initialAvailableNodes)
  const [personalNodes, setPersonalNodes] = useState(initialPersonalNodes)
  const [requests, setRequests] = useState<Record<string, RequestState>>({})
  const [addOpen, setAddOpen] = useState(false)
  const [poolPickerOpen, setPoolPickerOpen] = useState(false)
  const [requestPool, setRequestPool] = useState<ComputerPool | null>(null)
  const [detailNode, setDetailNode] = useState<ComputerNode | null>(null)
  const [pointsBalance, setPointsBalance] = useState(320)
  const isTeamOwner = true
  const currentUserId = 'wren'

  const pendingCount = Object.values(requests).filter((state) => state === 'pending').length
  const computers = [...availableNodes, ...personalNodes]

  function requestAccess(pool: ComputerPool, input: { name: string; scope: ComputerScope }) {
    const immediate = pool.policy === 'auto' || pool.policy === 'paid'
    setRequests((current) => ({
      ...current,
      [pool.id]: immediate ? 'approved' : 'pending',
    }))
    const node: ComputerNode = {
      id: `node-${pool.id}-${Date.now()}`,
      computerId: `cld-${pool.id.replace('pool-', '')}-${availableNodes.length + 1}`,
      ip: immediate ? `10.24.10.${availableNodes.length + 10}` : '待分配',
      name: input.name,
      os: pool.tags[0],
      hardware: '按云电脑配置分配',
      memory: '按云电脑配置',
      status: immediate ? 'online' : 'pending',
      workspaces: 0,
      apps: [],
      source: pool.name.replace('云电脑', '').trim(),
      lastActive: immediate ? '刚刚开通' : '刚刚提交',
      scope: input.scope,
      poolId: pool.id,
      ownerId: currentUserId,
    }
    setAvailableNodes((current) => [...current, node])
    if (pool.policy === 'paid') {
      setPointsBalance((current) => current - (pool.pricePoints ?? 0))
    }
    setRequestPool(null)
  }

  function canRevoke(node: ComputerNode) {
    if (node.personal) {
      return node.ownerId === currentUserId || (node.scope === 'shared' && isTeamOwner)
    }
    if (node.scope === 'shared') return isTeamOwner
    return node.ownerId === currentUserId
  }

  function revokeComputer(node: ComputerNode) {
    if (node.personal) {
      setPersonalNodes((current) => current.filter((item) => item.id !== node.id))
      return
    }
    setAvailableNodes((current) => current.filter((item) => item.id !== node.id))
    if (node.poolId) {
      setRequests((current) => {
        const next = { ...current }
        delete next[node.poolId]
        return next
      })
    }
  }

  function connectComputer(input: { name: string; folder: string; scope: ComputerScope }) {
    const node: ComputerNode = {
      id: `personal-${Date.now()}`,
      computerId: `psn-${Date.now().toString(36)}`,
      ip: '127.0.0.1',
      name: input.name.trim() || '这台电脑',
      os: '当前设备',
      hardware: '本地电脑',
      memory: '本机资源',
      status: 'online',
      workspaces: 1,
      apps: [],
      source: '个人电脑',
      lastActive: '刚刚接入',
      personal: true,
      scope: input.scope,
      ownerId: currentUserId,
    }
    setPersonalNodes((current) => [...current, node])
    setAddOpen(false)
  }

  return (
    <div className="computers-shell">
      <AppNav section="computers" />
      <main className="computers-main">
        <section className="computers-panel" aria-label="电脑">
          <header className="computers-head">
            <span className="computers-head-icon"><Icon name="i-pc" size={17} /></span>
            <div className="computers-head-copy">
              <h1>电脑</h1>
              <span>{computers.length} 台电脑{pendingCount > 0 ? ` · ${pendingCount} 个申请处理中` : ''}</span>
            </div>
            <div className="computers-head-actions">
              {isTeamOwner ? (
                <button className="computers-pool-add" type="button" onClick={() => setPoolPickerOpen(true)}>
                  <Icon name="i-plus" size={14} />
                  接入云电脑
                </button>
              ) : null}
              <button className="computers-add" type="button" onClick={() => setAddOpen(true)}>
                <Icon name="i-plus" size={14} />
                接入本机
              </button>
            </div>
          </header>

          <div className="computers-body">
            <ComputerList
              nodes={computers}
              canRevoke={canRevoke}
              onRevoke={revokeComputer}
              onDetail={setDetailNode}
            />
          </div>
        </section>
      </main>

      {addOpen ? (
        <AddComputerDialog
          onClose={() => setAddOpen(false)}
          onConfirm={connectComputer}
        />
      ) : null}
      {poolPickerOpen ? (
        <PoolPickerDialog
          requests={requests}
          onClose={() => setPoolPickerOpen(false)}
          onSelect={(pool) => {
            setPoolPickerOpen(false)
            setRequestPool(pool)
          }}
        />
      ) : null}
      {requestPool ? (
        <RequestPoolDialog
          pool={requestPool}
          pointsBalance={pointsBalance}
          onRecharge={(amount) => setPointsBalance((current) => current + amount)}
          onClose={() => setRequestPool(null)}
          onConfirm={(input) => requestAccess(requestPool, input)}
        />
      ) : null}
      {detailNode ? (
        <ComputerDetailDialog
          node={detailNode}
          onClose={() => setDetailNode(null)}
          onRevoke={canRevoke(detailNode) ? () => {
            revokeComputer(detailNode)
            setDetailNode(null)
          } : undefined}
        />
      ) : null}
    </div>
  )
}

function ComputerList({
  nodes,
  canRevoke,
  onRevoke,
  onDetail,
}: {
  nodes: ComputerNode[]
  canRevoke: (node: ComputerNode) => boolean
  onRevoke: (node: ComputerNode) => void
  onDetail: (node: ComputerNode) => void
}) {
  return (
    <section className="computers-section">
      <div className="computers-section-head">
        <div>
          <h2>电脑清单</h2>
          <p>已经接入的电脑。每张卡会标明是云电脑还是个人电脑。</p>
        </div>
      </div>
      <div className="computers-grid">
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            onDetail={() => onDetail(node)}
            onRevoke={canRevoke(node) ? () => onRevoke(node) : undefined}
          />
        ))}
      </div>
      <div className="computers-note">
        <Icon name="i-lock" size={14} />
        电脑使用权不等于 Workspace 访问权。Workspace 仍按 Private / Team 与 Viewer / Editor 单独控制。
      </div>
    </section>
  )
}

function NodeCard({ node, onDetail, onRevoke }: { node: ComputerNode; onDetail: () => void; onRevoke?: () => void }) {
  const status = statusMeta[node.status]
  const revokeLabel = node.status === 'pending' ? '撤销申请' : '撤销'
  const [confirming, setConfirming] = useState(false)

  return (
    <article className="computer-node">
      <div className="computer-node-top">
        <span className={`computer-node-icon is-${status.tone}`}>
          <Icon name="i-pc" size={18} />
        </span>
        <div className="computer-node-title">
          <strong>{node.name}</strong>
          <span>{node.os}</span>
        </div>
        <span className={`computer-status is-${status.tone}`}>
          <Icon name={status.icon} size={11} />
          {status.label}
        </span>
      </div>

      <div className="computer-node-specs">
        <span>{node.hardware}</span>
        <span>{node.memory}</span>
      </div>

      <div className="computer-node-source">
        <span className={node.personal ? 'computer-source is-personal' : 'computer-source'}>
          <Icon name={node.personal ? 'i-nav-user' : 'i-pc'} size={11} />
          {node.personal ? '个人电脑' : `云电脑 · ${node.source}`}
        </span>
        {node.scope ? (
          <span className="computer-scope-badge">
            {node.scope === 'private' ? '仅自己' : '团队'}
          </span>
        ) : null}
      </div>

      <div className="computer-node-address">
        <span><b>ID</b><code>{node.computerId}</code></span>
        <span><b>IP</b><code>{node.ip}</code></span>
      </div>

      <div className="computer-node-stats">
        <span><Icon name="i-ws" size={13} />{node.workspaces} 个 Workspace</span>
        <span><Icon name="i-apps" size={13} />{node.apps.length} 个 App</span>
      </div>

      <div className="computer-node-apps">
        {node.apps.length > 0 ? node.apps.map((app) => <span key={app}>{app}</span>) : <span>没有常驻 App</span>}
      </div>

      <footer className="computer-node-foot">
        <span>{node.lastActive}</span>
        <button className="computer-detail" type="button" onClick={onDetail}>
          {node.status === 'pending' ? '审批详情' : '详情'}
        </button>
        {onRevoke ? (
          confirming ? (
            <span className="computer-revoke-confirm">
              {revokeLabel}？
              <button type="button" onClick={onRevoke}>确认</button>
              <button type="button" onClick={() => setConfirming(false)}>取消</button>
            </span>
          ) : (
            <button className="computer-revoke" type="button" onClick={() => setConfirming(true)}>{revokeLabel}</button>
          )
        ) : null}
      </footer>
    </article>
  )
}

function PoolCard({
  pool,
  state,
  onRequest,
}: {
  pool: ComputerPool
  state?: RequestState
  onRequest: () => void
}) {
  const policy = policyMeta[pool.policy]
  const actionLabel = state === 'pending' ? '审批中' : state === 'approved' ? '已开通' : '申请使用'

  return (
    <article className="computer-pool">
      <div className="computer-pool-top">
        <span className={`computer-pool-icon is-${pool.tone}`}>
          <Icon name={pool.icon} size={18} />
        </span>
        <div>
          <strong>{pool.name}</strong>
          <span>{pool.visibility}</span>
        </div>
        <span className={`computer-policy is-${policy.tone}`}>{policy.label}</span>
      </div>
      <p>{pool.description}</p>
      <div className="computer-pool-tags">
        {pool.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
      <div className="computer-pool-stats">
        <span><strong>{pool.available}</strong> / {pool.total} 台可用</span>
        <span>{pool.quota}</span>
      </div>
      <footer className="computer-pool-foot">
        <span>当前有 {pool.available} 台可分配</span>
        <button
          className="computer-request"
          type="button"
          disabled={Boolean(state)}
          onClick={onRequest}
        >
          {actionLabel}
        </button>
      </footer>
    </article>
  )
}

function ComputerDetailDialog({
  node,
  onClose,
  onRevoke,
}: {
  node: ComputerNode
  onClose: () => void
  onRevoke?: () => void
}) {
  const status = statusMeta[node.status]
  const pending = node.status === 'pending'

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="computer-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="computer-dialog computer-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="computer-detail-title">
        <header className="computer-dialog-head">
          <div>
            <span className="computers-eyebrow">COMPUTER DETAILS</span>
            <h2 id="computer-detail-title">电脑详情</h2>
          </div>
          <button className="computer-dialog-close" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="i-act-close" size={16} />
          </button>
        </header>

        <div className="computer-detail-summary">
          <span className={`computer-node-icon is-${status.tone}`}><Icon name="i-pc" size={18} /></span>
          <div>
            <strong>{node.name}</strong>
            <span>{node.personal ? '个人电脑' : `云电脑 · ${node.source}`}{node.scope ? ` · ${node.scope === 'private' ? '仅自己' : '团队'}` : ''}</span>
          </div>
          <span className={`computer-status is-${status.tone}`}>
            <Icon name={status.icon} size={11} />
            {status.label}
          </span>
        </div>

        <div className="computer-detail-grid">
          <div><span>ID</span><code>{node.computerId}</code></div>
          <div><span>IP</span><code>{node.ip}</code></div>
          <div><span>系统</span><strong>{node.os}</strong></div>
          <div><span>硬件</span><strong>{node.hardware}</strong></div>
          <div><span>内存</span><strong>{node.memory}</strong></div>
          <div><span>Workspace</span><strong>{node.workspaces} 个</strong></div>
          <div><span>常驻 App</span><strong>{node.apps.length} 个</strong></div>
          <div><span>最近状态</span><strong>{node.lastActive}</strong></div>
        </div>

        {pending ? (
          <div className="computer-approval">
            <div className="computer-approval-head">
              <strong>审批状态</strong>
              <span className="computer-status is-warning"><Icon name="i-state-queued" size={11} />审批中</span>
            </div>
            <div className="computer-approval-steps">
              <div className="computer-approval-step is-done"><span>1</span><div><strong>已提交申请</strong><small>电脑已加入清单，资源暂未分配</small></div></div>
              <div className="computer-approval-step is-current"><span>2</span><div><strong>Team Owner 审批</strong><small>等待管理员在管理后台处理</small></div></div>
              <div className="computer-approval-step"><span>3</span><div><strong>审批通过后可直接接入</strong><small>无需再次申请，状态会自动更新为在线</small></div></div>
            </div>
            <p className="computer-dialog-hint">审批由管理后台完成，用户不需要重复提交申请。</p>
          </div>
        ) : null}

        <footer className="computer-dialog-actions">
          {pending && onRevoke ? (
            <button className="computer-dialog-secondary" type="button" onClick={onRevoke}>撤销申请</button>
          ) : null}
          <button className="computer-dialog-primary" type="button" onClick={onClose}>关闭</button>
        </footer>
      </section>
    </div>
  )
}

function PoolPickerDialog({
  requests,
  onClose,
  onSelect,
}: {
  requests: Record<string, RequestState>
  onClose: () => void
  onSelect: (pool: ComputerPool) => void
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="computer-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="computer-dialog computer-pool-dialog" role="dialog" aria-modal="true" aria-labelledby="pool-picker-title">
        <header className="computer-dialog-head">
          <div>
            <span className="computers-eyebrow">COMPUTER CLOUD</span>
            <h2 id="pool-picker-title">接入云电脑</h2>
          </div>
          <button className="computer-dialog-close" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="i-act-close" size={16} />
          </button>
        </header>
        <p className="computer-dialog-copy">选择一台云电脑。自动开通会直接加入电脑清单；审批与积分支付会先完成对应流程。</p>
        <div className="computer-pool-picker">
          {computerPools.map((pool) => {
            const policy = policyMeta[pool.policy]
            const state = requests[pool.id]
            return (
              <button
                className="computer-pool-pick"
                type="button"
                key={pool.id}
                disabled={Boolean(state)}
                onClick={() => onSelect(pool)}
              >
                <span className={`computer-pool-icon is-${pool.tone}`}>
                  <Icon name={pool.icon} size={18} />
                </span>
                <span className="computer-pool-pick-copy">
                  <strong>{pool.name}</strong>
                  <small>{pool.description}</small>
                  <span>{pool.tags.join(' · ')}</span>
                </span>
                <span className="computer-pool-pick-side">
                  <span className={`computer-policy is-${policy.tone}`}>{policy.label}</span>
                  <small>{pool.available} / {pool.total} 台可用</small>
                  {state ? <span className="computer-pool-pick-state">{state === 'pending' ? '审批中' : '已开通'}</span> : <Icon name="i-right" size={13} />}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function AddComputerDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: (input: { name: string; folder: string; scope: ComputerScope }) => void
}) {
  const [name, setName] = useState('这台电脑')
  const [folder, setFolder] = useState(defaultFolder)
  const [scope, setScope] = useState<ComputerScope>('private')
  const [folderOpen, setFolderOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="computer-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="computer-dialog" role="dialog" aria-modal="true" aria-labelledby="add-computer-title">
        <header className="computer-dialog-head">
          <div>
            <span className="computers-eyebrow">PERSONAL NODE</span>
            <h2 id="add-computer-title">接入本机</h2>
          </div>
          <button className="computer-dialog-close" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="i-act-close" size={16} />
          </button>
        </header>
        <p className="computer-dialog-copy">这台电脑已经在 Yao Agents 中运行。确认接入的服务器、电脑名称、存储目录与共享方式，即可完成接入。</p>

        <div className="computer-server">
          <span className="computer-server-icon"><Icon name="i-globe" size={18} /></span>
          <div>
            <span>{connectionServer.label}</span>
            <strong>{connectionServer.host}</strong>
            <small>{connectionServer.addresses.join(' · ')}</small>
          </div>
          <span className="computer-server-state">
            <Icon name="i-check" size={11} />
            已连接
          </span>
        </div>

        <label className="computer-name">
          <span>电脑名称</span>
          <input
            value={name}
            aria-label="电脑名称"
            placeholder="例如：Wren 的 MacBook Pro"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="computer-folder-head">
          <strong>存储目录</strong>
          <span>Workspace 会创建在这里</span>
        </div>
        <div className="computer-folder">
          <Icon name="i-folder" size={16} />
          <input
            value={folder}
            aria-label="存储目录"
            onChange={(event) => setFolder(event.target.value)}
          />
          <button type="button" onClick={() => setFolderOpen((open) => !open)}>选择文件夹</button>
        </div>
        {folderOpen ? (
          <div className="computer-folder-menu">
            {recentFolders.map((path) => (
              <button
                className={path === folder ? 'is-selected' : undefined}
                type="button"
                key={path}
                onClick={() => {
                  setFolder(path)
                  setFolderOpen(false)
                }}
              >
                <Icon name="i-folder" size={13} />
                <span>{path}</span>
                {path === folder ? <Icon name="i-check" size={12} /> : null}
              </button>
            ))}
          </div>
        ) : null}
        <p className="computer-dialog-hint">默认是 Documents/YaoAgents/Volumes，也可以指定其他文件夹。</p>

        <div className="computer-scope">
          <div className="computer-folder-head">
            <strong>共享方式</strong>
            <span>接入后可以再修改</span>
          </div>
          <div className="computer-scope-options">
            <button
              className={scope === 'private' ? 'computer-scope-option is-selected' : 'computer-scope-option'}
              type="button"
              aria-pressed={scope === 'private'}
              onClick={() => setScope('private')}
            >
              <Icon name="i-lock" size={14} />
              <span><strong>仅自己使用</strong><small>只有自己可见</small></span>
            </button>
            <button
              className={scope === 'shared' ? 'computer-scope-option is-selected' : 'computer-scope-option'}
              type="button"
              aria-pressed={scope === 'shared'}
              onClick={() => setScope('shared')}
            >
              <Icon name="i-ws" size={14} />
              <span><strong>团队可用</strong><small>团队内可见</small></span>
            </button>
          </div>
        </div>

        <div className="computer-dialog-note">
          <Icon name="i-lock" size={13} />
          电脑使用权不等于 Workspace 访问权；共享后仍按 Workspace 的角色控制读写。
        </div>
        <footer className="computer-dialog-actions">
          <button className="computer-dialog-secondary" type="button" onClick={onClose}>取消</button>
          <button className="computer-dialog-primary" type="button" disabled={!name.trim()} onClick={() => onConfirm({ name, folder, scope })}>确认接入</button>
        </footer>
      </section>
    </div>
  )
}

function RequestPoolDialog({
  pool,
  pointsBalance,
  onRecharge,
  onClose,
  onConfirm,
}: {
  pool: ComputerPool
  pointsBalance: number
  onRecharge: (amount: number) => void
  onClose: () => void
  onConfirm: (input: { name: string; scope: ComputerScope }) => void
}) {
  const policy = policyMeta[pool.policy]
  const paid = pool.policy === 'paid'
  const cost = pool.pricePoints ?? 0
  const enoughPoints = pointsBalance >= cost
  const [name, setName] = useState(pool.name)
  const [scope, setScope] = useState<ComputerScope>('private')
  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState(500)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const actionLabel = paid
    ? enoughPoints ? `支付 ${cost} 积分并开通` : '去充值'
    : pool.policy === 'approval' ? '提交申请' : '确认接入'

  function handlePrimary() {
    if (!name.trim()) return
    if (paid && !enoughPoints) {
      setRechargeOpen(true)
      return
    }
    onConfirm({ name, scope })
  }

  return (
    <div className="computer-dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="computer-dialog" role="dialog" aria-modal="true" aria-labelledby="request-pool-title">
        <header className="computer-dialog-head">
          <div>
            <span className="computers-eyebrow">CLOUD COMPUTER</span>
            <h2 id="request-pool-title">接入 {pool.name}</h2>
          </div>
          <button className="computer-dialog-close" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="i-act-close" size={16} />
          </button>
        </header>
        <div className="computer-request-summary">
          <span className={`computer-pool-icon is-${pool.tone}`}><Icon name={pool.icon} size={18} /></span>
          <div><strong>{pool.name}</strong><span>{pool.visibility}</span></div>
          <span className={`computer-policy is-${policy.tone}`}>{policy.label}</span>
        </div>

        <label className="computer-name">
          <span>云电脑别名</span>
          <input
            value={name}
            aria-label="云电脑别名"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="computer-scope">
          <div className="computer-folder-head">
            <strong>共享方式</strong>
            <span>接入后可以再修改</span>
          </div>
          <div className="computer-scope-options">
            <button
              className={scope === 'private' ? 'computer-scope-option is-selected' : 'computer-scope-option'}
              type="button"
              aria-pressed={scope === 'private'}
              onClick={() => setScope('private')}
            >
              <Icon name="i-lock" size={14} />
              <span><strong>仅自己使用</strong><small>只有自己能看见</small></span>
            </button>
            <button
              className={scope === 'shared' ? 'computer-scope-option is-selected' : 'computer-scope-option'}
              type="button"
              aria-pressed={scope === 'shared'}
              onClick={() => setScope('shared')}
            >
              <Icon name="i-ws" size={14} />
              <span><strong>团队可用</strong><small>团队成员可见</small></span>
            </button>
          </div>
        </div>

        <div className="computer-request-rows">
          <div><span>可用机器</span><strong>{pool.available} / {pool.total}</strong></div>
          <div><span>配额</span><strong>{pool.quota}</strong></div>
          <div><span>开通方式</span><strong>{policy.label}</strong></div>
        </div>

        {paid ? (
          <div className="computer-payment">
            <div className="computer-payment-head">
              <strong>积分支付</strong>
              <span>余额 {pointsBalance} 积分</span>
            </div>
            <div className="computer-payment-row">
              <span>本次支付</span>
              <strong>{cost} 积分</strong>
            </div>
            <p className={enoughPoints ? 'computer-payment-copy' : 'computer-payment-copy is-short'}>
              {enoughPoints ? '支付成功后立即开通，不需要等待审批。' : `积分不足，还差 ${cost - pointsBalance} 积分。`}
            </p>
            {rechargeOpen ? (
              <div className="computer-recharge">
                <div className="computer-recharge-options">
                  {[100, 500, 1000].map((amount) => (
                    <button
                      className={rechargeAmount === amount ? 'is-selected' : undefined}
                      type="button"
                      key={amount}
                      onClick={() => setRechargeAmount(amount)}
                    >
                      {amount} 积分
                    </button>
                  ))}
                </div>
                <button
                  className="computer-recharge-submit"
                  type="button"
                  onClick={() => {
                    onRecharge(rechargeAmount)
                    setRechargeOpen(false)
                  }}
                >
                  充值 {rechargeAmount} 积分
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="computer-dialog-copy">{requestCopy[pool.policy]}</p>
        )}

        <p className="computer-dialog-hint">接入云电脑仅 Team Owner 可操作。</p>
        <footer className="computer-dialog-actions">
          <button className="computer-dialog-secondary" type="button" onClick={onClose}>取消</button>
          {paid && !enoughPoints && rechargeOpen ? null : (
            <button className="computer-dialog-primary" type="button" disabled={!name.trim()} onClick={handlePrimary}>
              {actionLabel}
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}
