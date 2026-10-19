export type ModuleIcon =
  | 'i-plus-square'
  | 'i-apps'
  | 'i-bot'
  | 'i-inbox'
  | 'i-board'
  | 'i-ws'
  | 'i-pc'

export type ProductModule = {
  id: string
  index: string
  label: string
  english: string
  definition: string
  icon: ModuleIcon
}

export const modules: ProductModule[] = [
  {
    id: 'new',
    index: '01',
    label: '新会话',
    english: 'New Session',
    definition: '使用 Apps / Bots，或 Create App / Bot',
    icon: 'i-plus-square',
  },
  {
    id: 'apps',
    index: '02',
    label: '应用',
    english: 'Apps',
    definition: 'App 内核 + 人面 + Agent 面；绑定 Workspace 与 Computer',
    icon: 'i-apps',
  },
  {
    id: 'bots',
    index: '03',
    label: '智能体',
    english: 'Bots',
    definition: '固定形态的 App；共享后是一个 chat 入口',
    icon: 'i-bot',
  },
  {
    id: 'inbox',
    index: '04',
    label: '收件箱',
    english: 'Inbox',
    definition: '所有消息、会话与通知的集散地',
    icon: 'i-inbox',
  },
  {
    id: 'boards',
    index: '05',
    label: '看板',
    english: 'Boards',
    definition: '一组相关会话的容器；Kanban 是其中一种视图',
    icon: 'i-board',
  },
  {
    id: 'workspace',
    index: '06',
    label: '工作空间',
    english: 'Workspaces',
    definition: '跨设备统一管理；可访问的 N 台电脑上的 N 个空间',
    icon: 'i-ws',
  },
  {
    id: 'computer',
    index: '07',
    label: '电脑',
    english: 'Computers',
    definition: '电脑池、个人节点与可用节点（已申请）',
    icon: 'i-pc',
  },
]

export const globalFunctions = ['搜索', '通知', '账户菜单', '设置', '主题与语言']
