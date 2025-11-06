import { FC, useMemo, useState } from 'react'
import { getLocale } from '@umijs/max'
import { GetCurrentUser } from '@/pages/auth/auth'
import { ResolveFileURL } from '@/utils/fileWrapper'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import Card from './components/Card'
import UploadModal from './components/UploadModal'
import type { UserAvatarProps, AvatarData } from './types'
import './styles.less'

// Get avatar config from app info
const getAvatarConfig = () => {
	try {
		const appInfo = window.$global?.app_info
		return appInfo?.optional?.avatar || {}
	} catch (error) {
		console.warn('Failed to get avatar config from app info:', error)
		return {}
	}
}

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
	displayType = 'auto', // 默认自动判断
	mode = 'default',
	buttonText,
	modalTitle,
	showCard = false,
	cardPlacement = 'right',
	cardAlign = 'center',
	className = '',
	style = {},
	onClick,
	data: propData,
	uploader: propUploader,
	avatarAgent: propAvatarAgent,
	onUploadSuccess
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Get avatar config with priority: props > app.yao config > default
	const avatarConfig = useMemo(() => getAvatarConfig(), [])

	// Priority: external props > app.yao config > default value
	const uploader = propUploader !== undefined ? propUploader : avatarConfig.uploader || '__yao.attachment'
	const avatarAgent = propAvatarAgent !== undefined ? propAvatarAgent : avatarConfig.agent

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
	// 为每个 UserAvatar 实例生成唯一标识
	const instanceId = useMemo(() => `avatar-${Date.now()}-${Math.random()}`, [])

	// 获取头像数据
	const data = useMemo((): AvatarData | null => {
		if (propData) {
			return propData
		}
		// Fallback to current user from auth
		const currentUser = GetCurrentUser()
		if (currentUser) {
			// 判断是否在团队上下文中
			const isInTeamContext = !!(currentUser.team_id && currentUser.team)

			return {
				id: String(currentUser.id || ''),
				// 团队上下文中优先使用成员头像，否则使用用户头像
				avatar: isInTeamContext ? currentUser.member?.avatar || currentUser.avatar : currentUser.avatar,
				// 团队上下文中优先使用成员昵称，否则使用用户名
				name: isInTeamContext ? currentUser.member?.display_name || currentUser.name : currentUser.name,
				// 团队上下文中优先使用成员邮箱和简介
				email: isInTeamContext
					? currentUser.member?.email || (currentUser as any).email
					: (currentUser as any).email,
				bio: isInTeamContext
					? currentUser.member?.bio || (currentUser as any).bio
					: (currentUser as any).bio,
				// 角色信息：优先显示 user_type
				role_id: currentUser.type_id,
				role_name: currentUser.user_type?.name || currentUser.type_id,
				is_owner: !!currentUser.is_owner,
				// 成员类型：根据上下文判断
				member_type: isInTeamContext ? 'user' : undefined,
				team:
					currentUser.team && currentUser.team.team_id
						? {
								team_id: currentUser.team.team_id,
								logo: currentUser.team.logo,
								name: currentUser.team.name
						  }
						: undefined
			}
		}
		return null
	}, [propData, is_cn])

	// 判断是否显示组合模式（团队logo + 用户头像）
	const isCombinedDisplay = useMemo(() => {
		if (displayType === 'auto') {
			// auto 模式：根据是否有 team 数据自动判断
			return data?.team !== undefined
		}
		if (displayType === 'combined') {
			// combined 模式：强制显示组合（需要有 team 数据）
			return data?.team !== undefined
		}
		// avatar 模式：强制只显示头像
		return false
	}, [displayType, data])

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

	if (!data) {
		// Fallback avatar if no data
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
		const avatarUrl = data.avatar ? ResolveFileURL(data.avatar) : null
		const teamLogoUrl = data.team?.logo ? ResolveFileURL(data.team.logo) : null

		// 判断是否应该显示 placeholder（既没有图片也没有文字）
		const showPlaceholder = !avatarUrl && !data.name

		if (isCombinedDisplay && data.team) {
			// Combined Display: Team Logo + User Avatar
			const showTeamPlaceholder = !teamLogoUrl && !data.team.name
			return (
				<div
					className='user-avatar user-avatar-combined'
					style={{
						width: actualSize,
						height: actualSize,
						borderRadius: actualBorderRadius,
						overflow: 'visible' // 允许用户头像超出边界
					}}
				>
					{/* 团队 Logo 的裁切容器 */}
					<div
						style={{
							position: 'absolute',
							width: '100%',
							height: '100%',
							borderRadius: actualBorderRadius,
							overflow: 'hidden' // 只裁切团队 logo
						}}
					>
						{/* Team Logo Background */}
						<div className='team-logo-wrapper'>
							{!teamLogoError && teamLogoUrl ? (
								<img
									src={teamLogoUrl}
									alt={data.team.name || 'Team'}
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
									{data.team.name?.[0]?.toUpperCase() || 'T'}
								</div>
							)}
						</div>
					</div>

					{/* User Avatar Overlay - 独立显示，不受团队 logo 容器影响 */}
					<div
						className='user-avatar-overlay'
						style={{
							width: actualSize * 0.5,
							height: actualSize * 0.5,
							// 向外延伸，独立于父容器，不受父容器圆角影响
							bottom: '-2px',
							right: '-2px',
							borderRadius:
								shape === 'circle' ? '50%' : `${Math.min(actualSize * 0.1, 8)}px`,
							overflow: 'hidden' // 头像本身保持圆角裁切
						}}
					>
						{!avatarError && avatarUrl ? (
							<img
								src={avatarUrl}
								alt={data.name || 'User'}
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
							<div className='user-avatar-text' style={{ fontSize: textFontSize * 0.5 }}>
								{data.name?.[0]?.toUpperCase() || 'U'}
							</div>
						)}
					</div>
				</div>
			)
		} else {
			// Avatar Only Display
			return (
				<div
					className='user-avatar user-avatar-single'
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
							alt={data.name || 'Avatar'}
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
							{data.name?.[0]?.toUpperCase() || 'U'}
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
						key={instanceId}
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
					style={{
						cursor: (uploader && onUploadSuccess) || onClick || showCard ? 'pointer' : 'default'
					}}
				>
					{renderAvatar()}
				</div>

				{showCard && (
					<div
						className={`user-avatar-card-wrapper user-avatar-card-wrapper-${cardPlacement} user-avatar-card-align-${cardAlign}`}
					>
						<Card data={data} isCombined={isCombinedDisplay} />
					</div>
				)}
			</div>

			{uploader && onUploadSuccess && (
				<UploadModal
					key={instanceId}
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
