import { createFileHandlers } from './fileHandling'
import { App } from '@/types'

// Example: How to use the reimplemented file upload functionality

// 1. Configure storage settings (using string sizes like backend config)
// Note: We use type assertion here because the parseSize function will handle string conversion
const storages: App.AgentStorages = {
	chat: {
		max_size: '50M' as any, // String format like backend (parseSize will handle conversion)
		chunk_size: '2M' as any, // String format like backend (parseSize will handle conversion)
		allowed_types: [
			'text/*',
			'image/*',
			'video/*',
			'audio/*',
			'application/x-zip-compressed',
			'application/x-tar',
			'application/x-gzip',
			'application/yao',
			'application/zip',
			'application/pdf',
			'application/json',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'application/vnd.openxmlformats-officedocument.presentationml.slideshow'
		]
	},
	assets: {
		max_size: '10M' as any, // String format like backend (parseSize will handle conversion)
		chunk_size: '2M' as any, // String format like backend (parseSize will handle conversion)
		allowed_types: ['text/*', 'video/*', 'audio/*']
	},
	knowledge: {
		max_size: '100M' as any, // String format like backend (parseSize will handle conversion)
		chunk_size: '2M' as any, // String format like backend (parseSize will handle conversion)
		allowed_types: [
			'text/*',
			'image/*',
			'video/*',
			'audio/*',
			'application/x-zip-compressed',
			'application/x-tar',
			'application/x-gzip',
			'application/yao',
			'application/zip',
			'application/pdf',
			'application/json',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'application/vnd.openxmlformats-officedocument.presentationml.slideshow'
		]
	}
}

// 2. Create file handler
const neo_api = 'http://localhost:5099/api/__yao/neo'
const is_cn = false // Set to true for Chinese error messages

const fileHandlers = createFileHandlers(neo_api, storages, is_cn)

// 3. Usage examples

// Example 1: Upload small file to chat storage
export const uploadSmallFileExample = async (file: File) => {
	try {
		const uploadOptions: App.UploadOption = {
			compress_image: true,
			compress_size: 1920,
			gzip: false,
			knowledge: false,
			chat_id: 'chat_123',
			assistant_id: 'assistant_456'
		}

		const result = await fileHandlers.uploadTo('chat', file as any, uploadOptions)

		console.log('Upload successful:', {
			fileId: result.file_id,
			filename: result.filename,
			contentType: result.content_type,
			bytes: result.bytes,
			url: result.url
		})

		return result
	} catch (error) {
		console.error('Upload failed:', error)
		throw error
	}
}

// Example 2: Upload large file (auto chunking) to assets storage
export const uploadLargeFileExample = async (file: File) => {
	try {
		const uploadOptions: App.UploadOption = {
			compress_image: false,
			gzip: true, // Enable compression
			knowledge: false,
			chat_id: 'chat_123',
			assistant_id: 'assistant_456'
		}

		console.log(`Starting large file upload: ${file.name} (${file.size} bytes)`)

		const result = await fileHandlers.uploadTo('assets', file as any, uploadOptions)

		console.log('Large file upload successful:', {
			fileId: result.file_id,
			filename: result.filename,
			contentType: result.content_type,
			bytes: result.bytes,
			url: result.url
		})

		return result
	} catch (error) {
		console.error('Large file upload failed:', error)
		throw error
	}
}

// Example 3: Upload to knowledge base
export const uploadToKnowledgeExample = async (file: File) => {
	try {
		const uploadOptions: App.UploadOption = {
			compress_image: false,
			gzip: false,
			knowledge: true, // Push to knowledge base
			chat_id: 'chat_123',
			assistant_id: 'assistant_456'
		}

		const result = await fileHandlers.uploadTo('knowledge', file as any, uploadOptions)

		console.log('Knowledge base upload successful:', {
			fileId: result.file_id,
			filename: result.filename,
			contentType: result.content_type,
			bytes: result.bytes
		})

		return result
	} catch (error) {
		console.error('Knowledge base upload failed:', error)
		throw error
	}
}

// Example 4: File type validation
export const validateFileExample = (file: File) => {
	const allowedTypes = ['text/*', 'image/*', '.pdf', '.doc', '.docx']

	const isValid = fileHandlers.validateFileType(file as any, allowedTypes)

	if (isValid) {
		console.log(`File ${file.name} type validation passed`)
	} else {
		console.log(`File ${file.name} type not allowed`)
	}

	return isValid
}

// Example 5: Download file (no chat_id/assistant_id needed)
export const downloadFileExample = async (fileId: string) => {
	try {
		const result = await fileHandlers.downloadFile(fileId, 'attachment')
		console.log('File download successful')
		return result
	} catch (error) {
		console.error('File download failed:', error)
		throw error
	}
}

// Example 6: Cancel upload
export const cancelUploadExample = (fileName: string) => {
	fileHandlers.cancelUpload(fileName)
	console.log(`Cancelled upload for file ${fileName}`)
}

