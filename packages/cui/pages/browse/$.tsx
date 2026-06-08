import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from '@umijs/max'
import { executeAction } from '@/chatbox/messages/Action/actions'
import { setPendingCrossOriginDrag } from '@/chatbox/utils/mention'

const Browse = () => {
	const { search, pathname } = useLocation()
	const ref = useRef<HTMLIFrameElement>(null)
	const [loading, setLoading] = useState(true)

	const src = useMemo(() => {
		const params = new URLSearchParams(search)
		return params.get('src') || ''
	}, [search])

	useEffect(() => {
		const handleMessage = (e: MessageEvent) => {
			// Security: only accept messages from our iframe, skip origin check (cross-origin by design)
			// Trust model: user explicitly chose to open this URL — implicit trust
			// If browse ever loads untrusted URLs, add an action whitelist here
			if (!ref.current || e.source !== ref.current.contentWindow) return

			const { type, message, data } = e.data || {}
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
					}
					break
				}
				case 'mention:drag-end': {
					setPendingCrossOriginDrag(null)
					break
				}
			}
		}

		window.addEventListener('message', handleMessage)
		return () => window.removeEventListener('message', handleMessage)
	}, [pathname, search])

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
