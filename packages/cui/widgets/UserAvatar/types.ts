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
}

export interface UserAvatarCardProps {
	/** User data */
	user: App.User
	/** Whether the user is in a team context */
	isTeam: boolean
	/** Custom class name */
	className?: string
}
