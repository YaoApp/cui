import { Modal } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { TeamInvitation } from '@/openapi/user/types'
import styles from './index.less'

interface InvitationItemProps {
	invitation: TeamInvitation
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	onCancel: (invitationId: string) => void
}

const InvitationItem = ({ invitation, is_cn, getRoleDisplayName, onCancel }: InvitationItemProps) => {
	// 尝试从 user_info 获取用户信息（如果是 TeamInvitationDetail）
	const invitationDetail = invitation as any
	const displayText = invitationDetail.user_info?.email || invitationDetail.user_info?.name || invitation.user_id

	const handleCancelClick = () => {
		Modal.confirm({
			title: is_cn ? '确认取消邀请' : 'Confirm Cancel Invitation',
			content: is_cn
				? `确定要取消对 ${displayText} 的邀请吗？`
				: `Are you sure to cancel the invitation to ${displayText}?`,
			okText: is_cn ? '取消邀请' : 'Cancel Invitation',
			cancelText: is_cn ? '保留' : 'Keep',
			okType: 'danger',
			onOk: () => onCancel(invitation.id.toString())
		})
	}

	return (
		<div className={styles.invitationCard}>
			<div className={styles.invitationInfo}>
				<div className={styles.invitationAvatar}>
					<Icon name='material-mail_outline' size={20} />
				</div>
				<div className={styles.invitationDetails}>
					<div className={styles.invitationEmail}>{displayText}</div>
					<div className={styles.invitationMeta}>
						<span className={styles.invitationRole}>
							{getRoleDisplayName(invitation.role_id)}
						</span>
						<span>
							{is_cn ? '邀请人：' : 'Invited by: '}
							{invitation.invited_by}
						</span>
						{invitation.invitation_expires_at && (
							<span>
								{is_cn ? '过期时间：' : 'Expires: '}
								{new Date(invitation.invitation_expires_at).toLocaleDateString()}
							</span>
						)}
					</div>
				</div>
			</div>
			<div className={styles.invitationActions}>
				<Button type='default' size='small' className={styles.actionButton} onClick={handleCancelClick}>
					{is_cn ? '取消' : 'Cancel'}
				</Button>
			</div>
		</div>
	)
}

export default InvitationItem
