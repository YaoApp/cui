import { getToken } from '@/knife'
import { message as message_ } from 'antd'
import { RcFile } from 'antd/es/upload'
import { App } from '@/types'

// Keep CODE_FILE_TYPES for handling specific code file extensions
export const CODE_FILE_TYPES: Record<string, string> = {
	'.js': 'text/javascript',
	'.ts': 'text/typescript',
	'.go': 'text/x-go',
	'.py': 'text/x-python',
	'.java': 'text/x-java',
	'.c': 'text/x-c',
	'.cpp': 'text/x-c++',
	'.rb': 'text/x-ruby',
	'.php': 'text/x-php',
	'.swift': 'text/x-swift',
	'.rs': 'text/x-rust',
	'.jsx': 'text/javascript',
	'.tsx': 'text/typescript',
	'.vue': 'text/x-vue',
	'.sh': 'text/x-sh',
	'.yao': 'text/x-yao',
	'.mdx': 'text/markdown',
	'.yml': 'text/x-yaml',
	'.yaml': 'text/x-yaml'
}

/**
 * Parse size string to bytes, matching backend getSize function
 * Supports: B, K, M, G units (case insensitive)
 * Examples: "2M" -> 2097152, "10K" -> 10240, "1G" -> 1073741824
 */
export const parseSize = (size: string | number): number => {
	if (typeof size === 'number') {
		return size
	}

	if (!size || size === '0') {
		return 0
	}

	const sizeStr = size.toString().trim()
	if (!sizeStr) {
		return 0
	}

	const unit = sizeStr.slice(-1).toUpperCase()
	let valueStr = sizeStr

	// Check if last character is a unit
	if (['B', 'K', 'M', 'G'].includes(unit)) {
		valueStr = sizeStr.slice(0, -1)
	} else {
		// No unit specified, assume bytes
		const value = parseInt(sizeStr, 10)
		if (isNaN(value)) {
			throw new Error(`Invalid size format: ${size}`)
		}
		return value
	}

	const value = parseInt(valueStr, 10)
	if (isNaN(value)) {
		throw new Error(`Invalid size format: ${size}`)
	}

	switch (unit) {
		case 'B':
			return value
		case 'K':
			return value * 1024
		case 'M':
			return value * 1024 * 1024
		case 'G':
			return value * 1024 * 1024 * 1024
		default:
			return value
	}
}

// Upload progress interface
interface UploadProgress {
	total: number
	uploaded: number
	completed: boolean
}

// Upload response interface
interface UploadResponse {
	file_id: string
	filename: string
	content_type: string
	bytes: number
	created_at: number
	url?: string
	progress?: UploadProgress
	uid?: string
}

// Chunk information interface
interface ChunkInfo {
	chunkIndex: number
	totalChunks: number
	chunkSize: number
	start: number
	end: number
}

