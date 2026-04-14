import { useState, useEffect } from 'react'
import { Modal, message } from 'antd'
import { getLocale } from '@umijs/max'
import { ParseFileRef, ResolveFileURL } from '@/utils/fileWrapper'
import FileViewer from '@/components/view/FileViewer'
import { WorkspaceAPI } from '@/openapi/workspace/api'

export interface AttachmentPreviewItem {
	title: string
	file: string
	content_type?: string
}

interface Props {
	visible: boolean
	onClose: () => void
	attachment: AttachmentPreviewItem | null
}

const textExts = new Set([
	'txt', 'md', 'log', 'ini', 'cfg', 'csv', 'json', 'jsonc', 'yaml', 'yml', 'xml',
	'py', 'js', 'ts', 'jsx', 'tsx', 'java', 'cpp', 'go', 'sh', 'html', 'css',
	'yao', 'sql', 'php', 'rb', 'rs', 'c', 'h', 'mjs'
])

const AttachmentPreviewModal = ({ visible, onClose, attachment }: Props) => {
	const is_cn = getLocale() === 'zh-CN'
	const [loading, setLoading] = useState(false)
	const [content, setContent] = useState<string | undefined>()
	const [src, setSrc] = useState<string | undefined>()

	useEffect(() => {
		if (!visible || !attachment) {
			setContent(undefined)
			setSrc(undefined)
			return
		}

		const ref = ParseFileRef(attachment.file)

		if (ref.type === 'workspace' && ref.workspaceId && ref.filePath) {
			const ext = ref.filePath.split('.').pop()?.toLowerCase() || ''
			const resolvedUrl = ResolveFileURL(attachment.file)

			if (textExts.has(ext)) {
				setLoading(true)
				setSrc(resolvedUrl)
				const wsApi = new WorkspaceAPI(window.$app.openapi)
				wsApi.ReadFile(ref.workspaceId, ref.filePath)
					.then((resp) => {
						if (window.$app.openapi.IsError(resp)) throw new Error(resp.error?.error_description)
						const text = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2)
						setContent(text)
					})
					.catch(() => {
						message.error(is_cn ? '加载文件失败' : 'Failed to load file')
					})
					.finally(() => setLoading(false))
			} else {
				setSrc(resolvedUrl)
			}
		} else if (ref.type === 'wrapper') {
			// FileViewer handles wrapper files via fileID + uploader props — but we
			// also provide the resolved URL as src for maximum compatibility.
			setSrc(ResolveFileURL(attachment.file))
		} else {
			setSrc(ResolveFileURL(attachment.file))
		}
	}, [visible, attachment?.file])

	if (!attachment) return null

	const ref = ParseFileRef(attachment.file)

	return (
		<Modal
			open={visible}
			title={attachment.title}
			footer={null}
			width='80vw'
			styles={{ body: { height: '70vh', padding: 0, overflow: 'hidden' } }}
			onCancel={onClose}
			destroyOnClose
		>
			{loading ? (
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
					{is_cn ? '加载中...' : 'Loading...'}
				</div>
			) : (
				<FileViewer
					{...(ref.type === 'wrapper'
						? { fileID: ref.fileID, uploader: ref.uploaderID }
						: { src })}
					content={content}
					contentType={attachment.content_type}
					__name={attachment.title}
					__bind=''
					__value={attachment.title}
					style={{ height: '70vh' }}
					showMaximize
				/>
			)}
		</Modal>
	)
}

export default AttachmentPreviewModal
