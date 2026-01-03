import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { getLocale, useLocation } from '@umijs/max'
import { local, session } from '@yaoapp/storex'
import { App } from '@/types'
import { useAction } from '@/actions'

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

	// Ignore message if it's not from the same origin`
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

	const onAction = useAction()

	const getToken = (): string => {
		const is_session_token = local.token_storage === 'sessionStorage'
		const token = is_session_token ? session.token : local.token
		return token || ''
	}

	const getTheme = (): App.Theme => {
		const theme = (local.xgen_theme || 'light') as App.Theme
		return theme
	}

	const handlers: Record<string, () => string> = {
		__token: getToken,
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
			const data = e.data || {}

			// Handle different message types
			if (data.type === 'action') {
				// action: Array<Action.ActionParams>,
				const { extra, data_item = {}, action, primary = 'id' } = data.message || data.payload || {}
				try {
					onAction({
						namespace: pathname,
						primary,
						data_item,
						it: { action, title: '', icon: '' },
						extra
					})
				} catch (err) {
					console.error('Failed to run action:', err)
					console.debug('--- Receive message from iframe ---')
					console.debug(data)
					console.debug('---')
					console.debug({
						namespace: pathname,
						primary,
						data_item,
						it: { action, title: '', icon: '' },
						extra
					})
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
					locale: getLocale(),
					token: getToken()
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
		<iframe
			className='w_100 h_100vh'
			ref={ref}
			src={src}
			onLoad={() => setLoading(false)}
			style={{ backgroundColor: 'var(--color_bg)', border: 'none', display: loading ? 'none' : 'block' }}
		></iframe>
	)
}

export default window.$app.memo(Index)
