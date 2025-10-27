export interface UploadModalProps {
	/** Modal visibility */
	visible: boolean
	/** Close modal callback */
	onClose: () => void
	/** Upload success callback */
	onSuccess: (fileId: string, fileUrl: string) => void
	/** Uploader ID (optional, default: __yao.attachment) */
	uploader?: string
	/** Avatar agent ID for AI generation (optional) */
	avatarAgent?: string
}

export interface UploadedFile {
	file_id: string
	filename: string
	path: string
	user_path?: string
	bytes: number
	content_type: string
	created_at: number
}

