import type { AvatarData } from '../../types'

export interface CardProps {
	/** Avatar data */
	data: AvatarData
	/** Whether to show combined display (team + user) */
	isCombined: boolean
	/** Custom class name */
	className?: string
}

