export type AppStatus = 'ready' | 'draft'
export type AppSource = 'self' | 'official' | 'third-party'

export type AppRecord = {
  id: string
  icon: string
  category: string
  surface: string
  status: AppStatus
  source: AppSource
  updated_at: string
}

export type BotRecord = {
  id: string
  icon: string
  status: string
  avatar?: string
}
