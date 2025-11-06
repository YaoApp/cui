import OpenAPI from './openapi'
import {
	ApiResponse,
	FileListResponse,
	FileUploadOptions,
	FileListOptions,
	FileInfo,
	FileExistsResponse,
	FileDeleteResponse,
	UploadProgressCallback
} from './types'
import { nanoid } from 'nanoid'

/**
 * File Management API
 *
 * Provides comprehensive file management capabilities including:
 * - File upload with chunked support
 * - File listing with pagination and filtering
 * - File metadata retrieval
 * - File content download
 * - File deletion
 * - File existence checking
 */
export class FileAPI {
	private api: OpenAPI
	private defaultUploader: string

	constructor(api: OpenAPI, defaultUploader?: string) {
		this.api = api
		this.defaultUploader = defaultUploader || '__yao.attachment'
	}

	// ===== File Upload =====

	/**
	 * Upload a single file
	 * @param file - File to upload
	 * @param options - Upload options
	 * @param onProgress - Progress callback
	 * @returns Promise<ApiResponse<FileInfo>>
	 */
	async Upload(
		file: File,
		options: FileUploadOptions = {},
		onProgress?: UploadProgressCallback
	): Promise<ApiResponse<FileInfo>> {
		const uploaderID = this.getUploaderID(options.uploaderID)

		// Determine if we should use chunked upload
		const shouldUseChunked = options.chunked || file.size > (options.chunkSize || 2 * 1024 * 1024)

		if (shouldUseChunked) {
			return this.uploadChunked(uploaderID, file, options, onProgress)
		}

		// Single file upload
		const formData = new FormData()
		formData.append('file', file)

		// Add options to form data
		if (options.originalFilename || file.name) {
			formData.append('original_filename', options.originalFilename || file.name)
		}

		if (options.path) {
			formData.append('path', options.path)
		}

		if (options.groups && options.groups.length > 0) {
			formData.append('groups', options.groups.join(','))
		}

		if (options.gzip) {
			formData.append('gzip', 'true')
		}

		if (options.compressImage) {
			formData.append('compress_image', 'true')
		}

		if (options.compressSize) {
			formData.append('compress_size', options.compressSize.toString())
		}

		if (options.public !== undefined) {
			formData.append('public', options.public ? 'true' : 'false')
		}

		if (options.share) {
			formData.append('share', options.share)
		}

		// Use custom upload method with progress tracking if callback provided
		if (onProgress) {
			return this.uploadWithProgress(uploaderID, formData, onProgress)
		}

		// Use standard upload method
		return this.api.Upload<FileInfo>(`/file/${uploaderID}`, formData)
	}

	/**
	 * Upload multiple files
	 * @param files - Files to upload
	 * @param options - Upload options
	 * @param onProgress - Progress callback for each file
	 * @returns Promise<ApiResponse<FileInfo>[]>
	 */
	async UploadMultiple(
		files: File[],
		options: FileUploadOptions = {},
		onProgress?: (fileIndex: number, progress: { loaded: number; total: number; percentage: number }) => void
	): Promise<ApiResponse<FileInfo>[]> {
		const uploadPromises = files.map((file, index) => {
			const progressCallback = onProgress
				? (progress: { loaded: number; total: number; percentage: number }) =>
						onProgress(index, progress)
				: undefined

			return this.Upload(file, options, progressCallback)
		})

		return Promise.all(uploadPromises)
	}

	// ===== File Management =====

	/**
	 * Get file list with pagination and filtering
	 * @param options - List options
	 * @returns Promise<ApiResponse<FileListResponse>>
	 */
	async List(options: FileListOptions = {}): Promise<ApiResponse<FileListResponse>> {
		const uploaderID = this.getUploaderID(options.uploaderID)

		const params: Record<string, string> = {}

		if (options.page) {
			params.page = options.page.toString()
		}

		if (options.pageSize) {
			params.page_size = options.pageSize.toString()
		}

		if (options.status) {
			params.status = options.status
		}

		if (options.contentType) {
			params.content_type = options.contentType
		}

		if (options.name) {
			params.name = options.name
		}

		if (options.orderBy) {
			params.order_by = options.orderBy
		}

		if (options.select && options.select.length > 0) {
			params.select = options.select.join(',')
		}

		return this.api.Get<FileListResponse>(`/file/${uploaderID}`, params)
	}

