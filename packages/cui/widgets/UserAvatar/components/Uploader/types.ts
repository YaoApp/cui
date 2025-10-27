export interface UploaderProps {
	/** Uploader ID */
	uploader: string
	/** Upload success callback */
	onSuccess: (fileId: string, fileUrl: string) => void
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

