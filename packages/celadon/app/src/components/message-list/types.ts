export type MessageKind = 'text' | 'error' | 'cancelled'

export type MessageItem = {
  id: string
  role: 'user' | 'assistant'
  content: string
  kind?: MessageKind
  createdAt?: number
}
