import { useState, useCallback } from 'react'
import { message } from 'antd'
import { getLocale } from '@umijs/max'
import { ResolveFileURL } from '@/utils/fileWrapper'
import { getApiBase } from '@/services/wellknown'

export interface DownloadableFile {
	file: string
	filename: string
}

interface DownloadState {
	downloading: boolean
	progress: { current: number; total: number } | null
}

async function fetchAndSave(url: string, filename: string): Promise<void> {
	const resp = await fetch(url, { credentials: 'include' })
	if (!resp.ok) throw new Error(`${resp.status}`)
	const blob = await resp.blob()
	const blobUrl = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = blobUrl
	a.download = filename
	a.style.display = 'none'
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
}

export function useFileDownload() {
	const [state, setState] = useState<DownloadState>({ downloading: false, progress: null })

	const is_cn = getLocale() === 'zh-CN'

	const download = useCallback(
		async (file: string, filename: string) => {
			const url = ResolveFileURL(file)
			if (!url) return
			setState({ downloading: true, progress: null })
			try {
				await fetchAndSave(url, filename)
			} catch {
				message.error(is_cn ? '下载失败' : 'Download failed')
			} finally {
				setState({ downloading: false, progress: null })
			}
		},
		[is_cn]
	)

	const downloadAsZip = useCallback(
		async (files: DownloadableFile[], archiveName = 'attachments.zip') => {
			setState({ downloading: true, progress: null })
			try {
				const base = getApiBase()
				const resp = await fetch(`${base}/file/bundle`, {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ files, archive_name: archiveName })
				})
				if (!resp.ok) throw new Error(`${resp.status}`)
				const blob = await resp.blob()
				const blobUrl = URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = blobUrl
				a.download = archiveName
				a.style.display = 'none'
				document.body.appendChild(a)
				a.click()
				document.body.removeChild(a)
				setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
			} catch {
				message.error(is_cn ? '打包下载失败' : 'Bundle download failed')
			} finally {
				setState({ downloading: false, progress: null })
			}
		},
		[is_cn]
	)

	const downloadAll = useCallback(
		async (files: DownloadableFile[], archiveName?: string) => {
			if (!files.length) return
			if (files.length === 1) {
				await download(files[0].file, files[0].filename)
			} else {
				await downloadAsZip(files, archiveName)
			}
		},
		[download, downloadAsZip]
	)

	return { ...state, download, downloadAll, downloadAsZip }
}
