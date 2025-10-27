import type { App } from '@/types'

export interface CardProps {
	/** User data */
	user: App.User
	/** Whether the user is in a team context */
	isTeam: boolean
	/** Custom class name */
	className?: string
}

