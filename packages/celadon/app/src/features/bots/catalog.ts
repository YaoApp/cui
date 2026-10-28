import type { IconId } from '@/platform/icons/icon-ids'
import type { I18nKey } from '@/platform/i18n/i18n-types'

export type BotCopy = {
  id: string
  nameKey: I18nKey
  englishKey: I18nKey
  descriptionKey: I18nKey
  metaKey: I18nKey
  icon: IconId
}

const BOT_COPY: Record<string, BotCopy> = {
  researcher: {
    id: 'researcher',
    nameKey: 'session.bot.researcher',
    englishKey: 'session.bot.researcherEnglish',
    descriptionKey: 'session.bot.researcherDesc',
    metaKey: 'session.bot.researcherMeta',
    icon: 'i-search',
  },
  analyst: {
    id: 'analyst',
    nameKey: 'session.bot.analyst',
    englishKey: 'session.bot.analystEnglish',
    descriptionKey: 'session.bot.analystDesc',
    metaKey: 'session.bot.analystMeta',
    icon: 'i-file-sheet',
  },
  editor: {
    id: 'editor',
    nameKey: 'session.bot.editor',
    englishKey: 'session.bot.editorEnglish',
    descriptionKey: 'session.bot.editorDesc',
    metaKey: 'session.bot.editorMeta',
    icon: 'i-act-edit',
  },
}

export function botCopy(id: string): BotCopy | undefined {
  return BOT_COPY[id]
}