// Example 7: Cancel all uploads
export const cancelAllUploadsExample = () => {
	fileHandlers.cancelAllUploads()
	console.log('Cancelled all uploads')
}

// Example 8: Upload with progress monitoring
export const uploadWithProgressExample = async (file: File) => {
	try {
		const uploadOptions: App.UploadOption = {
			compress_image: true,
			gzip: false,
			knowledge: false,
			chat_id: 'chat_123',
			assistant_id: 'assistant_456'
		}

		// Note: Actual progress monitoring needs callback implementation in uploadChunk function
		// This just shows how to handle returned progress information

		console.log(`Starting upload: ${file.name}`)

		const result = await fileHandlers.uploadTo('chat', file as any, uploadOptions)

		if (result.progress) {
			console.log(`Upload progress: ${result.progress.uploaded}/${result.progress.total}`)
			if (result.progress.completed) {
				console.log('Upload completed!')
			}
		}

		return result
	} catch (error) {
		console.error('Upload failed:', error)
		throw error
	}
}

// Example 9: Usage in React component
export const useFileUploadExample = () => {
	const handleFileUpload = async (
		file: File,
		storage: App.AgentStorageType,
		chatId: string,
		assistantId?: string
	) => {
		try {
			// First validate file type
			const setting = storages[storage]
			if (setting?.allowed_types && !fileHandlers.validateFileType(file as any, setting.allowed_types)) {
				throw new Error('File type not allowed')
			}

			// Check file size using parseSize
			const maxSize = fileHandlers.parseSize(setting?.max_size || '50M')
			if (file.size > maxSize) {
				throw new Error(`File size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`)
			}

			const uploadOptions: App.UploadOption = {
				compress_image: storage === 'assets' || storage === 'chat',
				compress_size: 1920,
				gzip: file.size > 1024 * 1024, // Enable compression for files > 1MB
				knowledge: storage === 'knowledge',
				chat_id: chatId,
				assistant_id: assistantId
			}

			const result = await fileHandlers.uploadTo(storage, file as any, uploadOptions)

			// Handle upload success
			console.log('File upload successful:', result)
			return result
		} catch (error) {
			// Handle upload failure
			console.error('File upload failed:', error)
			throw error
		}
	}

	return {
		uploadFile: handleFileUpload,
		validateFile: fileHandlers.validateFileType,
		downloadFile: fileHandlers.downloadFile,
		cancelUpload: fileHandlers.cancelUpload,
		cancelAllUploads: fileHandlers.cancelAllUploads,
		parseSize: fileHandlers.parseSize
	}
}

// Example 10: Batch upload
export const batchUploadExample = async (
	files: File[],
	storage: App.AgentStorageType,
	chatId: string,
	assistantId?: string
) => {
	const results = []
	const errors = []

	for (const file of files) {
		try {
			const uploadOptions: App.UploadOption = {
				compress_image: true,
				gzip: file.size > 1024 * 1024,
				knowledge: storage === 'knowledge',
				chat_id: chatId,
				assistant_id: assistantId
			}

			const result = await fileHandlers.uploadTo(storage, file as any, uploadOptions)
			results.push(result)
			console.log(`File ${file.name} upload successful`)
		} catch (error) {
			errors.push({ file: file.name, error })
			console.error(`File ${file.name} upload failed:`, error)
		}
	}

	return { results, errors }
}

// Example 11: Chinese error messages
export const createChineseFileHandlers = () => {
	return createFileHandlers(neo_api, storages, true) // is_cn = true
}

// Example 12: Error handling with localized messages
export const uploadWithLocalizedErrorsExample = async (file: File, useChinese: boolean = false) => {
	const localizedHandlers = createFileHandlers(neo_api, storages, useChinese)

	try {
		const uploadOptions: App.UploadOption = {
			compress_image: true,
			gzip: false,
			knowledge: false,
			chat_id: 'chat_123',
			assistant_id: 'assistant_456'
		}

		const result = await localizedHandlers.uploadTo('chat', file as any, uploadOptions)

		console.log(useChinese ? '上传成功:' : 'Upload successful:', result)
		return result
	} catch (error: any) {
		// Error messages will be in the appropriate language based on is_cn parameter
		console.error(useChinese ? '上传失败:' : 'Upload failed:', error.message)
		throw error
	}
}

// Example 13: Parse size utility
export const parseSizeExample = () => {
	const { parseSize } = fileHandlers

	console.log('Size parsing examples:')
	console.log('parseSize("2M"):', parseSize('2M')) // 2097152
	console.log('parseSize("10K"):', parseSize('10K')) // 10240
	console.log('parseSize("1G"):', parseSize('1G')) // 1073741824
	console.log('parseSize("1024"):', parseSize('1024')) // 1024 (bytes)
	console.log('parseSize(2048):', parseSize(2048)) // 2048 (number input)
}
