import { Modal, message, Tooltip } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { TeamMember } from '@/openapi/user/types'
import styles from './index.less'

interface InviteItemProps {
	member: TeamMember
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	onRemove: (memberId: string) => void
	onResend?: (invitationId: string) => void
	baseInviteURL?: string
}

const InviteItem = ({ member, is_cn, getRoleDisplayName, onRemove, onResend, baseInviteURL }: InviteItemProps) => {
	const hasEmail = !!member.email
	const invitationLink =
		member.invitation_token && baseInviteURL
			? `${baseInviteURL}/${member.invitation_id}?token=${member.invitation_token}`
			: ''
	const isExpired = member.invitation_expires_at && new Date(member.invitation_expires_at) < new Date()
	const displayText = hasEmail ? member.email : is_cn ? '通用邀请链接' : 'Invite Link'

	const handleRemoveClick = () => {
		Modal.confirm({
			title: is_cn ? '确认移除邀请' : 'Confirm Remove Invitation',
			content: is_cn
				? `确定要移除对 ${displayText} 的邀请吗？`
				: `Are you sure to remove the invitation for ${displayText}?`,
			okText: is_cn ? '移除' : 'Remove',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: () => onRemove(member.member_id)
		})
	}

	const handleResendClick = () => {
		if (onResend && member.invitation_id) {
			onResend(member.invitation_id)
		}
	}

	const handleCopyClick = () => {
		if (invitationLink) {
			navigator.clipboard.writeText(invitationLink).then(() => {
				message.success(is_cn ? '邀请链接已复制' : 'Invitation link copied')
			})
		}
	}

	return (
		<div className={`${styles.memberCard} ${isExpired ? styles.expired : ''}`}>
			<div className={styles.memberInfo}>
				<div className={styles.memberAvatar}>
					<Icon name={hasEmail ? 'material-email' : 'material-link'} size={20} />
				</div>
				<div className={styles.memberDetails}>
					<div className={styles.memberName}>
						{is_cn ? '邀请链接' : 'Invite Link'}
						{hasEmail && (
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
							{getRoleDisplayName(member.role_id)}
						</span>
						{isExpired && (
							<span className={styles.expiredBadge}>
								<Icon name='material-schedule' size={12} />
								{is_cn ? '已过期' : 'Expired'}
							</span>
						)}
					</div>
					<div className={styles.memberMeta}>
						<span className={styles.memberStatus} data-status='pending'>
							{is_cn ? '待接受' : 'Pending'}
						</span>
						{member.invited_at && (
							<span className={styles.memberInvitedAt}>
								{is_cn ? '邀请于：' : 'Invited: '}
								{new Date(member.invited_at).toLocaleDateString()}
							</span>
						)}
					</div>
				</div>
			</div>
			<div className={styles.memberActions}>
				{hasEmail && onResend && (
					<Tooltip title={is_cn ? '重发邀请' : 'Resend invitation'}>
						<span className={styles.actionIcon} onClick={handleResendClick}>
							<Icon name='material-send' size={16} />
						</span>
					</Tooltip>
				)}
				{invitationLink && (
					<Tooltip title={is_cn ? '复制链接' : 'Copy link'}>
						<span className={styles.actionIcon} onClick={handleCopyClick}>
							<Icon name='material-content_copy' size={16} />
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

export default InviteItem
