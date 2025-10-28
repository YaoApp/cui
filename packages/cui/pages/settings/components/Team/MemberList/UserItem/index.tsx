import { Modal, Tooltip } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import { TeamMember } from '@/openapi/user/types'
import styles from './index.less'

interface UserItemProps {
	member: TeamMember
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	onRemove: (memberId: string) => void
}

const UserItem = ({ member, is_cn, getRoleDisplayName, onRemove }: UserItemProps) => {
	const displayName = member.display_name || member.user_id || (is_cn ? '未知用户' : 'Unknown User')
	const isOwner = member.is_owner === 1 || member.is_owner === true

	const handleRemoveClick = () => {
		Modal.confirm({
			title: is_cn ? '确认移除成员' : 'Confirm Remove Member',
			content: is_cn ? `确定要移除 ${displayName} 吗？` : `Are you sure to remove ${displayName}?`,
			okText: is_cn ? '移除' : 'Remove',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: () => onRemove(member.member_id)
		})
	}

	return (
		<div className={styles.memberCard}>
			<div className={styles.memberInfo}>
				<div className={styles.memberAvatar}>
					<UserAvatar
						data={{
							id: member.member_id,
							avatar: member.avatar || undefined,
							name: displayName,
							email: member.email || undefined,
							bio: member.bio || undefined,
							role_id: member.role_id,
							role_name: getRoleDisplayName(member.role_id),
							is_owner: isOwner,
							member_type: 'user'
						}}
						size={44}
						displayType='avatar'
					/>
				</div>
				<div className={styles.memberDetails}>
					<div className={styles.memberName}>
						{displayName}
						{member.email && (
							<Tooltip title={member.email}>
								<a
									href={`mailto:${member.email}`}
									className={styles.emailIcon}
									onClick={(e) => e.stopPropagation()}
								>
									<Icon name='material-email' size={14} />
								</a>
							</Tooltip>
						)}
						<span className={styles.memberRole} data-role={member.role_id}>
							{isOwner ? (is_cn ? '所有者' : 'Owner') : getRoleDisplayName(member.role_id)}
						</span>
					</div>
					<div className={styles.memberBio}>{member.bio || (is_cn ? '无介绍' : 'No bio')}</div>
				</div>
			</div>
			<div className={styles.memberActions}>
				{!isOwner && (
					<Tooltip title={is_cn ? '移除' : 'Remove'}>
						<span className={styles.actionIcon} onClick={handleRemoveClick}>
							<Icon name='material-close' size={16} />
						</span>
					</Tooltip>
				)}
			</div>
		</div>
	)
}

export default UserItem
