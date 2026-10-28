import type { IconId } from '@/platform/icons/icon-ids'
import type { I18nKey } from '@/platform/i18n/i18n-types'

export type AppCopy = {
  id: string
  nameKey: I18nKey
  englishKey: I18nKey
  descriptionKey: I18nKey
  metaKey: I18nKey
  icon: IconId
}

const APP_COPY: Record<string, AppCopy> = {
  'poster-studio': {
    id: 'poster-studio',
    nameKey: 'session.app.poster',
    englishKey: 'session.app.posterEnglish',
    descriptionKey: 'session.app.posterDesc',
    metaKey: 'session.app.posterMeta',
    icon: 'i-act-edit',
  },
  'product-shots': {
    id: 'product-shots',
    nameKey: 'session.app.product',
    englishKey: 'session.app.productEnglish',
    descriptionKey: 'session.app.productDesc',
    metaKey: 'session.app.productMeta',
    icon: 'i-file-sheet',
  },
  'teaching-aids': {
    id: 'teaching-aids',
    nameKey: 'session.app.teaching',
    englishKey: 'session.app.teachingEnglish',
    descriptionKey: 'session.app.teachingDesc',
    metaKey: 'session.app.teachingMeta',
    icon: 'i-book',
  },
}

export function appCopy(id: string): AppCopy | undefined {
  return APP_COPY[id]
}
