import { bots } from '../new-session/data'

export type BotProfile = (typeof bots)[number] & {
  welcome: string
  workspace: string
  workspaceId: string
  model: string
  effort: string
  prompts: string[]
  capabilities: string[]
}

const details: Record<string, Omit<BotProfile, keyof (typeof bots)[number]>> = {
  researcher: {
    welcome: '我是研究员。给我一个问题，我会找资料、追来源、核对说法，再给出带引用的结论。',
    workspace: 'Research',
    workspaceId: 'research-notes',
    model: 'DeepSeek Flash 4.1',
    effort: 'Balanced',
    prompts: ['帮我查一下这个行业最近三个月的变化', '对比两份报告的说法是否一致', '给我一页带来源的结论'],
    capabilities: ['Web', 'Citations', 'Report'],
  },
  analyst: {
    welcome: '我是分析师。把数据或问题交给我，我会找异常、做图表，再给出能执行的判断。',
    workspace: 'Data',
    workspaceId: 'automation-lab',
    model: 'DeepSeek Pro 4.1',
    effort: 'Deep',
    prompts: ['看看这份 CSV 有没有异常', '把关键指标做成一张图', '给我三个可执行的判断'],
    capabilities: ['Data', 'Charts', 'SQL'],
  },
  editor: {
    welcome: '我是编辑。把草稿交给我，我会收紧结构、统一语气，并检查事实与表达。',
    workspace: 'Editorial',
    workspaceId: 'brand-launch',
    model: 'Claude Sonnet 4.5',
    effort: 'Balanced',
    prompts: ['收紧这段文案，保留原意', '检查这份报告的事实与语气', '把这份长文改成 800 字'],
    capabilities: ['Writing', 'Review', 'Style'],
  },
}

export const botProfiles: BotProfile[] = bots.map((bot) => ({
  ...bot,
  ...details[bot.id],
}))

export function readBot(id: string): BotProfile | undefined {
  return botProfiles.find((bot) => bot.id === id)
}
