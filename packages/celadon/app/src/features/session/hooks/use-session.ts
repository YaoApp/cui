import { useCallback, useEffect, useRef, useState } from 'react'
import {
  openControlSocket,
  openDataSocket,
  toChatMessage,
  updateSession,
  type ChatMessage,
  type SessionMessage,
  type SessionRecord,
} from '@/data/session'

type ControlEnvelope = {
  seq: number
  event: string
  data?: Record<string, unknown>
}

type DataEnvelope = {
  seq: number
  event: string
  data?: Record<string, unknown>
}

export type SessionState = 'loading' | 'ready' | 'thinking' | 'streaming' | 'error'

function dataMessageId(turnId: string): string {
  return `stream-${turnId}`
}

export function useSession(sessionId: string, branchId?: string) {
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [state, setState] = useState<SessionState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const ctrlRef = useRef<WebSocket | null>(null)
  const dataRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<string | null>(null)
  const mountedRef = useRef(true)
  const retryRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readyRef = useRef(false)
  const pendingReadRef = useRef(false)
  const loadingMoreRef = useRef(false)
  const oldestRef = useRef<number | null>(null)

  const syncHistory = useCallback(() => {
    const ctrl = ctrlRef.current
    if (!ctrl || ctrl.readyState !== WebSocket.OPEN) {
      pendingReadRef.current = true
      return
    }
    ctrl.send(JSON.stringify({ type: 'read', limit: 50 }))
  }, [])

  const openTurn = useCallback(
    (turnId: string) => {
      if (dataRef.current) {
        dataRef.current.close(1000, 'replaced')
        dataRef.current = null
      }
      streamRef.current = turnId
      const socket = openDataSocket(sessionId, turnId, branchId)
      dataRef.current = socket
      let assistantText = ''

      socket.onmessage = (event) => {
        let message: DataEnvelope
        try {
          message = JSON.parse(event.data) as DataEnvelope
        } catch {
          return
        }
        const data = message.data ?? {}
        if (message.event === 'text_delta') {
          const delta = typeof data.content === 'string' ? data.content : ''
          assistantText += delta
          const id = dataMessageId(turnId)
          setMessages((current) => {
            const index = current.findIndex((item) => item.id === id)
            if (index < 0) {
              return [...current, { id, role: 'assistant', content: delta, kind: 'text' }]
            }
            const next = [...current]
            next[index] = { ...next[index], content: assistantText }
            return next
          })
          setState('streaming')
        }
        if (message.event === 'session.error') {
          setError(typeof data.message === 'string' ? data.message : 'The turn failed.')
          setState('error')
        }
        if (message.event === 'turn_end') {
          socket.close(1000, 'turn ended')
          if (dataRef.current === socket) dataRef.current = null
          streamRef.current = null
          setState((current) => (current === 'error' ? 'error' : 'ready'))
          setTimeout(() => {
            if (mountedRef.current) syncHistory()
          }, 80)
        }
      }
      socket.onerror = () => {
        if (!mountedRef.current) return
        setError('The response stream was interrupted.')
        setState('error')
      }
      socket.onclose = () => {
        if (dataRef.current === socket) dataRef.current = null
      }
    },
    [branchId, sessionId, syncHistory],
  )

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    const previous = ctrlRef.current
    ctrlRef.current = null
    previous?.close()
    const socket = openControlSocket(sessionId, branchId)
    ctrlRef.current = socket

    socket.onopen = () => {
      if (!mountedRef.current) return
      if (ctrlRef.current !== socket) {
        socket.close(1000, 'stale connection')
        return
      }
      retryRef.current = 0
      setConnected(true)
      setError(null)
      socket.send(JSON.stringify({ type: 'read', limit: 50 }))
    }

    socket.onmessage = (event) => {
      let message: ControlEnvelope
      try {
        message = JSON.parse(event.data) as ControlEnvelope
      } catch {
        return
      }
      const data = message.data ?? {}
      if (message.event === 'session.ready') {
        readyRef.current = true
        const nextSession = data.session as SessionRecord | undefined
        if (nextSession) setSession(nextSession)
        if (pendingReadRef.current) {
          pendingReadRef.current = false
          syncHistory()
        }
        return
      }
      if (message.event === 'read_complete') {
        const raw = Array.isArray(data.messages) ? (data.messages as SessionMessage[]) : []
        const mapped = raw.map(toChatMessage).filter((item): item is ChatMessage => item !== null)
        const merging = loadingMoreRef.current
        loadingMoreRef.current = false
        setLoadingMore(false)
        setHasMore(Boolean(data.has_more))
        const firstId = Number(data.first_id)
        if (Number.isFinite(firstId) && firstId > 0) oldestRef.current = firstId
        setMessages((current) => {
          if (!merging) return mapped
          const known = new Set(current.map((item) => item.id))
          return [...mapped.filter((item) => !known.has(item.id)), ...current]
        })
        setState((current) => (current === 'thinking' ? 'ready' : current === 'loading' ? 'ready' : current))
        return
      }
      if (message.event === 'action.accepted') {
        const turnId = data.turn_id
        if (typeof turnId === 'string') openTurn(turnId)
        setState('thinking')
        return
      }
      if (message.event === 'action.rejected') {
        setError(typeof data.message === 'string' ? data.message : 'The message was rejected.')
        setState('error')
        return
      }
      if (message.event === 'live_status') {
        if (data.status === 'idle') {
          setState((current) => (current === 'streaming' ? current : 'ready'))
        }
        return
      }
    }

    socket.onclose = (event) => {
      if (ctrlRef.current !== socket) return
      ctrlRef.current = null
      if (!mountedRef.current || event.code === 1000) return
      setConnected(false)
      if (retryRef.current >= 5) {
        setError('The session connection was lost.')
        setState('error')
        return
      }
      const delay = Math.min(4000, 400 * 2 ** retryRef.current)
      retryRef.current += 1
      reconnectTimerRef.current = setTimeout(connect, delay)
    }
    socket.onerror = () => {
      /* onclose owns reconnection; this avoids an unhandled browser error. */
    }
  }, [branchId, openTurn, sessionId, syncHistory])

  useEffect(() => {
    mountedRef.current = true
    readyRef.current = false
    setState('loading')
    setError(null)
    connect()
    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      const socket = ctrlRef.current
      ctrlRef.current = null
      socket?.close(1000, 'session left')
      dataRef.current?.close(1000, 'session left')
      dataRef.current = null
    }
  }, [connect])

  const send = useCallback(
    (text: string) => {
      const content = text.trim()
      if (!content) return false
      const ctrl = ctrlRef.current
      if (!ctrl || ctrl.readyState !== WebSocket.OPEN) {
        setError('The session is still connecting.')
        return false
      }
      const id = `local-${Date.now()}`
      setMessages((current) => [...current, { id, role: 'user', content, kind: 'text' }])
      setError(null)
      setState('thinking')
      ctrl.send(
        JSON.stringify({
          type: 'run',
          messages: [{ role: 'user', content }],
          locale: document.documentElement.lang || 'en-US',
        }),
      )
      return true
    },
    [],
  )

  const stop = useCallback(() => {
    if (ctrlRef.current?.readyState === WebSocket.OPEN) {
      ctrlRef.current.send(JSON.stringify({ type: 'stop' }))
    }
    dataRef.current?.close(1000, 'stopped')
    dataRef.current = null
    setState('ready')
    setTimeout(() => {
      if (mountedRef.current) syncHistory()
    }, 80)
  }, [syncHistory])

  const reload = useCallback(() => {
    setState('loading')
    setError(null)
    syncHistory()
  }, [syncHistory])

  const loadMore = useCallback(() => {
    const ctrl = ctrlRef.current
    if (!ctrl || ctrl.readyState !== WebSocket.OPEN || !hasMore || loadingMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    ctrl.send(
      JSON.stringify({
        type: 'read',
        before: oldestRef.current ?? undefined,
        limit: 50,
      }),
    )
  }, [hasMore])

  useEffect(() => {
    if (state === 'loading' && messages.length > 0) setState('ready')
  }, [messages.length, state])

  const update = useCallback(
    async (patch: Pick<SessionRecord, 'model' | 'effort' | 'lifetime' | 'approval' | 'agent'>) => {
      if (!sessionId) return null
      const next = await updateSession(sessionId, patch)
      if (mountedRef.current) setSession(next)
      return next
    },
    [sessionId],
  )

  return {
    session,
    messages,
    state,
    error,
    connected,
    send,
    stop,
    reload,
    update,
    hasMore,
    loadingMore,
    loadMore,
    isStreaming: state === 'thinking' || state === 'streaming',
    isReady: connected && state !== 'loading',
  }
}
