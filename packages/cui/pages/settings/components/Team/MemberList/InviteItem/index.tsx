import { Modal, message, Tooltip } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { TeamMember } from '@/openapi/user/types'
import styles from './index.less'

interface InviteItemProps {
	member: TeamMember
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	onRemove?: (memberId: string) => void
	onResend?: (invitationId: string) => void
	baseInviteURL?: string
}

const InviteItem = ({ member, is_cn, getRoleDisplayName, onRemove, onResend, baseInviteURL }: InviteItemProps) => {
	const hasEmail = !!member.email
	// 优先使用后端返回的完整邀请链接，如果不存在则手动拼接
	const invitationLink =
		member.invitation_link ||
		(member.invitation_token && baseInviteURL
			? `${baseInviteURL}/${member.invitation_id}?token=${member.invitation_token}`
			: '')
	const isExpired = member.invitation_expires_at && new Date(member.invitation_expires_at) < new Date()
	const displayText = hasEmail ? member.email : is_cn ? '通用邀请链接' : 'Invite Link'

	// 计算距离过期的时间
	const getExpiryInfo = () => {
		if (!member.invitation_expires_at) return null

		const expiryDate = new Date(member.invitation_expires_at)
		const now = new Date()
		const diffMs = expiryDate.getTime() - now.getTime()
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

		if (diffMs < 0) {
			// 已过期
			return is_cn ? '已过期' : 'Expired'
		} else if (diffDays === 0) {
			// 今天过期
			return is_cn ? '今天过期' : 'Expires today'
		} else if (diffDays === 1) {
			// 明天过期
			return is_cn ? '明天过期' : 'Expires tomorrow'
		} else if (diffDays <= 7) {
			// X天后过期
			return is_cn ? `${diffDays}天后过期` : `Expires in ${diffDays} days`
		} else {
			// 显示具体日期
			return is_cn ? `${expiryDate.toLocaleDateString()}过期` : `Expires ${expiryDate.toLocaleDateString()}`
		}
	}

	const expiryInfo = getExpiryInfo()

	const handleRemoveClick = () => {
		if (!onRemove) return

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
			Modal.confirm({
				title: is_cn ? '确认重发邀请' : 'Confirm Resend Invitation',
				content: is_cn
					? `确定要重新发送邀请邮件给 ${displayText} 吗？`
					: `Are you sure to resend the invitation email to ${displayText}?`,
				okText: is_cn ? '重发' : 'Resend',
				cancelText: is_cn ? '取消' : 'Cancel',
				onOk: () => onResend(member.invitation_id!)
			})
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
						{hasEmail ? (
							<>
								{is_cn ? '邀请 ' : 'Invite '}
								<span className={styles.emailText}>{member.email}</span>
							</>
						) : (
							<>{is_cn ? '邀请链接' : 'Invite Link'}</>
						)}
						<span className={styles.memberRole} data-role={member.role_id}>
							{getRoleDisplayName(member.role_id)}
						</span>
					</div>
					<div className={styles.memberMeta}>
						<span className={styles.memberStatus} data-status='pending'>
							{is_cn ? '待接受' : 'Pending'}
						</span>
						{expiryInfo && (
							<>
								<span className={styles.metaSeparator}>•</span>
								<span className={isExpired ? styles.expiredInfo : styles.expiryInfo}>
									<Icon name='material-schedule' size={12} />
									{expiryInfo}
								</span>
							</>
						)}
					</div>
				</div>
			</div>
			<div className={styles.memberActions}>
				{!isExpired && hasEmail && onResend && (
					<Tooltip title={is_cn ? '重发邀请' : 'Resend invitation'}>
						<span className={styles.actionIcon} onClick={handleResendClick}>
							<Icon name='material-send' size={16} />
						</span>
					</Tooltip>
				)}
			{!isExpired && invitationLink && (
				<Tooltip title={is_cn ? '复制链接' : 'Copy link'}>
					<span className={styles.actionIcon} onClick={handleCopyClick}>
						<Icon name='material-content_copy' size={16} />
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

export default InviteItem
