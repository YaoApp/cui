import { FC, useState } from 'react'
import { Divider, Tooltip } from 'antd'
import { getLocale, history } from '@umijs/max'
import { useMemoizedFn } from 'ahooks'
import { local } from '@yaoapp/storex'
import { difference } from 'lodash-es'
import { ResolveFileURL } from '@/utils/fileWrapper'
import { Icon } from '@/widgets'
import { useGlobal } from '@/context/app'
import type { CardProps } from './types'
import './index.less'

const Card: FC<CardProps> = ({ data, isCombined, className }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const [avatarError, setAvatarError] = useState(false)
	const [teamLogoError, setTeamLogoError] = useState(false)

	// 转换 wrapper 格式的头像 URL
	const avatarUrl = data.avatar ? ResolveFileURL(data.avatar) : null
	const teamLogoUrl = data.team?.logo ? ResolveFileURL(data.team.logo) : null

	// 判断是否有附加信息（email, bio, joined_at）
	const hasAdditionalInfo = data.email || data.bio || data.joined_at

	// 清除存储和退出登录
	const handleLogout = useMemoizedFn(async () => {
		try {
			// Call server logout endpoint to revoke tokens
			if (window.$app?.openapi) {
				const { User } = await import('@/openapi/user')
				const user = new User(window.$app.openapi)
				await user.auth.Logout(true)
			}
		} catch (error) {
			console.error('Server logout failed:', error)
			// Continue with local cleanup even if server logout fails
		}

		// Clear user info from local storage and global state
		const { AfterLogout } = await import('@/pages/auth/auth')
		AfterLogout(global)

		if (!local.logout_redirect) {
			history.push(local.login_url || '/')
		}

		const excludes = ['paths', 'avatar', 'xgen_theme', 'remote_cache', 'token_storage', 'temp_sid']
		const all = []
		for (let index = 0; index < localStorage.length; index++) {
			all.push(localStorage.key(index)!)
		}

		difference(all, excludes).map((item) => local.removeItem(item))
		sessionStorage.clear()

		// Clear the token and studio token
		localStorage.removeItem('xgen:token')
		localStorage.removeItem('xgen:studio')

		// Redirect to the custom logout page
		if (local.logout_redirect) {
			window.location = local.logout_redirect
			return
		}
	})

	// 跳转到设置页面（使用全局事件打开侧边栏并导航）
	const handleSettings = () => {
		// 触发全局事件，打开侧边栏并导航到设置页面
		// 这会触发 ChatWrapper 中的 handleOpenSidebar，自动最大化侧边栏
		window.$app.Event.emit('app/openSidebar', { path: '/settings/profile' })
	}

	return (
		<div className={`avatar-card ${className || ''}`}>
			{/* 右上角角色徽章 */}
			{isCombined && (
				<div className='avatar-card-badge-row'>
					<span className='avatar-card-badge'>
						{data.is_owner
							? (is_cn ? '所有者' : 'Owner')
							: (is_cn ? '成员' : 'Member')}
					</span>
				</div>
			)}

			<div className='avatar-card-header'>
				{/* Large Avatar */}
				<div className='avatar-card-avatar'>
					{isCombined && data.team ? (
						<div className='avatar-team'>
							<div className='avatar-team-logo'>
								{!teamLogoError && teamLogoUrl ? (
									<img
										src={teamLogoUrl}
										alt={data.team.name || 'Team'}
										referrerPolicy='no-referrer'
										crossOrigin='anonymous'
										onError={() => setTeamLogoError(true)}
									/>
								) : (
									<div className='avatar-text'>
										{data.team.name?.[0]?.toUpperCase() || 'T'}
									</div>
								)}
							</div>
							<div className='avatar-team-user'>
								{!avatarError && avatarUrl ? (
									<img
										src={avatarUrl}
										alt={data.name || 'User'}
										referrerPolicy='no-referrer'
										crossOrigin='anonymous'
										onError={() => setAvatarError(true)}
									/>
								) : (
									<div className='avatar-text-small'>
										{data.name?.[0]?.toUpperCase() || 'U'}
									</div>
								)}
							</div>
						</div>
					) : (
						<div className='avatar-personal'>
							{!avatarError && avatarUrl ? (
								<img
									src={avatarUrl}
									alt={data.name || 'Avatar'}
									referrerPolicy='no-referrer'
									crossOrigin='anonymous'
									onError={() => setAvatarError(true)}
								/>
							) : (
								<div className='avatar-text'>
									{data.name?.[0]?.toUpperCase() || 'U'}
								</div>
							)}
						</div>
					)}
				</div>

				{/* User Info */}
				<div className='avatar-card-content'>
					<div className='avatar-card-name'>
						{isCombined && data.team?.name ? (
							<span>{data.team.name}</span>
						) : (
							<span>{data.name}</span>
						)}
					</div>
					{isCombined && (
						<div className='avatar-card-user'>
							<Icon name='material-person' size={13} />
							<span>{data.name}</span>
						</div>
					)}
				</div>
			</div>

			{/* 底部区域：附加信息 + 操作按钮 */}
			<>
				<Divider style={{ margin: '6px 0' }} />
				<div className='avatar-card-footer'>
					{/* 附加信息（如果有的话） */}
					<div className='avatar-card-info'>
						{/* Bio/Email 区域：优先显示 Email，其次 Bio，都没有显示 "No bio" */}
						<div className='info-item bio-item'>
							{data.email ? (
								<span className='value'>{data.email}</span>
							) : data.bio ? (
								<span className='value'>{data.bio}</span>
							) : (
								<span className='value no-bio'>{is_cn ? '无介绍' : 'No bio'}</span>
							)}
						</div>
						{data.joined_at && (
							<div className='info-item'>
								<span className='label'>{is_cn ? '加入时间：' : 'Joined:'}</span>
								<span className='value'>
									{new Date(data.joined_at).toLocaleDateString()}
								</span>
							</div>
						)}
					</div>

					{/* 操作按钮（设置 + 退出） */}
					<div className='avatar-card-actions'>
						<Tooltip title={is_cn ? '设置' : 'Settings'}>
							<div className='action-button settings-button' onClick={handleSettings}>
								<Icon name='material-settings' size={14} />
							</div>
						</Tooltip>
						<Tooltip title={is_cn ? '退出' : 'Logout'}>
							<div className='action-button logout-button' onClick={handleLogout}>
								<Icon name='material-logout' size={14} />
							</div>
						</Tooltip>
					</div>
				</div>
			</>
		</div>
	)
}

export default Card
