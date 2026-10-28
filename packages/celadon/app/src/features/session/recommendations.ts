import type { IconId } from '@/platform/icons/icon-ids'
import type { I18nKey } from '@/platform/i18n/i18n-types'

export type RecommendationKind = 'app' | 'bot'

export type Recommendation = {
  id: string
  kind: RecommendationKind
  nameKey: I18nKey
  englishKey: I18nKey
  descriptionKey: I18nKey
  metaKey: I18nKey
  icon: IconId
}

export const APP_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'poster-studio',
    kind: 'app',
    nameKey: 'session.app.poster',
    englishKey: 'session.app.posterEnglish',
    descriptionKey: 'session.app.posterDesc',
    metaKey: 'session.app.posterMeta',
    icon: 'i-act-edit',
  },
  {
    id: 'product-shots',
    kind: 'app',
    nameKey: 'session.app.product',
    englishKey: 'session.app.productEnglish',
    descriptionKey: 'session.app.productDesc',
    metaKey: 'session.app.productMeta',
    icon: 'i-file-sheet',
  },
  {
    id: 'teaching-aids',
    kind: 'app',
    nameKey: 'session.app.teaching',
    englishKey: 'session.app.teachingEnglish',
    descriptionKey: 'session.app.teachingDesc',
    metaKey: 'session.app.teachingMeta',
    icon: 'i-book',
  },
]

export const BOT_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'researcher',
    kind: 'bot',
    nameKey: 'session.bot.researcher',
    englishKey: 'session.bot.researcherEnglish',
    descriptionKey: 'session.bot.researcherDesc',
    metaKey: 'session.bot.researcherMeta',
    icon: 'i-search',
  },
  {
    id: 'analyst',
    kind: 'bot',
    nameKey: 'session.bot.analyst',
    englishKey: 'session.bot.analystEnglish',
    descriptionKey: 'session.bot.analystDesc',
    metaKey: 'session.bot.analystMeta',
    icon: 'i-file-sheet',
  },
  {
    id: 'editor',
    kind: 'bot',
    nameKey: 'session.bot.editor',
    englishKey: 'session.bot.editorEnglish',
    descriptionKey: 'session.bot.editorDesc',
    metaKey: 'session.bot.editorMeta',
    icon: 'i-act-edit',
  },
]

export const RECOMMENDATION_COPY: Record<string, Recommendation> = Object.fromEntries(
  [...APP_RECOMMENDATIONS, ...BOT_RECOMMENDATIONS].map((item) => [item.id, item]),
)

export function recommendationCopy(id: string): Recommendation | undefined {
  return RECOMMENDATION_COPY[id]
}
