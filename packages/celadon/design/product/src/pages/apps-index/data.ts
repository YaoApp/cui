import { apps } from '../new-session/data'

export type AppSource = 'self' | 'official' | 'third-party'

export type AppEntry = (typeof apps)[number] & {
  category: string
  surface: string
  workspace: string
  updated: string
  status: 'ready' | 'draft'
  source: AppSource
}

const details: Record<string, Omit<AppEntry, keyof (typeof apps)[number]>> = {
  'poster-studio': {
    category: 'Design',
    surface: 'Canvas',
    workspace: 'Team handbook',
    updated: '12 分钟前',
    status: 'ready',
    source: 'self',
  },
  'product-shots': {
    category: 'Commerce',
    surface: 'Gallery',
    workspace: 'Sandbox',
    updated: '今天 09:12',
    status: 'ready',
    source: 'official',
  },
  'teaching-aids': {
    category: 'Education',
    surface: 'Print',
    workspace: 'Team handbook',
    updated: '昨天',
    status: 'draft',
    source: 'third-party',
  },
}

export const appEntries: AppEntry[] = apps.map((app) => ({
  ...app,
  ...details[app.id],
}))

export function readApp(id: string): AppEntry | undefined {
  return appEntries.find((app) => app.id === id)
}
