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
	const titleSetByIframe = useRef(false)

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
			} else if (data.type === 'title' || data.type === 'updateTab') {
				// Only handle messages from our own iframe
				if (!ref.current || e.source !== ref.current.contentWindow) return

				if (data.type === 'title') {
					// Update this tab's title
					const title = data.message?.title || data.title
					if (title) {
						titleSetByIframe.current = true
						window.$app?.Event?.emit('app/updateSidebarTabTitle', {
							url: pathname + search,
							title: title
						})
					}
				} else {
					// updateTab: Update current active tab's URL and title (for in-iframe navigation)
					const { url, title } = data.message || {}
					if (url) {
						titleSetByIframe.current = true
						window.$app?.Event?.emit('app/updateActiveTab', {
							url,
							title: title || url
						})
					}
				}
			} else {
				// Handle other message types
				console.info('Received message from iframe:', data)
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

	// Reset title flag when navigating to a new page (pathname/search change)
	useEffect(() => {
		titleSetByIframe.current = false
	}, [pathname, search])

	// Send initial setup message when iframe finishes loading
	useEffect(() => {
		if (!loading && ref.current) {
			sendMessageToIframe(ref.current, {
				type: 'setup',
				message: {
					theme: getTheme(),
					locale: getLocale()
				}
			})

			// Fallback: use <title> from iframe document only if the iframe
			// has not already set the title via postMessage (title/updateTab).
			// This avoids overwriting an i18n-aware title with a static <title> value.
			if (!titleSetByIframe.current) {
				try {
					const iframe = ref.current
					if (iframe.contentDocument?.title) {
						const title = iframe.contentDocument.title
						if (title) {
							window.$app?.Event?.emit('app/updateSidebarTabTitle', {
								url: pathname + search,
								title: title
							})
						}
					}
				} catch {
					// Cross-origin iframe, can't access title directly
				}
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
