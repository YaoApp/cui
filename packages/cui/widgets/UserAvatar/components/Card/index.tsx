import { FC, useState } from 'react'
import { Divider } from 'antd'
import { getLocale } from '@umijs/max'
import { Icon } from '@/widgets'
import type { CardProps } from './types'
import './index.less'

const Card: FC<CardProps> = ({ user, isTeam, className }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [avatarError, setAvatarError] = useState(false)
	const [teamLogoError, setTeamLogoError] = useState(false)

	return (
		<div className={`avatar-card ${className || ''}`}>
			<div className='avatar-card-header'>
				{/* Large Avatar */}
				<div className='avatar-card-avatar'>
					{isTeam && user.team ? (
						<div className='avatar-team'>
							<div className='avatar-team-logo'>
								{!teamLogoError && user.team.logo ? (
									<img
										src={user.team.logo}
										alt={user.team.name || 'Team'}
										referrerPolicy='no-referrer'
										crossOrigin='anonymous'
										onError={() => setTeamLogoError(true)}
									/>
								) : (
									<div className='avatar-text'>
										{user.team.name?.[0]?.toUpperCase() || 'T'}
									</div>
								)}
							</div>
							<div className='avatar-team-user'>
								{!avatarError && user.avatar ? (
									<img
										src={user.avatar}
										alt={user.name || 'User'}
										referrerPolicy='no-referrer'
										crossOrigin='anonymous'
										onError={() => setAvatarError(true)}
									/>
								) : (
									<div className='avatar-text-small'>
										{user.name?.[0]?.toUpperCase() || 'U'}
									</div>
								)}
							</div>
						</div>
					) : (
						<div className='avatar-personal'>
							{!avatarError && user.avatar ? (
								<img
									src={user.avatar}
									alt={user.name || 'User'}
									referrerPolicy='no-referrer'
									crossOrigin='anonymous'
									onError={() => setAvatarError(true)}
								/>
							) : (
								<div className='avatar-text'>
									{user.name?.[0]?.toUpperCase() || 'U'}
								</div>
							)}
						</div>
					)}
				</div>

				{/* User Info */}
				<div className='avatar-card-content'>
					<div className='avatar-card-name'>
						{isTeam && user.team?.name ? (
							<>
								<span>{user.name}</span>
								<span className='team-separator'>@</span>
								<span className='team-name'>{user.team.name}</span>
							</>
						) : (
							<span>{user.name}</span>
						)}
					</div>
					<div className='avatar-card-tags'>
						<span className='tag-item'>
							<Icon name={isTeam ? 'material-group' : 'material-person'} size={14} />
							<span>
								{isTeam
									? is_cn
										? '团队账号'
										: 'Team Account'
									: is_cn
									? '个人账号'
									: 'Personal Account'}
							</span>
						</span>
						{user.is_owner && (
							<span className='tag-item'>
								<Icon name='material-star' size={14} />
								<span>{is_cn ? '所有者' : 'Owner'}</span>
							</span>
						)}
						{user.user_type && (
							<span className='tag-item'>
								<Icon name='material-local_offer' size={14} />
								<span>{user.user_type.name || user.type_id}</span>
							</span>
						)}
					</div>
				</div>
			</div>

			{(user.mobile || (isTeam && user.tenant_id)) && (
				<>
					<Divider style={{ margin: '6px 0' }} />
					<div className='avatar-card-info'>
						{user.mobile && (
							<div className='info-item'>
								<span className='label'>{is_cn ? '手机：' : 'Mobile:'}</span>
								<span className='value'>{user.mobile}</span>
							</div>
						)}
						{isTeam && user.tenant_id && (
							<div className='info-item'>
								<span className='label'>{is_cn ? '租户：' : 'Tenant:'}</span>
								<span className='value'>{user.tenant_id}</span>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	)
}

export default Card

