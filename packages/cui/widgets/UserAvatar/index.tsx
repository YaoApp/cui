import { FC, useMemo, useState } from 'react'
import { getLocale } from '@umijs/max'
import { GetCurrentUser } from '@/pages/auth/auth'
import { ResolveFileURL } from '@/utils/fileWrapper'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import Card from './components/Card'
import UploadModal from './components/UploadModal'
import type { UserAvatarProps, AvatarSize } from './types'
import './styles.less'

// 标准尺寸映射
const SIZE_MAP: Record<string, number> = {
	sm: 32,
	md: 40,
	lg: 56,
	xl: 80
}

const UserAvatar: FC<UserAvatarProps> = ({
	size = 'md',
	shape = 'circle',
	borderRadius,
	mode = 'default',
	buttonText,
	modalTitle,
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
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 计算实际尺寸
	const actualSize = useMemo(() => {
		if (typeof size === 'number') {
			return size
		}
		return SIZE_MAP[size] || SIZE_MAP.md
	}, [size])

	// 计算边框圆角
	const actualBorderRadius = useMemo(() => {
		if (shape === 'circle') {
			return '50%'
		}
		if (borderRadius !== undefined) {
			return `${borderRadius}px`
		}
		// 默认圆角根据尺寸计算
		return `${Math.min(actualSize * 0.15, 12)}px`
	}, [shape, borderRadius, actualSize])

	// 计算文字大小
	const textFontSize = useMemo(() => {
		return Math.max(actualSize * 0.45, 12)
	}, [actualSize])

	const [uploadModalVisible, setUploadModalVisible] = useState(false)
	const [avatarError, setAvatarError] = useState(false)
	const [teamLogoError, setTeamLogoError] = useState(false)

	const user = useMemo(() => {
		if (propUser) {
			return propUser
		}
		const currentUser = GetCurrentUser()
		if (currentUser) {
			return {
				id: currentUser.id || '',
				type: currentUser.type as 'user' | 'team',
				avatar: currentUser.avatar,
				name: currentUser.name,
				team: currentUser.team
					? {
							team_id: currentUser.team.team_id,
							logo: currentUser.team.logo,
							name: currentUser.team.name
					  }
					: undefined
			}
		}
		return null
	}, [propUser])

	const isTeam = useMemo(() => {
		if (forcePersonal) {
			return false
		}
		return user?.type === 'team' && user.team !== undefined
	}, [user, forcePersonal])

	// Handle avatar click
	const handleAvatarClick = () => {
		if (uploader && onUploadSuccess) {
			setUploadModalVisible(true)
		} else if (onClick) {
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
				<div
					className='user-avatar user-avatar-empty'
					style={{ width: actualSize, height: actualSize, borderRadius: actualBorderRadius }}
				>
					<span>?</span>
				</div>
			</div>
		)
	}

	const renderAvatar = () => {
		// 转换 wrapper 格式的头像 URL
		const avatarUrl = user.avatar ? ResolveFileURL(user.avatar) : null
		const teamLogoUrl = user.team?.logo ? ResolveFileURL(user.team.logo) : null

		// 判断是否应该显示 placeholder（既没有图片也没有文字）
		const showPlaceholder = !avatarUrl && !user.name

		if (isTeam && user.team) {
			// Team Avatar: Team Logo + User Avatar
			const showTeamPlaceholder = !teamLogoUrl && !user.team.name
			return (
				<div
					className='user-avatar user-avatar-team'
					style={{
						width: actualSize,
						height: actualSize,
						borderRadius: actualBorderRadius,
						overflow: 'hidden'
					}}
				>
					{/* Team Logo Background */}
					<div className='team-logo-wrapper'>
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
						) : showTeamPlaceholder ? (
							<div className='team-logo-placeholder'>
								<Icon name='material-account_circle' size={actualSize * 0.5} />
							</div>
						) : (
							<div className='team-logo-text' style={{ fontSize: textFontSize }}>
								{user.team.name?.[0]?.toUpperCase() || 'T'}
							</div>
						)}
					</div>

					{/* User Avatar Overlay */}
					<div
						className='user-avatar-overlay'
						style={{
							width: actualSize * 0.5,
							height: actualSize * 0.5,
							borderRadius:
								shape === 'circle' ? '50%' : `${Math.min(actualSize * 0.08, 6)}px`,
							overflow: 'hidden'
						}}
					>
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
						) : showPlaceholder ? (
							<div className='user-avatar-placeholder'>
								<Icon name='material-account_circle' size={actualSize * 0.25} />
							</div>
						) : (
							<div className='user-avatar-text' style={{ fontSize: textFontSize }}>
								{user.name?.[0]?.toUpperCase() || 'U'}
							</div>
						)}
					</div>
				</div>
			)
		} else {
			// Personal Avatar: Only User Avatar
			return (
				<div
					className='user-avatar user-avatar-personal'
					style={{
						width: actualSize,
						height: actualSize,
						borderRadius: actualBorderRadius,
						overflow: 'hidden'
					}}
				>
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
					) : showPlaceholder ? (
						<div className='user-avatar-placeholder'>
							<Icon name='material-account_circle' size={actualSize * 0.6} />
						</div>
					) : (
						<div className='user-avatar-text' style={{ fontSize: textFontSize }}>
							{user.name?.[0]?.toUpperCase() || 'U'}
						</div>
					)}
				</div>
			)
		}
	}

	// Form 模式：头像 + 按钮
	if (mode === 'form') {
		const defaultButtonText = is_cn ? '更换头像' : 'Change Avatar'
		const defaultModalTitle = is_cn ? '设置头像' : 'Set Avatar'

		return (
			<>
				<div className={`user-avatar-form-container ${className}`} style={style}>
					<div className='user-avatar-form-avatar' onClick={handleAvatarClick}>
						{renderAvatar()}
					</div>
					<Button
						type='primary'
						size='small'
						onClick={handleAvatarClick}
						disabled={!uploader || !onUploadSuccess}
						className='user-avatar-form-button'
					>
						{buttonText || defaultButtonText}
					</Button>
				</div>

				{uploader && onUploadSuccess && (
					<UploadModal
						visible={uploadModalVisible}
						onClose={() => setUploadModalVisible(false)}
						onSuccess={handleUploadSuccess}
						uploader={uploader}
						avatarAgent={avatarAgent}
						modalTitle={modalTitle || defaultModalTitle}
					/>
				)}
			</>
		)
	}

	// Default 模式：仅头像
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
					modalTitle={modalTitle}
				/>
			)}
		</>
	)
}

export default UserAvatar
