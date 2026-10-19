import type { IconId } from '../../../../../app/src/platform/icons/icon-ids'

export type RecommendationKind = 'app' | 'bot'

export type Recommendation = {
  id: string
  kind: RecommendationKind
  name: string
  english: string
  description: string
  icon: IconId
  meta: string
}

export const apps: Recommendation[] = [
  {
    id: 'poster-studio',
    kind: 'app',
    name: '海报设计',
    english: 'Poster Studio',
    description: '按主题、尺寸与品牌规范生成海报草稿，支持多版本对比与导出。',
    icon: 'i-act-edit',
    meta: 'Design · Export',
  },
  {
    id: 'product-shots',
    kind: 'app',
    name: '电商配图',
    english: 'Product Shots',
    description: '为商品生成主图、场景图与卖点标注，按平台尺寸批量导出。',
    icon: 'i-file-sheet',
    meta: 'Commerce · Images',
  },
  {
    id: 'teaching-aids',
    kind: 'app',
    name: '教具制作',
    english: 'Teaching Aids',
    description: '把课程知识点做成可打印的教具、卡片与课堂活动。',
    icon: 'i-book',
    meta: 'Education · Print',
  },
]

export const bots: Recommendation[] = [
  {
    id: 'researcher',
    kind: 'bot',
    name: '研究员',
    english: 'Researcher',
    description: '找资料、追来源、核对说法，给出带引用的结论。',
    icon: 'i-search',
    meta: 'Web · Citations',
  },
  {
    id: 'analyst',
    kind: 'bot',
    name: '分析师',
    english: 'Analyst',
    description: '读数据、找异常、给出图表与可执行的判断。',
    icon: 'i-file-sheet',
    meta: 'Data · Charts',
  },
  {
    id: 'editor',
    kind: 'bot',
    name: '编辑',
    english: 'Editor',
    description: '收紧结构、统一语气，检查事实与表达。',
    icon: 'i-act-edit',
    meta: 'Writing · Review',
  },
]
