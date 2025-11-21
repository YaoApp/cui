import { useState, useEffect } from 'react'
import { useParams } from '@umijs/max'
import DefaultView from './views/DefaultView/index'
import DeveloperView from './views/DeveloperView'
import { ViewMode } from './types'
import styles from './index.less'

const Trace = () => {
	const params = useParams()
	// Support both named parameter :id and catch-all parameter * (for $.tsx)
	const traceId = params.id || params['*']

	const [viewMode, setViewMode] = useState<ViewMode>('default')

	const handleSwitchMode = () => {
		setViewMode((prev) => (prev === 'default' ? 'developer' : 'default'))
	}

	// 给父级 content_wrapper 添加特殊类名，去掉 padding
	useEffect(() => {
		const contentWrapper = document.querySelector('.content_wrapper')
		if (contentWrapper) {
			contentWrapper.classList.add('content_wrapper_trace')
		}

		return () => {
			const contentWrapper = document.querySelector('.content_wrapper')
			if (contentWrapper) {
				contentWrapper.classList.remove('content_wrapper_trace')
			}
		}
	}, [])

	return (
		<div className={styles.tracePage}>
			{viewMode === 'default' ? (
				<DefaultView traceId={traceId} onSwitchMode={handleSwitchMode} />
			) : (
				<DeveloperView traceId={traceId || ''} onSwitchMode={handleSwitchMode} />
			)}
		</div>
	)
}

export default Trace
