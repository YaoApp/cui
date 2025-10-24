import { Modal } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { TeamMember } from '@/openapi/user/types'
import styles from './index.less'

interface MemberItemProps {
	member: TeamMember
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	getStatusDisplayName: (status: string) => string
	onRemove: (memberId: string) => void
}

const MemberItem = ({ member, is_cn, getRoleDisplayName, getStatusDisplayName, onRemove }: MemberItemProps) => {
	// 尝试从 user_info 获取用户信息（如果是 TeamMemberDetail）
	const memberDetail = member as any
	const userName = memberDetail.user_info?.name || member.user_id || (is_cn ? '未知用户' : 'Unknown User')
	const userEmail = memberDetail.user_info?.email || ''
	const userAvatar = memberDetail.user_info?.avatar

	const handleRemoveClick = () => {
		Modal.confirm({
			title: is_cn ? '确认移除成员' : 'Confirm Remove Member',
			content: is_cn ? `确定要移除 ${userName} 吗？` : `Are you sure to remove ${userName}?`,
			okText: is_cn ? '移除' : 'Remove',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: () => onRemove(member.id.toString())
		})
	}

	return (
		<div className={styles.memberCard}>
			<div className={styles.memberInfo}>
				<div className={styles.memberAvatar}>
					{userAvatar ? (
						<img src={userAvatar} alt={userName} />
					) : (
						<div className={styles.avatarPlaceholder}>
							{userName?.charAt(0)?.toUpperCase() || 'U'}
						</div>
					)}
				</div>
				<div className={styles.memberDetails}>
					<div className={styles.memberName}>{userName}</div>
					<div className={styles.memberEmail}>{userEmail}</div>
					<div className={styles.memberMeta}>
						<span className={styles.memberRole} data-role={member.role_id}>
							{getRoleDisplayName(member.role_id)}
						</span>
						<span className={styles.memberStatus} data-status={member.status}>
							{getStatusDisplayName(member.status)}
						</span>
						{member.last_activity && (
							<span className={styles.memberLastActive}>
								{is_cn ? '最后活跃：' : 'Last active: '}
								{new Date(member.last_activity).toLocaleDateString()}
							</span>
						)}
					</div>
				</div>
			</div>
			<div className={styles.memberActions}>
				{/* 不允许移除 owner 角色的成员 */}
				{member.role_id !== 'team_owner' && (
					<Button
						type='default'
						size='small'
						className={styles.actionButton}
						onClick={handleRemoveClick}
					>
						{is_cn ? '移除' : 'Remove'}
					</Button>
				)}
			</div>
		</div>
	)
}

export default MemberItem
