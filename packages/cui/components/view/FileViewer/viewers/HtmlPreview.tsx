import { useMemo } from 'react'
import { getLocale } from '@umijs/max'

interface HtmlPreviewProps {
	workspaceId: string
	filePath: string
	style?: React.CSSProperties
}

const HtmlPreview = ({ workspaceId, filePath, style }: HtmlPreviewProps) => {
	const is_cn = getLocale() === 'zh-CN'

	const previewUrl = useMemo(() => {
		if (!workspaceId || !filePath) return ''
		const base = window.$app?.openapi?.getBaseURL?.() || '/api/v1'
		const path = filePath.startsWith('/') ? filePath.slice(1) : filePath
		return `${base}/workspace/${encodeURIComponent(workspaceId)}/preview/${path}`
	}, [workspaceId, filePath])

	if (!previewUrl) {
		return (
			<div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
				{is_cn ? '无法预览' : 'Cannot preview'}
			</div>
		)
	}

	return (
		<iframe
			src={previewUrl}
			style={{
				width: '100%',
				height: '100%',
				border: 'none',
				backgroundColor: '#fff',
				...style
			}}
			sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
			title="HTML Preview"
		/>
	)
}

export default HtmlPreview
