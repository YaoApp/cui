import type { IconId } from '../../../../../app/src/platform/icons/icon-ids'
import { botProfiles } from '../bots/data'

export type InboxKind = 'bot' | 'notification' | 'share'
export type InboxTone = 'success' | 'warning' | 'danger' | 'neutral' | 'brand'
export type InboxGroup = '今天' | '昨天'

export type InboxMessage = {
  from: 'bot' | 'me'
  text: string
  time: string
  attachment?: string
}

export type InboxItem = {
  id: string
  kind: InboxKind
  title: string
  subtitle: string
  preview: string
  time: string
  group: InboxGroup
  unread: boolean
  avatar?: string
  icon?: IconId
  tone?: InboxTone
  status?: string
  meta?: string
  sessionId?: string
  board?: { name: string; column: string }
  messages?: InboxMessage[]
  detail?: string
  approval?: {
    command: string
    reason: string
    risk: string
    scope: string
  }
}

const researcher = botProfiles.find((bot) => bot.id === 'researcher') ?? botProfiles[0]
const analyst = botProfiles.find((bot) => bot.id === 'analyst') ?? botProfiles[1]
const editor = botProfiles.find((bot) => bot.id === 'editor') ?? botProfiles[2]

export const inboxItems: InboxItem[] = [
  {
    id: 'bot-researcher',
    kind: 'bot',
    title: '支付条款风险',
    subtitle: `研究员 · ${researcher.english}`,
    preview: '三份报告的引用都核对完了，其中两份在市场规模上互相矛盾。',
    time: '10:42',
    group: '今天',
    unread: true,
    avatar: researcher.avatar,
    status: '等待确认',
    meta: '2 个引用待确认',
    sessionId: 'demo',
    board: { name: '产品', column: '待处理' },
    messages: [
      {
        from: 'bot',
        text: '三份报告的引用都核对完了。其中两份在 2026 市场规模上互相矛盾，我把差异和来源都列出来了。',
        time: '10:38',
      },
      {
        from: 'me',
        text: '先把矛盾点列出来，别改结论。',
        time: '10:40',
      },
      {
        from: 'bot',
        text: '已整理成三条。第一条是统计口径不同，第二条是样本时间不一致，第三条需要回原文确认。',
        time: '10:42',
        attachment: 'source-check.md',
      },
    ],
  },
  {
    id: 'notice-branch',
    kind: 'notification',
    title: '合同审核支线已完成',
    subtitle: 'Branch · Liability review',
    preview: '发现 3 个高风险点，已回到主线，等待你确认。',
    time: '10:18',
    group: '今天',
    unread: true,
    icon: 'i-branch',
    tone: 'success',
    status: '已完成',
    meta: '来自 审查合同条款',
    sessionId: 'demo',
    detail: '支线 Liability review 已结束。Agent 在付款、违约金与终止条款上各发现一个高风险点，证据和原文引用已写回主线。',
  },
  {
    id: 'bot-analyst',
    kind: 'bot',
    title: '季度转化异常',
    subtitle: `分析师 · ${analyst.english}`,
    preview: '季度的异常点找到了：转化率在第二周突然掉了一档。',
    time: '09:56',
    group: '今天',
    unread: true,
    avatar: analyst.avatar,
    status: '有新回复',
    meta: '数据 · Charts',
    sessionId: 'demo',
    board: { name: '增长', column: '进行中' },
    messages: [
      {
        from: 'bot',
        text: '季度的异常点找到了。转化率在第二周从 4.8% 掉到 3.1%，和投放渠道切换的时间吻合。',
        time: '09:54',
      },
      {
        from: 'bot',
        text: '我做了分渠道拆分，问题集中在其中一个新渠道，建议先停量再看两天。',
        time: '09:56',
      },
    ],
  },
  {
    id: 'notice-job',
    kind: 'notification',
    title: 'PDF 解析失败',
    subtitle: 'Backend job · Extract contract text',
    preview: 'contract-v2.pdf 第 8 页无法解析，任务已停止。',
    time: '09:32',
    group: '今天',
    unread: true,
    icon: 'i-state-error',
    tone: 'danger',
    status: '失败',
    meta: '审查合同条款 · 退出码 1',
    sessionId: 'demo',
    detail: 'PDF 第 8 页是扫描件，没有文本层。可以改用 OCR 重新解析，或在会话里上传可搜索版本。',
  },
  {
    id: 'approval-install',
    kind: 'notification',
    title: '等待批准：安装依赖',
    subtitle: 'Approval · Run command',
    preview: 'Agent 想运行 pnpm install，需要你确认后才能继续。',
    time: '09:18',
    group: '今天',
    unread: true,
    icon: 'i-state-warning',
    tone: 'warning',
    status: '等待审批',
    meta: '来自 支付条款风险 · 工具调用',
    sessionId: 'demo',
    detail: '工具调用会修改当前 Workspace 的依赖目录。批准一次只对本次命令生效。',
    approval: {
      command: 'pnpm install',
      reason: '补齐 PDF 解析依赖，继续处理扫描页。',
      risk: '会写入 node_modules 与 lockfile；不会访问 Vault。',
      scope: '当前 Workspace · Research · Private',
    },
  },
  {
    id: 'share-researcher',
    kind: 'share',
    title: '研究员与你分享了一个 Bot',
    subtitle: '来自 Yao Agents · 分享入口',
    preview: '可以直接开始对话，Bot 的身份、技能与工作区由分享方定义。',
    time: '昨天',
    group: '昨天',
    unread: false,
    avatar: researcher.avatar,
    status: '可开始',
    meta: 'Web · Citations · Report',
    sessionId: 'demo',
    detail: '研究员的身份与技能固定，会话和文件与分享方隔离。打开后会在你的 Workspace 里创建新的 Session。',
  },
  {
    id: 'bot-editor',
    kind: 'bot',
    title: '发布说明第二版',
    subtitle: `编辑 · ${editor.english}`,
    preview: '第二版语气已经收紧，删掉了两处重复的判断句。',
    time: '昨天',
    group: '昨天',
    unread: false,
    avatar: editor.avatar,
    status: '已完成',
    meta: 'Writing · Review',
    sessionId: 'demo',
    board: { name: '产品', column: '待审核' },
    messages: [
      {
        from: 'bot',
        text: '第二版语气已经收紧，删掉了两处重复的判断句，事实引用没有动。',
        time: '18:06',
      },
      {
        from: 'bot',
        text: '最后一段我保留了原来的结论，只把措辞改得更直接。',
        time: '18:08',
      },
    ],
  },
  {
    id: 'notice-call',
    kind: 'notification',
    title: 'Voice Chat 未接来电',
    subtitle: '研究员 · 呼入 0:18',
    preview: '昨天 09:12 的语音呼叫未接听。',
    time: '昨天',
    group: '昨天',
    unread: false,
    icon: 'i-phone',
    tone: 'neutral',
    status: '未接',
    meta: '研究员',
    sessionId: 'demo',
    detail: '研究员在昨天 09:12 发起语音通话，持续 18 秒后结束。可以从会话里回拨。',
  },
]

export function kindLabel(kind: InboxKind): string {
  if (kind === 'bot') return '会话'
  if (kind === 'share') return '分享'
  return '通知'
}

export function kindOfFilter(item: InboxItem, filter: 'all' | 'unread' | 'bot' | 'notice'): boolean {
  if (filter === 'all') return true
  if (filter === 'unread') return item.unread
  if (filter === 'bot') return item.kind === 'bot'
  return item.kind !== 'bot'
}
