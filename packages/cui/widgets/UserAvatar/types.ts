import type { App } from '@/types'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | number
export type AvatarShape = 'circle' | 'square'
export type AvatarMode = 'default' | 'form' // default: 仅头像, form: 头像+按钮

export interface UserAvatarProps {
	/** Avatar size - standard sizes or custom pixel value */
	size?: AvatarSize
	/** Avatar shape - circle or square (with border radius) */
	shape?: AvatarShape
	/** Border radius in pixels (only for square shape) */
	borderRadius?: number
	/** Display mode - default: avatar only, form: avatar + button */
	mode?: AvatarMode
	/** Button text for form mode */
	buttonText?: string
	/** Modal title for upload/generation */
	modalTitle?: string
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
