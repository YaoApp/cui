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
 * 解析文件地址并返回可直接使用的 URL
 * 支持多种格式：
 * - Wrapper 格式: {uploaderID}://{fileID} -> 转换为 Content API URL
 * - HTTP/HTTPS URL: 直接返回
 * - 空字符串或其他格式: 直接返回
 *
 * @param str - 文件地址字符串（可以是 wrapper、URL 或其他格式）
 * @returns 可直接使用的 URL 地址
 *
 * @example
 * ResolveFileURL('__yao.attachment://file123') // => '{baseURL}/file/__yao.attachment/file123/content'
 * ResolveFileURL('https://example.com/avatar.png') // => 'https://example.com/avatar.png'
 * ResolveFileURL('http://example.com/image.jpg') // => 'http://example.com/image.jpg'
 * ResolveFileURL('/static/default.png') // => '/static/default.png'
 */
export function ResolveFileURL(str: string): string {
	if (!str) return str

	// 如果是 HTTP/HTTPS URL，直接返回
	if (str.startsWith('http://') || str.startsWith('https://')) {
		return str
	}

	// 如果是 wrapper 格式，转换为 Content API URL
	if (IsFileWrapper(str)) {
		return WrapperToContentURL(str)
	}

	// 其他格式直接返回（如相对路径、data URL 等）
	return str
}
