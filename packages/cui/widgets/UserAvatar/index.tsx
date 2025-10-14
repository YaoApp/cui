import { FC, useMemo, useState } from 'react'
import { GetCurrentUser } from '@/pages/auth/auth'
import UserAvatarCard from './UserAvatarCard'
import type { UserAvatarProps } from './types'
import './styles.less'

const UserAvatar: FC<UserAvatarProps> = ({
	size = 40,
	showCard = false,
	className = '',
	style = {},
	onClick,
	user: propUser,
	forcePersonal = false
}) => {
	// Get user from props or auth info
	const user = useMemo(() => {
		return propUser || GetCurrentUser()
	}, [propUser])

	// Track if avatar image failed to load
	const [avatarError, setAvatarError] = useState(false)
	const [teamLogoError, setTeamLogoError] = useState(false)

	// Determine if user is in team context
	// If forcePersonal is true, ignore team context
	const isTeam = useMemo(() => {
		if (forcePersonal) return false
		return !!(user?.team_id && user?.team)
	}, [user, forcePersonal])

	if (!user) {
		// Fallback avatar if no user
		return (
			<div className={`user-avatar-wrapper ${className}`} style={style} onClick={onClick}>
				<div className='user-avatar user-avatar-empty' style={{ width: size, height: size }}>
					<span>?</span>
				</div>
			</div>
		)
	}

	const renderAvatar = () => {
		if (isTeam && user.team) {
			// Team Avatar: Team Logo + User Avatar
			return (
				<div className='user-avatar user-avatar-team' style={{ width: size, height: size }}>
					{/* Team Logo Background */}
					<div className='team-logo-wrapper' style={{ width: size, height: size }}>
						{!teamLogoError && user.team.logo ? (
							<img
								src={user.team.logo}
								alt={user.team.name || 'Team'}
								className='team-logo-img'
								referrerPolicy='no-referrer'
								crossOrigin='anonymous'
								onError={() => {
									console.warn('Team logo failed to load, showing fallback')
									setTeamLogoError(true)
								}}
							/>
						) : (
							<div className='team-logo-text'>
								{user.team.name?.[0]?.toUpperCase() || 'T'}
							</div>
						)}
					</div>

					{/* User Avatar Overlay */}
					<div className='user-avatar-overlay' style={{ width: size * 0.5, height: size * 0.5 }}>
						{!avatarError && user.avatar ? (
							<img
								src={user.avatar}
								alt={user.name || 'User'}
								className='user-avatar-img'
								referrerPolicy='no-referrer'
								crossOrigin='anonymous'
								onError={() => {
									console.warn('User avatar failed to load, showing fallback')
									setAvatarError(true)
								}}
							/>
						) : (
							<div className='user-avatar-text'>{user.name?.[0]?.toUpperCase() || 'U'}</div>
						)}
					</div>
				</div>
			)
		} else {
			// Personal Avatar: Only User Avatar
			return (
				<div className='user-avatar user-avatar-personal' style={{ width: size, height: size }}>
					{!avatarError && user.avatar ? (
						<img
							src={user.avatar}
							alt={user.name || 'User'}
							className='user-avatar-img'
							referrerPolicy='no-referrer'
							crossOrigin='anonymous'
							onError={() => {
								console.warn(
									'Avatar image failed to load, showing fallback:',
									user.avatar
								)
								setAvatarError(true)
							}}
						/>
					) : (
						<div className='user-avatar-text'>{user.name?.[0]?.toUpperCase() || 'U'}</div>
					)}
				</div>
			)
		}
	}

	return (
		<div className={`user-avatar-container ${className}`} style={style}>
			<div className='user-avatar-wrapper' onClick={onClick}>
				{renderAvatar()}
			</div>

			{showCard && (
				<div className='user-avatar-card-wrapper'>
					<UserAvatarCard user={user} isTeam={isTeam} />
				</div>
			)}
		</div>
	)
}

export default UserAvatar
