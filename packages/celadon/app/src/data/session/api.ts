import { openWebSocket, serviceUrl, transport } from '@/platform/transport'
import type {
  ChatMessage,
  Computer,
  LlmModel,
  SessionMessage,
  SessionRecord,
  SessionBranch,
  Vault,
  VaultGrant,
  Workspace,
} from './types'

export class SessionApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'SessionApiError'
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await transport.fetchOk(serviceUrl(path), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new SessionApiError('The session service is unavailable.', undefined)
  }
  if (!response.value.ok) {
    let body: { message?: string } | undefined
    try {
      body = (await response.value.json()) as { message?: string }
    } catch {
      body = undefined
    }
    throw new SessionApiError(body?.message ?? 'The session service returned an error.', response.value.status)
  }
  return (await response.value.json()) as T
}

export async function listComputers(): Promise<Computer[]> {
  const body = await request<{ data: Computer[] }>('/v1/computers')
  return body.data
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const body = await request<{ data: Workspace[] }>('/v1/workspaces')
  return body.data
}

export async function listModels(): Promise<LlmModel[]> {
  const body = await request<{ data: LlmModel[] }>('/v1/llm/v2/models')
  return body.data
}

export async function listVaults(): Promise<Vault[]> {
  const body = await request<{ data: Vault[] }>('/v1/vaults')
  return body.data
}

export async function createSession(input: {
  title?: string
  computer_id: string
  workspace_id: string
  model: string
  effort?: string
  lifetime?: string
  approval?: string
  agent?: string
  vault_grants?: VaultGrant
}): Promise<SessionRecord> {
  const body = await request<{ session_id: string; session: SessionRecord }>('/v1/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return body.session
}

export async function getSession(id: string): Promise<SessionRecord> {
  const body = await request<{ session: SessionRecord }>(`/v1/sessions/${encodeURIComponent(id)}`)
  return body.session
}

export async function updateSession(
  id: string,
  patch: Pick<SessionRecord, 'model' | 'effort' | 'lifetime' | 'approval' | 'agent'>,
): Promise<SessionRecord> {
  const body = await request<{ session: SessionRecord }>(`/v1/sessions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return body.session
}

export async function updateVaultGrants(id: string, grants: VaultGrant): Promise<VaultGrant> {
  const body = await request<{ vault_grants: VaultGrant }>(`/v1/sessions/${encodeURIComponent(id)}/vault-grants`, {
    method: 'PUT',
    body: JSON.stringify(grants),
  })
  return body.vault_grants
}

export async function listBranches(sessionId: string): Promise<SessionBranch[]> {
  const body = await request<{ data: SessionBranch[] }>(
    `/v1/sessions/${encodeURIComponent(sessionId)}/branches`,
  )
  return body.data
}

export async function createBranch(
  sessionId: string,
  input: { title?: string; anchor_message_id?: string | number } = {},
): Promise<SessionBranch> {
  const body = await request<{ branch: SessionBranch }>(
    `/v1/sessions/${encodeURIComponent(sessionId)}/branches`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
  return body.branch
}

export async function getBranch(sessionId: string, branchId: string): Promise<SessionBranch> {
  const body = await request<{ branch: SessionBranch }>(
    `/v1/sessions/${encodeURIComponent(sessionId)}/branches/${encodeURIComponent(branchId)}`,
  )
  return body.branch
}

export function openControlSocket(id: string, branchId?: string): WebSocket {
  const base = branchId
    ? `/v1/sessions/${encodeURIComponent(id)}/branches/${encodeURIComponent(branchId)}`
    : `/v1/sessions/${encodeURIComponent(id)}`
  return openWebSocket(`${base}/ctrl`)
}

export function openDataSocket(id: string, turnId: string, branchId?: string): WebSocket {
  const base = branchId
    ? `/v1/sessions/${encodeURIComponent(id)}/branches/${encodeURIComponent(branchId)}`
    : `/v1/sessions/${encodeURIComponent(id)}`
  return openWebSocket(`${base}/data?turn_id=${encodeURIComponent(turnId)}`)
}

export function toChatMessage(message: SessionMessage): ChatMessage | null {
  const content = typeof message.props?.content === 'string' ? message.props.content : ''
  if (message.type === 'user_input') {
    return {
      id: message.message_id,
      role: 'user',
      content,
      kind: 'text',
      createdAt: message.metadata?.timestamp,
    }
  }
  if (message.type === 'text') {
    return {
      id: message.message_id,
      role: 'assistant',
      content,
      kind: 'text',
      createdAt: message.metadata?.timestamp,
    }
  }
  if (message.type === 'error') {
    return {
      id: message.message_id,
      role: 'assistant',
      content: content || 'The turn failed.',
      kind: 'error',
      createdAt: message.metadata?.timestamp,
    }
  }
  if (message.type === 'cancelled') {
    return {
      id: message.message_id,
      role: 'assistant',
      content: content || 'Generation stopped.',
      kind: 'cancelled',
      createdAt: message.metadata?.timestamp,
    }
  }
  return null
}
