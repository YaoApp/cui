/**
 * 文件包装器工具函数
 * 用于处理文件存储格式和 API 地址之间的转换
 */

/**
 * 检查字符串是否为文件包装器格式
 * 格式: {uploaderID}://{fileID}
 * 例如: __yao.attachment://file123
 */
export function IsFileWrapper(str: string): boolean {
	if (!str || typeof str !== 'string') return false
	return /^[^:]+:\/\/.+/.test(str)
}

/**
 * 创建文件包装器
 * @param uploaderID - 上传器 ID
 * @param fileID - 文件 ID
 * @returns 包装器字符串，格式: {uploaderID}://{fileID}
 */
export function CreateFileWrapper(uploaderID: string, fileID: string): string {
	return `${uploaderID}://${fileID}`
}

/**
 * 解析文件包装器
 * @param wrapper - 包装器字符串
 * @returns { uploaderID, fileID } 或 null（如果格式不正确）
 */
export function ParseFileWrapper(wrapper: string): { uploaderID: string; fileID: string } | null {
	if (!IsFileWrapper(wrapper)) return null

	const match = wrapper.match(/^([^:]+):\/\/(.+)$/)
	if (!match) return null

	return {
		uploaderID: match[1],
		fileID: match[2]
	}
}

import { getApiBase } from '@/services/wellknown'

/**
 * 获取 API 基础 URL
 * @returns API 基础 URL，优先从 well-known 配置读取
 */
function getBaseURL(): string {
	return getApiBase()
}

/**
 * 将文件包装器转换为 Content API 地址
 * @param wrapper - 包装器字符串
 * @returns Content API URL 或原始字符串（如果不是包装器格式）
 */
export function WrapperToContentURL(wrapper: string): string {
	if (!wrapper) return wrapper

	// 如果不是包装器格式，直接返回（可能已经是完整 URL）
	if (!IsFileWrapper(wrapper)) return wrapper

	const parsed = ParseFileWrapper(wrapper)
	if (!parsed) return wrapper

	const { uploaderID, fileID } = parsed
	const baseURL = getBaseURL()
	return `${baseURL}/file/${uploaderID}/${fileID}/content`
}

/**
 * 从 Content API 地址提取文件包装器信息
 * @param url - Content API URL
 * @returns { uploaderID, fileID } 或 null
 */
export function ContentURLToWrapper(url: string): string | null {
	if (!url || typeof url !== 'string') return null

	// 匹配 /api/v1/file/{uploaderID}/{fileID}/content
	const match = url.match(/\/file\/([^/]+)\/([^/]+)\/content/)
	if (!match) return null

	return CreateFileWrapper(match[1], match[2])
}

/**
 * 通过 fetch + blob 方式下载文件，自动携带认证信息。
 * 支持 wrapper 格式（__yao.attachment://fileID）和普通 URL。
 * 多附件批量下载时可传 index，每隔 300ms 触发一次以避免浏览器拦截。
 *
 * @param file - wrapper 字符串或完整 URL
 * @param filename - 下载时使用的文件名
 * @param index - 批量下载时的序号（用于错开触发时机）
 */
export function triggerFileDownload(file: string, filename: string, index = 0): void {
	const url = WrapperToContentURL(file)
	if (!url) return

	setTimeout(async () => {
		try {
			const response = await fetch(url, {
				method: 'GET',
				credentials: 'include'
			})
			if (!response.ok) {
				console.error(`Download failed: ${response.status} ${response.statusText}`)
				return
			}
			const blob = await response.blob()
			const blobUrl = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = blobUrl
			a.download = filename || 'attachment'
			a.style.display = 'none'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
		} catch (err) {
			console.error('Download failed:', err)
		}
	}, index * 300)
}

// ========== Unified File Reference Protocol ==========

export type FileRefType = 'wrapper' | 'workspace' | 'url' | 'unknown'

export interface FileRef {
	type: FileRefType
	raw: string
	uploaderID?: string
	fileID?: string
	workspaceId?: string
	filePath?: string
}

/**
 * 统一解析文件引用字符串，识别三种格式：
 * - workspace://{wsId}/{filePath}   → Workspace 文件
 * - http(s)://...                   → 外部 URL
 * - {uploaderID}://{fileID}         → File Wrapper
 *
 * 顺序很重要：workspace:// 和 http(s):// 必须先匹配，
 * 因为 IsFileWrapper 的正则也能匹配这两种格式。
 */
export function ParseFileRef(str: string): FileRef {
	if (!str || typeof str !== 'string') return { type: 'unknown', raw: str || '' }

	if (str.startsWith('workspace://')) {
		const rest = str.slice('workspace://'.length)
		const slashIdx = rest.indexOf('/')
		if (slashIdx === -1) {
			return { type: 'workspace', raw: str, workspaceId: rest, filePath: '' }
		}
		return {
			type: 'workspace',
			raw: str,
			workspaceId: rest.slice(0, slashIdx),
			filePath: rest.slice(slashIdx + 1)
		}
	}

	if (str.startsWith('http://') || str.startsWith('https://')) {
		return { type: 'url', raw: str }
	}

	if (IsFileWrapper(str)) {
		const parsed = ParseFileWrapper(str)
		if (parsed) {
			return { type: 'wrapper', raw: str, ...parsed }
		}
	}

	return { type: 'unknown', raw: str }
}

/**
 * 解析文件地址并返回可直接使用的 URL。
 * 支持三种格式：
 * - workspace://{wsId}/{filePath}   → {apiBase}/workspace/{wsId}/files/{filePath}
 * - {uploaderID}://{fileID}         → {apiBase}/file/{uploaderID}/{fileID}/content
 * - http(s)://...                   → 原样返回
 *
 * @example
 * ResolveFileURL('__yao.attachment://file123')        // => '{baseURL}/file/__yao.attachment/file123/content'
 * ResolveFileURL('workspace://ws01/reports/Q3.pdf')   // => '{baseURL}/workspace/ws01/files/reports/Q3.pdf'
 * ResolveFileURL('https://example.com/avatar.png')    // => 'https://example.com/avatar.png'
 */
export function ResolveFileURL(str: string): string {
	if (!str) return str

	const ref = ParseFileRef(str)
	switch (ref.type) {
		case 'workspace':
			return `${getBaseURL()}/workspace/${ref.workspaceId}/files/${ref.filePath}`
		case 'wrapper':
			return WrapperToContentURL(str)
		case 'url':
			return str
		default:
			return str
	}
}
