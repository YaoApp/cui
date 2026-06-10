import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from '@umijs/max'
import { executeAction } from '@/chatbox/messages/Action/actions'
import { type MentionData, setPendingCrossOriginDrag } from '@/chatbox/utils/mention'

const Browse = () => {
	const { search, pathname } = useLocation()
	const ref = useRef<HTMLIFrameElement>(null)
	const [loading, setLoading] = useState(true)
	const pendingMentionRef = useRef<MentionData | null>(null)
	const ghostRef = useRef<HTMLDivElement | null>(null)
	const rafRef = useRef<number>(0)
	const cleanupRef = useRef<(() => void) | null>(null)
	const resetStaleRef = useRef<(() => void) | null>(null)

	const src = useMemo(() => {
		const params = new URLSearchParams(search)
		return params.get('src') || ''
	}, [search])

	const removeGhost = () => {
		cancelAnimationFrame(rafRef.current)
		if (ghostRef.current) {
			ghostRef.current.remove()
			ghostRef.current = null
		}
	}

	const finalizeDrag = (pageX: number, pageY: number) => {
		removeGhost()
		stopParentTracking()
		window.$app?.Event?.emit('chatbox/dragIndicator', false)

		if (pendingMentionRef.current) {
			const target = document.elementFromPoint(pageX, pageY)
			if (target?.closest('[data-mention-drop-zone]')) {
				window.$app?.Event?.emit('chatbox/insertMention', pendingMentionRef.current)
			}
		}
		pendingMentionRef.current = null
		setPendingCrossOriginDrag(null)
	}

	const cancelDrag = () => {
		removeGhost()
		stopParentTracking()
		window.$app?.Event?.emit('chatbox/dragIndicator', false)
		pendingMentionRef.current = null
		setPendingCrossOriginDrag(null)
	}

	const moveGhostToPage = (pageX: number, pageY: number) => {
		cancelAnimationFrame(rafRef.current)
		rafRef.current = requestAnimationFrame(() => {
			if (!ghostRef.current) return
			ghostRef.current.style.left = (pageX + 12) + 'px'
			ghostRef.current.style.top = pageY + 'px'
		})
	}

	const iframeToPage = (iframeX: number, iframeY: number) => {
		if (!ref.current) return { pageX: 0, pageY: 0 }
		const rect = ref.current.getBoundingClientRect()
		return { pageX: rect.left + iframeX, pageY: rect.top + iframeY }
	}

	const createGhost = (html: string, pageX: number, pageY: number) => {
		removeGhost()
		const container = document.createElement('div')
		container.id = '__browse_drag_ghost'
		Object.assign(container.style, {
			position: 'fixed',
			zIndex: '999999',
			pointerEvents: 'none',
			opacity: '0',
			transition: 'opacity 0.08s'
		})
		container.innerHTML = html
		document.body.appendChild(container)
		ghostRef.current = container
		moveGhostToPage(pageX, pageY)
		requestAnimationFrame(() => {
			if (container) container.style.opacity = '0.92'
		})
	}

	// Parent-level tracking: covers the case when pointer leaves iframe
	const startParentTracking = () => {
		stopParentTracking()
		let staleTimer: ReturnType<typeof setTimeout>
		const resetStaleTimer = () => {
			clearTimeout(staleTimer)
			staleTimer = setTimeout(() => cancelDrag(), 3000)
		}
		resetStaleRef.current = resetStaleTimer
		resetStaleTimer()

		const onMove = (e: PointerEvent) => {
			resetStaleTimer()
			moveGhostToPage(e.clientX, e.clientY)
		}
		const onUp = (e: PointerEvent) => {
			finalizeDrag(e.clientX, e.clientY)
		}
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') cancelDrag()
		}
		const onBlur = () => cancelDrag()
		const onPointerLeave = (e: PointerEvent) => {
			if (e.relatedTarget === null) cancelDrag()
		}

		document.addEventListener('pointermove', onMove)
		document.addEventListener('pointerup', onUp)
		document.addEventListener('keydown', onKeyDown)
		document.documentElement.addEventListener('pointerleave', onPointerLeave)
		window.addEventListener('blur', onBlur)

		cleanupRef.current = () => {
			clearTimeout(staleTimer)
			document.removeEventListener('pointermove', onMove)
			document.removeEventListener('pointerup', onUp)
			document.removeEventListener('keydown', onKeyDown)
			document.documentElement.removeEventListener('pointerleave', onPointerLeave)
			window.removeEventListener('blur', onBlur)
		}
	}

	const stopParentTracking = () => {
		resetStaleRef.current = null
		if (cleanupRef.current) {
			cleanupRef.current()
			cleanupRef.current = null
		}
	}

	const triggerDownload = (blob: Blob, filename: string) => {
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = filename
		a.style.display = 'none'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		setTimeout(() => URL.revokeObjectURL(url), 1000)
	}

	useEffect(() => {
		const handleMessage = (e: MessageEvent) => {
			if (!ref.current || e.source !== ref.current.contentWindow) return

			const { type, message, data, ghost, x, y } = e.data || {}
			if (!type) return

			switch (type) {
				case 'action': {
					const { name, payload } = message || {}
					if (name) executeAction(name, payload)
					break
				}
				case 'title': {
					const title = message?.title || e.data?.title
					if (title) {
						window.$app?.Event?.emit('app/updateSidebarTabTitle', {
							url: pathname + search,
							title
						})
					}
					break
				}
				case 'updateTab': {
					const { url, title } = message || {}
					if (url) {
						window.$app?.Event?.emit('app/updateActiveTab', {
							url,
							title: title || url
						})
					}
					break
				}
				case 'mention:drag-start': {
					const VALID_MENTION_TYPES = ['expert', 'workspace', 'file', 'directory', 'clip']
					if (data?.id && data?.label && VALID_MENTION_TYPES.includes(data?.type)) {
						setPendingCrossOriginDrag(data)
						pendingMentionRef.current = data
						const pos = iframeToPage(x ?? 0, y ?? 0)
						if (ghost && typeof ghost === 'string') {
							createGhost(ghost, pos.pageX, pos.pageY)
						}
						startParentTracking()
						window.$app?.Event?.emit('chatbox/dragIndicator', true)
					}
					break
				}
			case 'mention:pointer-move': {
				if (typeof x === 'number' && typeof y === 'number') {
					resetStaleRef.current?.()
					const pos = iframeToPage(x, y)
					moveGhostToPage(pos.pageX, pos.pageY)
				}
				break
			}
			case 'mention:drag-end': {
				if (typeof x === 'number' && typeof y === 'number') {
					const pos = iframeToPage(x, y)
					finalizeDrag(pos.pageX, pos.pageY)
				} else {
					cancelDrag()
				}
				break
			}
			case 'content:insert': {
				const VALID_TYPES = ['expert', 'workspace', 'file', 'directory', 'clip']
				if (Array.isArray(data)) {
					const valid = data.every((seg: any) =>
						'text' in seg || (seg.id && seg.label && VALID_TYPES.includes(seg.type))
					)
					if (valid && data.length > 0) {
						window.$app?.Event?.emit('chatbox/insertContent', data)
					}
				} else if (data?.id && data?.label && VALID_TYPES.includes(data?.type)) {
					window.$app?.Event?.emit('chatbox/insertContent', data)
				}
				break
			}
			case 'file:download': {
				if (!data) break
				const { url, content, filename, mimeType } = data
				if (url) {
					fetch(url, { credentials: 'include' })
						.then(resp => {
							if (!resp.ok) throw new Error(`${resp.status}`)
							return resp.blob()
						})
						.then(blob => {
							const name = filename || url.split('/').pop()?.split('?')[0] || 'download'
							triggerDownload(blob, name)
						})
						.catch((err: any) => {
							console.warn('[browse] file:download fetch failed:', err)
						})
				} else if (content && filename) {
					try {
						const binary = atob(content)
						const bytes = new Uint8Array(binary.length)
						for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
						const blob = new Blob([bytes], { type: mimeType || 'application/octet-stream' })
						triggerDownload(blob, filename)
					} catch (err) {
						console.warn('[browse] file:download decode failed:', err)
					}
				}
				break
			}
		}
		}

		window.addEventListener('message', handleMessage)
		return () => {
			window.removeEventListener('message', handleMessage)
			stopParentTracking()
			removeGhost()
		}
	}, [pathname, search])

	// Reload iframe when tab refresh is triggered
	useEffect(() => {
		const handleRefreshTab = () => {
			if (ref.current) {
				const currentSrc = ref.current.src
				ref.current.src = ''
				ref.current.src = currentSrc
				setLoading(true)
			}
		}
		window.$app?.Event?.on('app/refreshTab', handleRefreshTab)
		return () => {
			window.$app?.Event?.off('app/refreshTab', handleRefreshTab)
		}
	}, [])

	if (!src) {
		return null
	}

	return (
		<div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
			<iframe
				ref={ref}
				src={src}
				sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
				onLoad={() => setLoading(false)}
				style={{
					width: '100%',
					height: '100%',
					border: 'none',
					backgroundColor: 'var(--color_bg)',
					display: loading ? 'none' : 'block'
				}}
			/>
		</div>
	)
}

export default window.$app.memo(Browse)
