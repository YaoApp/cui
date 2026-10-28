export type Computer = {
  id: string
  name: string
  platform: 'macos' | 'windows' | 'linux'
  status: 'online' | 'offline'
  scope: 'private' | 'team'
  owner_id?: string
  team_id?: string | null
}

export type Workspace = {
  id: string
  name: string
  computer_id: string
  scope: 'private' | 'team'
  role: 'owner' | 'editor' | 'viewer'
  path?: string
  status: 'ready' | 'offline'
}

export type VaultSecret = {
  id: string
  name: string
  kind: string
  scope: string
  status: string
  last_used_at?: string | null
}

export type VaultGroup = {
  id: string
  name: string
  permission: string
  secret_count: number
  secrets: VaultSecret[]
}

export type Vault = {
  id: string
  name: string
  kind: 'personal' | 'team'
  team_id?: string | null
  groups: VaultGroup[]
  secrets: VaultSecret[]
}

export type VaultGrant = {
  group_ids: string[]
  secret_ids: string[]
}

export type LlmModel = {
  id: number
  provider_ref: number
  model_id: string
  name: string
  type: string
  family: string
  enabled: boolean
  context_window: number
  max_output_tokens: number
  supports_images: boolean
  supports_tool_use: boolean
  reasoning: boolean
  streaming: boolean
  input: string[]
  max_thinking: string
  provider_name: string
  provider_key: string
}

export type SessionMessage = {
  id: number
  message_id: string
  type: 'user_input' | 'text' | 'loading' | 'error' | 'cancelled' | 'tool'
  props: {
    role?: string
    content?: string
    [key: string]: unknown
  }
  metadata?: {
    timestamp?: number
    turn_id?: string
    [key: string]: unknown
  }
}

export type SessionRecord = {
  id: string
  title: string
  computer_id: string
  workspace_id: string
  model: string
  effort?: string
  lifetime?: string
  approval?: string
  agent?: string
  status: string
  vault_grants: VaultGrant
  messages: SessionMessage[]
  created_at: string
  updated_at: string
}

export type SessionBranch = SessionRecord & {
  session_id: string
  anchor_message_id: number | null
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  kind?: 'text' | 'error' | 'cancelled'
  createdAt?: number
}
