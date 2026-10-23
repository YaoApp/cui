export type BotAvatar = {
  id: string
  name: string
  english: string
  role: string
  description: string
  src: string
}

export const botAvatars: BotAvatar[] = [
  {
    id: 'bell',
    name: '钟形',
    english: 'Bell',
    role: '助理',
    description: '圆顶、稳定，轮廓最克制，适合通用助理与日常协作。',
    src: '/avatars/light/bell-256.png',
  },
  {
    id: 'mochi',
    name: '麻薯',
    english: 'Mochi',
    role: '分析师',
    description: '圆润、沉着，视觉重心低，适合数据整理与判断。',
    src: '/avatars/light/mochi-256.png',
  },
  {
    id: 'tall',
    name: '瘦高',
    english: 'Tall',
    role: '研究员',
    description: '修长、专注，适合检索、深读与追来源。',
    src: '/avatars/light/tall-256.png',
  },
  {
    id: 'wave',
    name: '波浪',
    english: 'Wave',
    role: '编辑',
    description: '轻微倾斜、有流动感，适合写作、改写与语气调整。',
    src: '/avatars/light/wave-256.png',
  },
  {
    id: 'sheet',
    name: '床单',
    english: 'Sheet',
    role: '工程师',
    description: '向下展开、能承托，适合搭建、实现与排错。',
    src: '/avatars/light/sheet-256.png',
  },
  {
    id: 'cloud',
    name: '云',
    english: 'Cloud',
    role: '创意',
    description: '顶部松软、边界轻，适合发散、命名与视觉方向。',
    src: '/avatars/light/cloud-256.png',
  },
  {
    id: 'cone',
    name: '锥形',
    english: 'Cone',
    role: '执行',
    description: '向上收束、重心稳，适合推进、拆解与落地。',
    src: '/avatars/light/cone-256.png',
  },
  {
    id: 'shell',
    name: '贝壳',
    english: 'Shell',
    role: '知识',
    description: '两侧内卷、像把资料收进档案，适合归档、检索与引用。',
    src: '/avatars/light/shell-256.png',
  },
  {
    id: 'pillar',
    name: '柱形',
    english: 'Pillar',
    role: '审阅',
    description: '垂直、克制，适合校对、审核与把关。',
    src: '/avatars/light/pillar-256.png',
  },
  {
    id: 'pillow',
    name: '枕形',
    english: 'Pillow',
    role: '日程',
    description: '平缓、柔和，适合安排、提醒与协调。',
    src: '/avatars/light/pillow-256.png',
  },
]

export const defaultBotAvatar = botAvatars[0]

export function findBotAvatar(id: string): BotAvatar {
  return botAvatars.find((avatar) => avatar.id === id) ?? defaultBotAvatar
}
