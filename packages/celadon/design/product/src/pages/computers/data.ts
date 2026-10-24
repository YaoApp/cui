import type { IconId } from '../../../../app/src/platform/icons/icon-ids'

export type ComputerTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
export type ComputerStatus = 'online' | 'serving' | 'busy' | 'offline' | 'pending'
export type PoolPolicy = 'auto' | 'approval' | 'paid'
export type ComputerScope = 'private' | 'shared' | 'members'
export type ComputerMemberRole = 'admin' | 'user'

export type ComputerNode = {
  id: string
  computerId: string
  ip: string
  name: string
  os: string
  hardware: string
  memory: string
  status: ComputerStatus
  workspaces: number
  apps: string[]
  source: string
  lastActive: string
  personal?: boolean
  scope?: ComputerScope
  memberIds?: string[]
  memberRoles?: Record<string, ComputerMemberRole>
  poolId?: string
  ownerId?: string
}

export const computerScopeMeta: Record<ComputerScope, { label: string; short: string }> = {
  private: { label: 'Private', short: '仅自己' },
  shared: { label: 'Team', short: '团队' },
  members: { label: 'Specified', short: '指定成员' },
}

export const computerMemberCandidates = [
  { id: 'emma', name: 'Emma Lin', email: 'emma@yaoagents.com' },
  { id: 'lin', name: 'Lin Chen', email: 'lin@yaoagents.com' },
  { id: 'kai', name: 'Kai Wu', email: 'kai@yaoagents.com' },
  { id: 'noah', name: 'Noah Park', email: 'noah@yaoagents.com' },
]

export type ComputerPool = {
  id: string
  name: string
  description: string
  icon: IconId
  tone: ComputerTone
  policy: PoolPolicy
  total: number
  available: number
  quota: string
  visibility: string
  tags: string[]
  pricePoints?: number
}

export const statusMeta: Record<ComputerStatus, { label: string; tone: ComputerTone; icon: IconId }> = {
  online: { label: '在线', tone: 'success', icon: 'i-check' },
  serving: { label: '伺服中', tone: 'brand', icon: 'i-state-loading' },
  busy: { label: '使用中', tone: 'warning', icon: 'i-state-loading' },
  offline: { label: '离线', tone: 'neutral', icon: 'i-state-queued' },
  pending: { label: '审批中', tone: 'warning', icon: 'i-state-queued' },
}

export const policyMeta: Record<PoolPolicy, { label: string; tone: ComputerTone }> = {
  auto: { label: '自动开通', tone: 'success' },
  approval: { label: '需要审批', tone: 'warning' },
  paid: { label: '积分支付', tone: 'neutral' },
}

export const availableNodes: ComputerNode[] = [
  {
    id: 'node-studio',
    computerId: 'cld-mac-01',
    ip: '10.24.8.11',
    name: 'Mac Studio · 研究机',
    os: 'macOS 15.1',
    hardware: 'Apple M3 Ultra · 28 核',
    memory: '64 GB',
    status: 'serving',
    workspaces: 8,
    apps: ['Research', 'Source Watch'],
    source: 'macOS',
    lastActive: '刚刚活跃',
    scope: 'shared',
    poolId: 'pool-macos',
  },
  {
    id: 'node-linux',
    computerId: 'cld-linux-03',
    ip: '10.24.8.23',
    name: 'Linux 构建机',
    os: 'Ubuntu 24.04',
    hardware: '16 vCPU · AMD EPYC',
    memory: '64 GB',
    status: 'online',
    workspaces: 5,
    apps: ['Build Server'],
    source: 'Linux 构建',
    lastActive: '3 分钟前',
    scope: 'shared',
    poolId: 'pool-linux',
  },
  {
    id: 'node-gpu',
    computerId: 'cld-gpu-02',
    ip: '10.24.9.12',
    name: 'GPU 工作站',
    os: 'Ubuntu 24.04',
    hardware: 'NVIDIA RTX 4090',
    memory: '24 GB VRAM',
    status: 'busy',
    workspaces: 3,
    apps: ['Model Lab', 'Inference'],
    source: 'GPU',
    lastActive: '18 分钟前',
    scope: 'shared',
    poolId: 'pool-gpu',
  },
  {
    id: 'node-windows',
    computerId: 'cld-win-01',
    ip: '10.24.8.31',
    name: 'Windows 设计机',
    os: 'Windows 11',
    hardware: 'Intel i9 · 16 核',
    memory: '32 GB',
    status: 'online',
    workspaces: 4,
    apps: ['Design Review'],
    source: 'Windows 设计',
    lastActive: '1 小时前',
    scope: 'shared',
    poolId: 'pool-windows',
  },
]