	/**
	 * Get file metadata by ID
	 * @param fileID - File ID (required)
	 * @param uploaderID - Uploader ID (optional, default: __yao.attachment)
	 * @returns Promise<ApiResponse<FileInfo>>
	 */
	async Retrieve(fileID: string, uploaderID?: string): Promise<ApiResponse<FileInfo>> {
		if (!fileID) {
			throw new Error('File ID is required')
		}

		const actualUploaderID = this.getUploaderID(uploaderID)
		return this.api.Get<FileInfo>(`/file/${actualUploaderID}/${encodeURIComponent(fileID)}`)
	}

	/**
	 * Delete a file by ID
	 * @param fileID - File ID (required)
	 * @param uploaderID - Uploader ID (optional, default: __yao.attachment)
	 * @returns Promise<ApiResponse<FileDeleteResponse>>
	 */
	async Delete(fileID: string, uploaderID?: string): Promise<ApiResponse<FileDeleteResponse>> {
		if (!fileID) {
			throw new Error('File ID is required')
		}

		const actualUploaderID = this.getUploaderID(uploaderID)
		return this.api.Delete<FileDeleteResponse>(`/file/${actualUploaderID}/${encodeURIComponent(fileID)}`)
	}

	/**
	 * Download file content as blob
	 * @param fileID - File ID (required)
	 * @param uploaderID - Uploader ID (optional, default: __yao.attachment)
	 * @returns Promise<ApiResponse<Blob>>
	 */
	async Download(fileID: string, uploaderID?: string): Promise<ApiResponse<Blob>> {
		if (!fileID) {
			throw new Error('File ID is required')
		}

		const response = await fetch(this.getContentURL(fileID, uploaderID), {
			method: 'GET',
			credentials: 'include'
		})

		const blob = await response.blob()

		const apiResponse: ApiResponse<Blob> = {
			data: blob,
			status: response.status,
			headers: response.headers
		}

		if (!response.ok) {
			try {
				const errorText = await blob.text()
				const errorData = JSON.parse(errorText)
				apiResponse.error = errorData.error || {
					error: 'download_failed',
					error_description: `Download failed with status ${response.status}`
				}
			} catch {
				apiResponse.error = {
					error: 'download_failed',
					error_description: `Download failed with status ${response.status}`
				}
			}
		}

		return apiResponse
	}

	/**
	 * Check if a file exists
	 * @param fileID - File ID (required)
	 * @param uploaderID - Uploader ID (optional, default: __yao.attachment)
	 * @returns Promise<ApiResponse<FileExistsResponse>>
	 */
	async Exists(fileID: string, uploaderID?: string): Promise<ApiResponse<FileExistsResponse>> {
		if (!fileID) {
			throw new Error('File ID is required')
		}

		const actualUploaderID = this.getUploaderID(uploaderID)
		return this.api.Get<FileExistsResponse>(`/file/${actualUploaderID}/${encodeURIComponent(fileID)}/exists`)
	}

	/**
	 * Get upload options for Ant Design Upload component
	 * @param options - File upload options
	 * @returns Object compatible with Ant Design Upload props
	 */
	UploadProps(options: FileUploadOptions = {}) {
		const uploaderID = this.getUploaderID(options.uploaderID)
		return {
			name: 'file',
			action: `${this.getBaseURL()}/file/${uploaderID}`,
			method: 'POST' as const,
			withCredentials: true,
			data: {
				...(options.originalFilename && { original_filename: options.originalFilename }),
				...(options.path && { path: options.path }),
				...(options.groups && { groups: options.groups.join(',') }),
				...(options.gzip && { gzip: 'true' }),
				...(options.compressImage && { compress_image: 'true' }),
				...(options.compressSize && { compress_size: options.compressSize.toString() }),
				...(options.public !== undefined && { public: options.public ? 'true' : 'false' }),
				...(options.share && { share: options.share })
			},
			headers: {
				...(this.getCSRFToken() && { 'X-CSRF-Token': this.getCSRFToken() })
			}
		}
	}

	// ===== Static Utility Methods =====

	/**
	 * Format file size for display
	 * @param bytes - File size in bytes
	 * @returns Formatted file size string
	 */
	static FormatSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes'

		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	/**
	 * Get file extension from filename
	 * @param filename - File name
	 * @returns File extension (without dot)
	 */
	static GetExtension(filename: string): string {
		return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
	}

