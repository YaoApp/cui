import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Upload, Progress, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { FileAPI } from '@/openapi'
import { CreateFileWrapper } from '@/utils/fileWrapper'
import type { UploaderProps } from './types'
import type { RcFile } from 'antd/es/upload/interface'
import './index.less'

const Uploader = forwardRef<any, UploaderProps>(({ uploader, onSuccess, onImageSelect }, ref) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [uploading, setUploading] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)
	const [previewUrl, setPreviewUrl] = useState<string>('')
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	// 生成唯一 key，确保每次组件挂载时都是全新实例
	const uploadKeyRef = useRef(`upload-${Date.now()}-${Math.random()}`)

	const handleFileSelect = (file: RcFile) => {
		// Validate file type
		const isImage = file.type.startsWith('image/')
		if (!isImage) {
			message.error(is_cn ? '只能上传图片文件' : 'Only image files are allowed')
			return false
		}

		// Validate file size (max 5MB)
		const isLt5M = file.size / 1024 / 1024 < 5
		if (!isLt5M) {
			message.error(is_cn ? '图片大小不能超过 5MB' : 'Image size must be less than 5MB')
			return false
		}

		// Show preview only, don't upload yet
		const reader = new FileReader()
		reader.onload = (e) => {
			setPreviewUrl(e.target?.result as string)
		}
		reader.readAsDataURL(file)
		setSelectedFile(file)

		// Notify parent about image selection
		if (onImageSelect) {
			onImageSelect(true)
		}

		return false // Prevent default upload behavior
	}

	const handleUpload = async (file: File) => {
		try {
			setUploading(true)
			setUploadProgress(0)

			if (!window.$app?.openapi) {
				throw new Error('OpenAPI not available')
			}

			const fileapi = new FileAPI(window.$app.openapi, uploader)

			const uploadResponse = await fileapi.Upload(
				file,
				{
					uploaderID: uploader,
					originalFilename: file.name,
					compressImage: true, // 启用图片压缩
					compressSize: 512, // 压缩后最大尺寸 512px
					public: true // 头像需要公开访问
				},
				(progress) => {
					setUploadProgress(progress.percentage)
				}
			)

			if (window.$app.openapi.IsError(uploadResponse)) {
				throw new Error(uploadResponse.error?.error_description || 'Upload failed')
			}

			const fileId = uploadResponse.data?.file_id
			const fileUrl = uploadResponse.data?.user_path || uploadResponse.data?.path

			if (!fileId) {
				throw new Error('File ID not returned from upload')
			}

			// 创建文件包装器: {uploaderID}://{fileID}
			const fileWrapper = CreateFileWrapper(uploader, fileId)

			message.success(is_cn ? '上传成功' : 'Upload successful')
			// 传递 wrapper 格式和 fileId
			onSuccess && onSuccess(fileId, fileWrapper)
		} catch (error) {
			console.error('Avatar upload failed:', error)
			const errorMsg = error instanceof Error ? error.message : is_cn ? '上传失败' : 'Upload failed'
			message.error(errorMsg)
			throw error
		} finally {
			setUploading(false)
			setTimeout(() => {
				setUploadProgress(0)
			}, 1000)
		}
	}

	// Expose handleConfirm method to parent
	useImperativeHandle(ref, () => ({
		handleConfirm: async () => {
			if (!selectedFile) {
				message.warning(is_cn ? '请先选择图片' : 'Please select an image first')
				throw new Error('No file selected')
			}
			await handleUpload(selectedFile)
		}
	}))

	return (
		<div className='uploader'>
			<Upload.Dragger
				key={uploadKeyRef.current}
				beforeUpload={handleFileSelect}
				showUploadList={false}
				accept='image/*'
				disabled={uploading}
				className='upload-dragger'
			>
				<div className='uploader-content'>
					{previewUrl ? (
						<div className='preview'>
							<img src={previewUrl} alt='Preview' />
							{uploading && (
								<div className='preview-mask'>
									<Progress
										type='circle'
										percent={uploadProgress}
										width={60}
										strokeColor='var(--color_primary)'
									/>
								</div>
							)}
							{!uploading && (
								<div className='preview-actions'>
									<Icon name='material-edit' size={16} />
									<span>
										{is_cn ? '点击或拖拽更换图片' : 'Click or drag to change'}
									</span>
								</div>
							)}
						</div>
					) : (
						<div className='upload-placeholder'>
							<Icon name='material-add_photo_alternate' size={40} />
							<p className='placeholder-text'>
								{is_cn ? '点击或拖拽图片到此区域' : 'Click or drag image here'}
							</p>
							<p className='placeholder-hint'>
								{is_cn ? '支持 JPG、PNG、GIF 格式，最大 5MB' : 'JPG, PNG, GIF, max 5MB'}
							</p>
						</div>
					)}
				</div>
			</Upload.Dragger>
		</div>
	)
})

Uploader.displayName = 'Uploader'

export default Uploader