export const personalNodes: ComputerNode[] = [
  {
    id: 'personal-mbp',
    computerId: 'psn-wren-mbp',
    ip: '192.168.1.24',
    name: 'Wren 的 MacBook Pro',
    os: 'macOS 15.1',
    hardware: 'Apple M4 Pro · 14 核',
    memory: '24 GB',
    status: 'online',
    workspaces: 2,
    apps: ['Notes'],
    source: '个人电脑',
    lastActive: '刚刚活跃',
    personal: true,
    ownerId: 'wren',
    scope: 'private',
  },
  {
    id: 'personal-mini',
    computerId: 'psn-wren-mini',
    ip: '192.168.1.28',
    name: 'Wren 的 Mac mini',
    os: 'macOS 14.6',
    hardware: 'Apple M2 · 8 核',
    memory: '16 GB',
    status: 'offline',
    workspaces: 1,
    apps: [],
    source: '个人电脑',
    lastActive: '2 天前',
    personal: true,
    ownerId: 'wren',
    scope: 'shared',
  },
]

export const computerPools: ComputerPool[] = [
  {
    id: 'pool-macos',
    name: 'macOS 云电脑',
    description: 'Apple Silicon 桌面机，适合研究、设计与日常 Agent 任务。',
    icon: 'i-pc',
    tone: 'brand',
    policy: 'auto',
    total: 6,
    available: 3,
    quota: '每人最多 2 台',
    visibility: '团队内可见',
    tags: ['macOS', 'Apple Silicon'],
  },
  {
    id: 'pool-gpu',
    name: 'GPU 云电脑',
    description: '带独立显卡的 Linux 工作站，用于模型推理与训练。',
    icon: 'i-spark',
    tone: 'warning',
    policy: 'approval',
    total: 3,
    available: 1,
    quota: '每人最多 1 台',
    visibility: '算法组可见',
    tags: ['Linux', 'GPU', 'RTX 4090'],
  },
  {
    id: 'pool-linux',
    name: 'Linux 构建云电脑',
    description: '通用的 Linux 构建与测试机器，适合编译、压测与持续集成。',
    icon: 'i-file-terminal',
    tone: 'success',
    policy: 'auto',
    total: 8,
    available: 5,
    quota: '每人最多 2 台',
    visibility: '团队内可见',
    tags: ['Linux', 'Build'],
  },
  {
    id: 'pool-windows',
    name: 'Windows 设计云电脑',
    description: 'Windows 桌面机，预装设计检查与浏览器测试工具。',
    icon: 'i-apps',
    tone: 'neutral',
    policy: 'paid',
    total: 4,
    available: 0,
    quota: '按需开通',
    visibility: '指定成员组',
    tags: ['Windows', 'Design'],
    pricePoints: 480,
  },
]

export const requestCopy: Record<PoolPolicy, string> = {
  auto: '提交后自动开通，机器会出现在电脑清单里。',
  approval: '提交后由团队管理员审批，通过后会出现在电脑清单里。',
  paid: '使用积分支付，支付成功后立即开通。',
}

export const defaultFolder = '/Users/max/Documents/YaoAgents/Volumes'

export const recentFolders = [
  defaultFolder,
  '/Users/max/Documents/YaoAgents/Shared',
  '/Users/max/Projects',
]

export const connectionServer = {
  host: 'bj.yaoagents.cn',
  addresses: ['192.168.1.212', '127.0.0.1'],
  label: '当前服务器',
}