	/**
	 * Check if file is an image
	 * @param contentType - File content type
	 * @returns True if file is an image
	 */
	static IsImage(contentType: string): boolean {
		return contentType.startsWith('image/')
	}

	/**
	 * Check if file is a document
	 * @param contentType - File content type
	 * @returns True if file is a document
	 */
	static IsDocument(contentType: string): boolean {
		const documentTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'text/plain',
			'text/csv'
		]
		return documentTypes.includes(contentType)
	}

	// ===== Private Methods =====

	/**
	 * Get uploader ID with priority: options > constructor default > fallback default
	 */
	private getUploaderID(optionsUploader?: string): string {
		return optionsUploader || this.defaultUploader
	}

	/**
	 * Upload file using chunked upload
	 */
	private async uploadChunked(
		uploaderID: string,
		file: File,
		options: FileUploadOptions = {},
		onProgress?: UploadProgressCallback
	): Promise<ApiResponse<FileInfo>> {
		const chunkSize = options.chunkSize || 2 * 1024 * 1024 // Default 2MB
		const totalSize = file.size
		const totalChunks = Math.ceil(totalSize / chunkSize)

		// Generate unique file UID for chunked upload
		const fileUID = this.generateUID(file.name + Date.now())

		let lastResponse: ApiResponse<FileInfo> | null = null

		// Upload each chunk
		for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
			const start = chunkIndex * chunkSize
			const end = Math.min(start + chunkSize - 1, totalSize - 1)
			const chunkBlob = file.slice(start, end + 1)

			// Create form data for this chunk
			const formData = new FormData()
			formData.append('file', chunkBlob)

			// Add options to form data (only on first chunk to reduce payload size)
			if (chunkIndex === 0) {
				if (options.originalFilename || file.name) {
					formData.append('original_filename', options.originalFilename || file.name)
				}

				if (options.path) {
					formData.append('path', options.path)
				}

				if (options.groups && options.groups.length > 0) {
					formData.append('groups', options.groups.join(','))
				}

				if (options.gzip) {
					formData.append('gzip', 'true')
				}

				if (options.compressImage) {
					formData.append('compress_image', 'true')
				}

				if (options.compressSize) {
					formData.append('compress_size', options.compressSize.toString())
				}

				if (options.public !== undefined) {
					formData.append('public', options.public ? 'true' : 'false')
				}

				if (options.share) {
					formData.append('share', options.share)
				}
			}

			// Upload this chunk
			const chunkResponse = await this.uploadChunk(uploaderID, formData, start, end, totalSize, fileUID)

			if (this.api.IsError(chunkResponse)) {
				return chunkResponse
			}

			lastResponse = chunkResponse

			// Update progress
			if (onProgress) {
				const loaded = end + 1
				const percentage = Math.round((loaded / totalSize) * 100)
				onProgress({
					loaded,
					total: totalSize,
					percentage
				})
			}
		}

		return lastResponse!
	}

	/**
	 * Upload a single chunk
	 */
	private async uploadChunk(
		uploaderID: string,
		formData: FormData,
		start: number,
		end: number,
		total: number,
		uid: string
	): Promise<ApiResponse<FileInfo>> {
		return new Promise((resolve) => {
			const xhr = new XMLHttpRequest()

			xhr.addEventListener('load', () => {
				try {
					const response = JSON.parse(xhr.responseText)
					const apiResponse: ApiResponse<FileInfo> = {
						data: response.data || response,
						status: xhr.status,
						headers: new Headers()
					}

					if (xhr.status >= 200 && xhr.status < 300) {
						resolve(apiResponse)
					} else {
						apiResponse.error = response.error || {
							error: 'chunk_upload_failed',
							error_description: `Chunk upload failed with status ${xhr.status}`
						}
						resolve(apiResponse)
					}
				} catch (error) {
					const apiResponse: ApiResponse<FileInfo> = {
						status: xhr.status,
						headers: new Headers(),
						error: {
							error: 'parse_error',
							error_description: 'Failed to parse chunk response'
						}
					}
					resolve(apiResponse)
				}
			})

			xhr.addEventListener('error', () => {
				const apiResponse: ApiResponse<FileInfo> = {
					status: xhr.status || 0,
					headers: new Headers(),
					error: {
						error: 'network_error',
						error_description: 'Network error during chunk upload'
					}
				}
				resolve(apiResponse)
			})

			// Set up request
			xhr.open('POST', `${this.getBaseURL()}/file/${uploaderID}`)

			// Set chunked upload headers
			xhr.setRequestHeader('Content-Sync', 'true')
			xhr.setRequestHeader('Content-Uid', uid)
			xhr.setRequestHeader('Content-Range', `bytes ${start}-${end}/${total}`)

			// Add CSRF token if available
			const csrfToken = this.getCSRFToken()
			if (csrfToken) {
				xhr.setRequestHeader('X-CSRF-Token', csrfToken)
			}

			// Include credentials for authentication
			xhr.withCredentials = true

			// Send the chunk
			xhr.send(formData)
		})
	}

	/**
	 * Upload with progress tracking
	 */
	private async uploadWithProgress(
		uploaderID: string,
		formData: FormData,
		onProgress: UploadProgressCallback
	): Promise<ApiResponse<FileInfo>> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest()

			// Track upload progress
			xhr.upload.addEventListener('progress', (event) => {
				if (event.lengthComputable) {
					const percentage = Math.round((event.loaded / event.total) * 100)
					onProgress({
						loaded: event.loaded,
						total: event.total,
						percentage
					})
				}
			})

			xhr.addEventListener('load', () => {
				try {
					const response = JSON.parse(xhr.responseText)
					const apiResponse: ApiResponse<FileInfo> = {
						data: response.data || response,
						status: xhr.status,
						headers: new Headers()
					}

					if (xhr.status >= 200 && xhr.status < 300) {
						resolve(apiResponse)
					} else {
						apiResponse.error = response.error || {
							error: 'upload_failed',
							error_description: `Upload failed with status ${xhr.status}`
						}
						resolve(apiResponse)
					}
				} catch (error) {
					const apiResponse: ApiResponse<FileInfo> = {
						status: xhr.status,
						headers: new Headers(),
						error: {
							error: 'parse_error',
							error_description: 'Failed to parse response'
						}
					}
					resolve(apiResponse)
				}
			})

			xhr.addEventListener('error', () => {
				const apiResponse: ApiResponse<FileInfo> = {
					status: xhr.status || 0,
					headers: new Headers(),
					error: {
						error: 'network_error',
						error_description: 'Network error during upload'
					}
				}
				resolve(apiResponse)
			})

			// Set up request
			xhr.open('POST', `${this.getBaseURL()}/file/${uploaderID}`)

			// Add CSRF token if available
			const csrfToken = this.getCSRFToken()
			if (csrfToken) {
				xhr.setRequestHeader('X-CSRF-Token', csrfToken)
			}

			// Include credentials for authentication
			xhr.withCredentials = true

			// Send the request
			xhr.send(formData)
		})
	}

	/**
	 * Get CSRF token for manual XHR requests
	 */
	private getCSRFToken(): string | null {
		// Try reading from cookies first
		if (typeof document !== 'undefined') {
			const cookies = document.cookie.split(';')
			for (const cookie of cookies) {
				const [name, value] = cookie.trim().split('=')
				if (
					name === '__Host-csrf_token' ||
					name === '__Secure-csrf_token' ||
					name === '__Host-xsrf_token' ||
					name === '__Secure-xsrf_token'
				) {
					return decodeURIComponent(value)
				}
			}
		}

		// Try reading from localStorage
		if (typeof localStorage !== 'undefined') {
			return localStorage.getItem('csrf_token') || localStorage.getItem('xsrf_token')
		}

		return null
	}

	/**
	 * Get file content URL for download or display
	 */
	private getContentURL(fileID: string, uploaderID?: string): string {
		if (!fileID) {
			throw new Error('File ID is required')
		}

		const actualUploaderID = this.getUploaderID(uploaderID)
		return `${this.getBaseURL()}/file/${actualUploaderID}/${encodeURIComponent(fileID)}/content`
	}

	/**
	 * Get base URL from API instance
	 */
	private getBaseURL(): string {
		// Access baseURL through a method call to avoid direct property access
		// This is a workaround since config is private in OpenAPI class
		return (this.api as any).config?.baseURL || ''
	}

	/**
	 * Generate unique ID for chunked upload
	 */
	private generateUID(input: string): string {
		// Use NanoID for secure, URL-safe unique IDs
		return nanoid(32)
	}
}
