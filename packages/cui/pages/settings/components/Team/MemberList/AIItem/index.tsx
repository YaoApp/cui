import { Modal, Tooltip } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import { TeamMember } from '@/openapi/user/types'
import styles from './index.less'

interface AIItemProps {
	member: TeamMember
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	onRemove: (memberId: string) => void
	onEdit?: (memberId: string) => void
}

const AIItem = ({ member, is_cn, getRoleDisplayName, onRemove, onEdit }: AIItemProps) => {
	const displayName = member.display_name || (is_cn ? 'AI 助手' : 'AI Assistant')

	const handleRemoveClick = () => {
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

	// 构造一个兼容 UserAvatar 的用户对象
	const avatarUser = {
		avatar: member.avatar || undefined,
		name: displayName
	} as any

	// AI members use robot_email (globally unique), fallback to email for display
	const robotEmail = member.robot_email || member.email

	return (
		<div className={styles.memberCard}>
			<div className={styles.memberInfo}>
				<div className={styles.memberAvatar}>
					<UserAvatar user={avatarUser} size={44} forcePersonal={true} />
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
				<Tooltip title={is_cn ? '移除' : 'Remove'}>
					<span className={styles.actionIcon} onClick={handleRemoveClick}>
						<Icon name='material-close' size={16} />
					</span>
				</Tooltip>
			</div>
		</div>
	)
}

export default AIItem
