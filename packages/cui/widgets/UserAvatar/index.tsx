import { FC, useMemo, useState } from 'react'
import { GetCurrentUser } from '@/pages/auth/auth'
import { ResolveFileURL } from '@/utils/fileWrapper'
import Card from './components/Card'
import UploadModal from './components/UploadModal'
import type { UserAvatarProps } from './types'
import './styles.less'

const UserAvatar: FC<UserAvatarProps> = ({
	size = 40,
	showCard = false,
	className = '',
	style = {},
	onClick,
	user: propUser,
	forcePersonal = false,
	uploader,
	avatarAgent,
	onUploadSuccess
}) => {
	// Get user from props or auth info
	const user = useMemo(() => {
		return propUser || GetCurrentUser()
	}, [propUser])

	// Track if avatar image failed to load
	const [avatarError, setAvatarError] = useState(false)
	const [teamLogoError, setTeamLogoError] = useState(false)

	// Upload modal state
	const [uploadModalVisible, setUploadModalVisible] = useState(false)

	// Determine if user is in team context
	// If forcePersonal is true, ignore team context
	const isTeam = useMemo(() => {
		if (forcePersonal) return false
		return !!(user?.team_id && user?.team)
	}, [user, forcePersonal])

	// Handle avatar click
	const handleAvatarClick = () => {
		if (onUploadSuccess && uploader) {
			// If upload callback is configured, open upload modal
			setUploadModalVisible(true)
		} else if (onClick) {
			// Otherwise use custom click handler
			onClick()
		}
	}

	// Handle upload success
	const handleUploadSuccess = (fileId: string, fileUrl: string) => {
		if (onUploadSuccess) {
			onUploadSuccess(fileId, fileUrl)
		}
	}

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
		// 转换 wrapper 格式的头像 URL
		const avatarUrl = user.avatar ? ResolveFileURL(user.avatar) : null
		const teamLogoUrl = user.team?.logo ? ResolveFileURL(user.team.logo) : null

		if (isTeam && user.team) {
			// Team Avatar: Team Logo + User Avatar
			return (
				<div className='user-avatar user-avatar-team' style={{ width: size, height: size }}>
					{/* Team Logo Background */}
					<div className='team-logo-wrapper' style={{ width: size, height: size }}>
						{!teamLogoError && teamLogoUrl ? (
							<img
								src={teamLogoUrl}
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
						{!avatarError && avatarUrl ? (
							<img
								src={avatarUrl}
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
					{!avatarError && avatarUrl ? (
						<img
							src={avatarUrl}
							alt={user.name || 'User'}
							className='user-avatar-img'
							referrerPolicy='no-referrer'
							crossOrigin='anonymous'
							onError={() => {
								console.warn(
									'Avatar image failed to load, showing fallback:',
									avatarUrl
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
		<>
			<div className={`user-avatar-container ${className}`} style={style}>
				<div
					className='user-avatar-wrapper'
					onClick={handleAvatarClick}
					style={{ cursor: (uploader && onUploadSuccess) || onClick ? 'pointer' : 'default' }}
				>
					{renderAvatar()}
				</div>

				{showCard && (
					<div className='user-avatar-card-wrapper'>
						<Card user={user} isTeam={isTeam} />
					</div>
				)}
			</div>

			{uploader && onUploadSuccess && (
				<UploadModal
					visible={uploadModalVisible}
					onClose={() => setUploadModalVisible(false)}
					onSuccess={handleUploadSuccess}
					uploader={uploader}
					avatarAgent={avatarAgent}
				/>
			)}
		</>
	)
}

export default UserAvatar
