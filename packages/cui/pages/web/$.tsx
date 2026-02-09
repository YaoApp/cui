import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { getLocale, useLocation } from '@umijs/max'
import { local } from '@yaoapp/storex'
import { App } from '@/types'
import { executeAction } from '@/chatbox/messages/Action/actions'

// Define message types
export interface IframeMessage {
	type: string
	message?: any
}

// Create a message sender function
export const sendMessageToIframe = (iframe: HTMLIFrameElement | null, message: IframeMessage) => {
	if (!iframe?.contentWindow) {
		console.warn('Iframe or contentWindow not found')
		return
	}

	// Ignore message if it's not from the same origin
	if (iframe.contentWindow.location.origin !== window.location.origin) {
		console.warn('Message from unauthorized origin:', iframe.contentWindow.location.origin)
		return
	}

	try {
		iframe.contentWindow.postMessage(message, window.location.origin)
	} catch (err) {
		console.error('Failed to send message to iframe:', err)
	}
}

const Index = () => {
	const { search, pathname } = useLocation()

	const [loading, setLoading] = useState(true)
	const ref = useRef<HTMLIFrameElement>(null)

	const getTheme = (): App.Theme => {
		const theme = (local.xgen_theme || 'light') as App.Theme
		return theme
	}

	const handlers: Record<string, () => string> = {
		__theme: getTheme,
		__locale: getLocale
	}

	const src = useMemo(() => {
		const url = pathname.replace(/^\/web/, '')
		const params = new URLSearchParams(search)
		params.forEach((value, key) => handlers[value] && params.set(key, handlers[value]()))
		return url + (params.size > 0 ? '?' + params.toString() : '')
	}, [search, pathname])

	useLayoutEffect(() => {
		document.body.style.overflow = 'hidden'
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [])

	// Add event listener to receive message from iframe
	useEffect(() => {
		// Receive message from iframe
		const handleMessage = (e: MessageEvent) => {
			// Only accept messages from same origin
			if (e.origin !== window.location.origin) {
				console.warn('Message from unauthorized origin:', e.origin)
				return
			}

			const data = e.data || {}

			// Handle action messages using unified Action system
			if (data.type === 'action') {
				const { name, payload } = data.message || data.payload || {}
				if (!name) {
					console.warn('[Web/Iframe] Missing action name in message:', data)
					return
				}

				try {
					executeAction(name, payload)
				} catch (err) {
					console.error('[Web/Iframe] Failed to execute action:', err)
					console.debug('Action data:', { name, payload })
				}
			} else {
				// Handle other message types
				console.debug('Received message from iframe:', data)
			}
		}

		// Send message to iframe, trigger by event
		const webSendMessage = (message: IframeMessage) => {
			if (!ref.current) {
				console.warn('Iframe not found')
				return
			}
			sendMessageToIframe(ref.current, message)
		}

		window.$app.Event.on('web/sendMessage', webSendMessage)
		window.addEventListener('message', handleMessage)
		return () => {
			window.removeEventListener('message', handleMessage)
			window.$app.Event.off('web/sendMessage', webSendMessage)
		}
	}, [])

	// Send initial setup message
	useEffect(() => {
		if (!loading && ref.current) {
			sendMessageToIframe(ref.current, {
				type: 'setup',
				message: {
					theme: getTheme(),
					locale: getLocale()
				}
			})

			// Try to get and update title from iframe (for same-origin iframes)
			try {
				const iframe = ref.current
				if (iframe.contentDocument?.title) {
					const title = iframe.contentDocument.title
					if (title) {
						// Emit event to update sidebar tab title
						window.$app?.Event?.emit('app/updateSidebarTabTitle', {
							url: pathname + search,
							title: title
						})
					}
				}
			} catch {
				// Cross-origin iframe, can't access title directly
				// Title will remain as domain name
			}
		}
	}, [loading, pathname, search])

	return (
		<div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
			<iframe
				className='w_100 h_100'
				ref={ref}
				src={src}
				onLoad={() => setLoading(false)}
				style={{
					backgroundColor: 'var(--color_bg)',
					border: 'none',
					display: loading ? 'none' : 'block'
				}}
			></iframe>
		</div>
	)
}

export default window.$app.memo(Index)
