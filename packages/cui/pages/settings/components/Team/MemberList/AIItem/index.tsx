import { Modal, Tooltip, message } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import { TeamMember } from '@/openapi/user/types'
import styles from './index.less'

interface AIItemProps {
	member: TeamMember
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	onRemove?: (memberId: string) => void
	onEdit?: (memberId: string) => void
	onAvatarUpdate?: (memberId: string, avatar: string) => Promise<void>
}

const AIItem = ({
	member,
	is_cn,
	getRoleDisplayName,
	onRemove,
	onEdit,
	onAvatarUpdate
}: AIItemProps) => {
	const displayName = member.display_name || (is_cn ? 'AI 助手' : 'AI Assistant')

	const handleRemoveClick = () => {
		if (!onRemove) return

		Modal.confirm({
			title: is_cn ? '确认移除 AI 成员' : 'Confirm Remove AI Member',
			content: is_cn ? `确定要移除 ${displayName} 吗？` : `Are you sure to remove ${displayName}?`,
			okText: is_cn ? '移除' : 'Remove',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: () => onRemove(member.member_id)
		})
	}

	const handleEditClick = () => {
		if (onEdit) {
			onEdit(member.member_id)
		}
	}

	const handleAvatarUploadSuccess = async (avatarWrapper: string, fileId: string) => {
		if (onAvatarUpdate) {
			try {
				// avatarWrapper 是 wrapper 格式，如 __yao.attachment://file123
				await onAvatarUpdate(member.member_id, avatarWrapper)
				message.success(is_cn ? '头像更新成功' : 'Avatar updated successfully')
			} catch (error) {
				console.error('Failed to update avatar:', error)
				message.error(is_cn ? '头像更新失败' : 'Failed to update avatar')
			}
		}
	}

	// AI members use robot_email (globally unique), fallback to email for display
	const robotEmail = member.robot_email || member.email
	const isOwner = member.is_owner === 1 || member.is_owner === true

	return (
		<div className={styles.memberCard}>
			<div className={styles.memberInfo}>
				<div className={styles.memberAvatar}>
					<UserAvatar
						data={{
							id: member.member_id,
							avatar: member.avatar || undefined,
							name: displayName,
							email: robotEmail || undefined,
							bio: member.bio || undefined,
							role_id: member.role_id,
							role_name: getRoleDisplayName(member.role_id),
							is_owner: isOwner,
							member_type: 'robot'
						}}
						size={44}
						displayType='avatar'
						onUploadSuccess={onAvatarUpdate ? handleAvatarUploadSuccess : undefined}
					/>
				</div>
				<div className={styles.memberDetails}>
					<div className={styles.memberName}>
						{displayName}
						{robotEmail && (
							<Tooltip title={robotEmail}>
								<a
									href={`mailto:${robotEmail}`}
									className={styles.emailIcon}
									onClick={(e) => e.stopPropagation()}
								>
									<Icon name='material-email' size={14} />
								</a>
							</Tooltip>
						)}
						<span className={styles.memberRole} data-role={member.role_id}>
							{getRoleDisplayName(member.role_id)}
						</span>
						<span className={styles.aiBadge}>
							<Icon name='material-psychology' size={12} />
							AI
						</span>
					</div>
					<div className={styles.memberBio}>{member.bio || (is_cn ? '无介绍' : 'No bio')}</div>
				</div>
			</div>
			<div className={styles.memberActions}>
				{onEdit && (
					<Tooltip title={is_cn ? '编辑' : 'Edit'}>
						<span className={styles.actionIcon} onClick={handleEditClick}>
							<Icon name='material-edit' size={16} />
						</span>
					</Tooltip>
				)}
				{onRemove && (
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

export default AIItem