export const createFileHandlers = (neo_api: string | undefined, storages: App.AgentStorages, is_cn?: boolean) => {
	// Use Map to manage upload controllers
	const uploadControllers = new Map<string, AbortController>()

	/** Validate file type **/
	const validateFileType = (file: RcFile, allowedTypes: string[]): boolean => {
		if (!allowedTypes || allowedTypes.length === 0) {
			return true // Allow all types if no restrictions
		}

		const fileName = file.name.toLowerCase()
		const fileType = file.type.toLowerCase()

		// Check code file extensions
		const codeExtensions = Object.keys(CODE_FILE_TYPES)
		const hasCodeExtension = codeExtensions.some((ext) => fileName.endsWith(ext))
		if (hasCodeExtension) {
			return allowedTypes.some((type) => type === 'text/*' || codeExtensions.includes(type))
		}

		// Check wildcard types (e.g., image/*, text/*)
		for (const allowedType of allowedTypes) {
			if (allowedType.endsWith('/*')) {
				const prefix = allowedType.slice(0, -1) // Remove '*'
				if (fileType.startsWith(prefix)) {
					return true
				}
			} else if (allowedType === fileType) {
				return true
			} else if (allowedType.startsWith('.') && fileName.endsWith(allowedType)) {
				return true
			}
		}

		return false
	}

	/** Calculate chunk information **/
	const calculateChunkInfo = (file: RcFile, chunkSize: number): ChunkInfo[] => {
		const chunks: ChunkInfo[] = []
		const totalChunks = Math.ceil(file.size / chunkSize)

		for (let i = 0; i < totalChunks; i++) {
			const start = i * chunkSize
			const end = Math.min(start + chunkSize - 1, file.size - 1)
			chunks.push({
				chunkIndex: i,
				totalChunks,
				chunkSize: end - start + 1,
				start,
				end
			})
		}

		return chunks
	}

	/** Upload single chunk **/
	const uploadChunk = async (
		storage: App.AgentStorageType,
		file: RcFile,
		chunk: ChunkInfo,
		uid: string,
		upload_options: App.UploadOption
	): Promise<UploadResponse> => {
		if (!neo_api) {
			throw new Error(is_cn ? 'Neo API 端点未配置' : 'Neo API endpoint not configured')
		}

		const controller = new AbortController()
		const uploadKey = `${file.name}_${chunk.chunkIndex}`
		uploadControllers.set(uploadKey, controller)

		try {
			// Handle code file Content-Type
			const ext = '.' + file.name.split('.').pop()?.toLowerCase()
			let contentType = file.type
			if (ext && CODE_FILE_TYPES[ext]) {
				contentType = CODE_FILE_TYPES[ext]
			}

			// Create chunk data with proper Content-Type (not application/octet-stream)
			const chunkBlob = file.slice(chunk.start, chunk.end + 1)
			const typedChunkBlob = new Blob([chunkBlob], { type: contentType })

			const formData = new FormData()
			// Use safe filename for the file field to avoid encoding issues
			const safeFileName = `chunk_${chunk.chunkIndex}`
			formData.append('file', typedChunkBlob, safeFileName)

			// Send the original filename separately to preserve it correctly
			formData.append('original_filename', file.name)

			// Add chunk headers - ensure all header values are safe ASCII strings
			const headers: Record<string, string> = {
				'Content-Range': `bytes ${chunk.start}-${chunk.end}/${file.size}`,
				'Content-Uid': uid,
				'Content-Sync': 'true' // Always use sync mode to prevent merge errors
			}

			// Add upload options (remove "option_" prefix)
			for (const [key, value] of Object.entries(upload_options)) {
				if (value !== undefined) {
					formData.append(key, String(value))
				}
			}

			const endpoint = `${neo_api}/upload/${storage}?token=${encodeURIComponent(getToken())}`

			const response = await fetch(endpoint, {
				method: 'POST',
				body: formData,
				headers,
				credentials: 'include',
				signal: controller.signal
			})

			uploadControllers.delete(uploadKey)

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
				throw new Error(
					error.message ||
						(is_cn
							? `HTTP 错误! 状态: ${response.status}`
							: `HTTP error! status: ${response.status}`)
				)
			}

			const result = await response.json()
			return {
				file_id: result.data?.file_id || result.data?.ID,
				filename: result.data?.filename || file.name,
				content_type: result.data?.content_type || contentType,
				bytes: result.data?.bytes || chunk.chunkSize,
				created_at: result.data?.created_at || Date.now(),
				url: result.data?.url,
				progress: result.data?.progress,
				uid: uid
			}
		} catch (error: any) {
			console.log('error', error)
			uploadControllers.delete(uploadKey)
			if (error.name === 'AbortError') {
				throw new Error(is_cn ? '上传已取消' : 'Upload cancelled')
			}
			throw error
		}
	}

	/** Upload file to specified storage **/
	const uploadTo = async (
		storage: App.AgentStorageType,
		file: RcFile,
		upload_options: App.UploadOption
	): Promise<UploadResponse> => {
		const setting = storages[storage]
		if (!setting) {
			throw new Error(is_cn ? `存储 ${storage} 未配置` : `Storage ${storage} not configured`)
		}

		if (!neo_api) {
			throw new Error(is_cn ? 'Neo API 端点未配置' : 'Neo API endpoint not configured')
		}

		// Parse and validate file size
		const maxSize = parseSize(setting.max_size || '50M') // Default 50MB
		if (file.size > maxSize) {
			const sizeMB = Math.round(maxSize / 1024 / 1024)
			throw new Error(is_cn ? `文件大小不能超过 ${sizeMB}MB` : `File size cannot exceed ${sizeMB}MB`)
		}

		// Validate file type
		if (setting.allowed_types && !validateFileType(file, setting.allowed_types)) {
			throw new Error(is_cn ? '文件类型不支持' : 'File type not supported')
		}

		// Parse chunk size
		const chunkSize = parseSize(setting.chunk_size || '2M') // Default 2MB

		// Direct upload if file is smaller than chunk size
		if (file.size <= chunkSize) {
			const controller = new AbortController()
			uploadControllers.set(file.name, controller)

			try {
				// Handle code file Content-Type
				const ext = '.' + file.name.split('.').pop()?.toLowerCase()
				let contentType = file.type
				if (ext && CODE_FILE_TYPES[ext]) {
					contentType = CODE_FILE_TYPES[ext]
				}

				const formData = new FormData()
				// Use safe filename for the file field to avoid encoding issues
				const safeFileName = 'upload_file'

				if (ext && CODE_FILE_TYPES[ext]) {
					const codeBlob = new Blob([file], { type: CODE_FILE_TYPES[ext] })
					formData.append('file', codeBlob, safeFileName)
				} else {
					// Ensure the file has the correct Content-Type
					const typedFile = new Blob([file], { type: contentType })
					formData.append('file', typedFile, safeFileName)
				}

				// Send the original filename separately to preserve it correctly
				formData.append('original_filename', file.name)

				console.log('ext', ext)
				console.log('contentType', contentType)

				// Add upload options (remove "option_" prefix)
				for (const [key, value] of Object.entries(upload_options)) {
					if (value !== undefined) {
						formData.append(key, String(value))
					}
				}

				// Add sync header for all uploads
				const headers: Record<string, string> = {
					'Content-Sync': 'true' // Always use sync mode to prevent merge errors
				}

				const endpoint = `${neo_api}/upload/${storage}?token=${encodeURIComponent(getToken())}`
				const response = await fetch(endpoint, {
					method: 'POST',
					body: formData,
					headers,
					credentials: 'include',
					signal: controller.signal
				})

				uploadControllers.delete(file.name)

				if (!response.ok) {
					const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
					throw new Error(
						error.message ||
							(is_cn
								? `HTTP 错误! 状态: ${response.status}`
								: `HTTP error! status: ${response.status}`)
					)
				}

				const result = await response.json()
				return {
					file_id: result.data?.file_id || result.data?.ID,
					filename: result.data?.filename || file.name,
					content_type: result.data?.content_type || contentType,
					bytes: result.data?.bytes || file.size,
					created_at: result.data?.created_at || Date.now(),
					url: result.data?.url
				}
			} catch (error: any) {
				uploadControllers.delete(file.name)
				if (error.name === 'AbortError') {
					throw new Error(is_cn ? '上传已取消' : 'Upload cancelled')
				}
				message_.error(error.message || (is_cn ? '上传文件失败' : 'Failed to upload file'))
				throw error
			}
		}

		// Chunk upload
		const uid = `${encodeURIComponent(file.name).replace(/[^A-Za-z0-9]/g, '_')}_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`
		const chunks = calculateChunkInfo(file, chunkSize)

		let lastResponse: UploadResponse | null = null

		for (const chunk of chunks) {
			try {
				const response = await uploadChunk(storage, file, chunk, uid, upload_options)
				lastResponse = response

				// Progress callback can be triggered here
				if (response.progress && !response.progress.completed) {
					// Can trigger progress update event
					console.log(`Upload progress: ${response.progress.uploaded}/${response.progress.total}`)
				}
			} catch (error: any) {
				// Cancel all remaining chunk uploads
				chunks.slice(chunk.chunkIndex + 1).forEach((remainingChunk) => {
					const uploadKey = `${file.name}_${remainingChunk.chunkIndex}`
					const controller = uploadControllers.get(uploadKey)
					if (controller) {
						controller.abort()
						uploadControllers.delete(uploadKey)
					}
				})
				throw error
			}
		}

		if (!lastResponse) {
			throw new Error(is_cn ? '上传失败: 未收到响应' : 'Upload failed: no response received')
		}

		return lastResponse
	}

	/** Download file **/
	const downloadFile = async (file_id: string, disposition: 'inline' | 'attachment' = 'attachment') => {
		if (!neo_api) {
			throw new Error(is_cn ? 'Neo API 端点未配置' : 'Neo API endpoint not configured')
		}

		const endpoint = `${neo_api}/download?file_id=${encodeURIComponent(file_id)}&token=${encodeURIComponent(
			getToken()
		)}&disposition=${disposition}`

		try {
			const response = await fetch(endpoint, {
				credentials: 'include'
			})

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
				throw new Error(
					error.message ||
						(is_cn
							? `下载文件失败: ${response.statusText}`
							: `Failed to download file: ${response.statusText}`)
				)
			}

			// Get filename
			const contentDisposition = response.headers.get('Content-Disposition')
			const filename = contentDisposition
				? contentDisposition.split('filename=')[1]?.replace(/["']/g, '')
				: file_id

			// Create download link
			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = filename
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			window.URL.revokeObjectURL(url)

			return { success: true }
		} catch (error: any) {
			message_.error(error.message || (is_cn ? '下载文件失败' : 'Failed to download file'))
			throw error
		}
	}

	/** Cancel upload **/
	const cancelUpload = (fileName: string) => {
		// Cancel single file upload
		const controller = uploadControllers.get(fileName)
		if (controller) {
			controller.abort()
			uploadControllers.delete(fileName)
		}

		// Cancel chunk uploads
		const chunkControllers = Array.from(uploadControllers.keys()).filter((key) =>
			key.startsWith(`${fileName}_`)
		)
		chunkControllers.forEach((key) => {
			const controller = uploadControllers.get(key)
			if (controller) {
				controller.abort()
				uploadControllers.delete(key)
			}
		})
	}

	/** Cancel all uploads **/
	const cancelAllUploads = () => {
		uploadControllers.forEach((controller) => {
			controller.abort()
		})
		uploadControllers.clear()
	}

	return {
		uploadTo,
		downloadFile,
		cancelUpload,
		cancelAllUploads,
		validateFileType,
		parseSize
	}
}
