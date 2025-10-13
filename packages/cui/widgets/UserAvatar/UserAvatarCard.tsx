import { FC, useState } from 'react'
import { Divider } from 'antd'
import { Icon } from '@/widgets'
import type { UserAvatarCardProps } from './types'
import './styles.less'

const UserAvatarCard: FC<UserAvatarCardProps> = ({ user, isTeam, className }) => {
	const [avatarError, setAvatarError] = useState(false)
	const [teamLogoError, setTeamLogoError] = useState(false)

	return (
		<div className={`user-avatar-card ${className || ''}`}>
			<div className='user-avatar-card-header'>
				{/* Large Avatar */}
				<div className='user-avatar-card-avatar'>
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
				<div className='user-avatar-card-content'>
					<div className='user-avatar-card-name'>{user.name}</div>
					<div className='user-avatar-card-badge'>
						{isTeam ? (
							<>
								<Icon name='people-outline' size={14} />
								<span>{user.team?.name}</span>
								{user.is_owner && (
									<span className='owner-badge'>
										<Icon name='star' size={12} />
										Owner
									</span>
								)}
							</>
						) : (
							<>
								<Icon name='person-outline' size={14} />
								<span>Personal Account</span>
							</>
						)}
					</div>
				</div>
			</div>

			{(user.mobile || (isTeam && user.tenant_id)) && (
				<>
					<Divider style={{ margin: '8px 0' }} />
					<div className='user-avatar-card-info'>
						{user.mobile && (
							<div className='info-item'>
								<span className='label'>Mobile:</span>
								<span className='value'>{user.mobile}</span>
							</div>
						)}
						{isTeam && user.tenant_id && (
							<div className='info-item'>
								<span className='label'>Tenant:</span>
								<span className='value'>{user.tenant_id}</span>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	)
}

export default UserAvatarCard
