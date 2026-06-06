import { useMemo, useRef, useState } from 'react'
import { useLocation } from '@umijs/max'

const Browse = () => {
	const { search } = useLocation()
	const ref = useRef<HTMLIFrameElement>(null)
	const [loading, setLoading] = useState(true)

	const src = useMemo(() => {
		const params = new URLSearchParams(search)
		return params.get('src') || ''
	}, [search])

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
