import type { App } from '@/types'

export interface UserAvatarProps {
	/** Avatar size in pixels */
	size?: number
	/** Whether to show detail card on hover */
	showCard?: boolean
	/** Custom class name */
	className?: string
	/** Custom style */
	style?: React.CSSProperties
	/** Click handler */
	onClick?: () => void
	/** User data (optional, will use auth info if not provided) */
	user?: App.User
	/** Force personal avatar only (ignore team context). Default: false */
	forcePersonal?: boolean
	/** Uploader ID for avatar upload (optional, enables upload modal) */
	uploader?: string
	/** Avatar agent ID for AI generation (optional) */
	avatarAgent?: string
	/** Upload success callback */
	onUploadSuccess?: (fileId: string, fileUrl: string) => void
}
