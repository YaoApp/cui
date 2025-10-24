import { TeamInvitation } from '@/openapi/user/types'
import InvitationItem from '../InvitationItem'
import styles from './index.less'

interface InvitationListProps {
	invitations: TeamInvitation[]
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	onCancelInvitation: (invitationId: string) => void
}

const InvitationList = ({ invitations, is_cn, getRoleDisplayName, onCancelInvitation }: InvitationListProps) => {
	if (invitations.length === 0) {
		return null
	}

	return (
		<div className={styles.invitationList}>
			<div className={styles.sectionSeparator}>
				<h5 className={styles.separatorTitle}>{is_cn ? '待处理邀请' : 'Pending Invitations'}</h5>
			</div>
			{invitations.map((invitation) => (
				<InvitationItem
					key={invitation.id}
					invitation={invitation}
					is_cn={is_cn}
					getRoleDisplayName={getRoleDisplayName}
					onCancel={onCancelInvitation}
				/>
			))}
		</div>
	)
}

export default InvitationList
