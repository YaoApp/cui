import { TeamMember } from '@/openapi/user/types'
import UserItem from './UserItem'
import AIItem from './AIItem'
import InviteItem from './InviteItem'
import styles from './index.less'

interface MemberListProps {
	members: TeamMember[]
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	onRemoveMember?: (memberId: string) => void
	onEditAIMember?: (memberId: string) => void
	onResendInvitation?: (invitationId: string) => void
	baseInviteURL?: string
	onAvatarUpdate?: (memberId: string, avatar: string) => Promise<void>
}

const MemberList = ({
	members,
	is_cn,
	getRoleDisplayName,
	onRemoveMember,
	onEditAIMember,
	onResendInvitation,
	baseInviteURL,
	onAvatarUpdate
}: MemberListProps) => {
	const renderMember = (member: TeamMember) => {
		// AI member (check before pending to handle robot invitations correctly)
		if (member.member_type === 'robot') {
			// If robot is pending invitation, still show as InviteItem
			if (member.status === 'pending' && member.invitation_id) {
				return (
					<InviteItem
						key={member.member_id}
						member={member}
						is_cn={is_cn}
						getRoleDisplayName={getRoleDisplayName}
						onRemove={onRemoveMember}
						onResend={onResendInvitation}
						baseInviteURL={baseInviteURL}
					/>
				)
			}
		// Active/inactive robot member
		// TODO: Re-enable onEdit/onRemove for AI members when moved back from Mission Control
		return (
			<AIItem
				key={member.member_id}
				member={member}
				is_cn={is_cn}
				getRoleDisplayName={getRoleDisplayName}
				onAvatarUpdate={onAvatarUpdate}
			/>
		)
		}

		// User pending invitation
		if (member.status === 'pending' && member.invitation_id) {
			return (
				<InviteItem
					key={member.member_id}
					member={member}
					is_cn={is_cn}
					getRoleDisplayName={getRoleDisplayName}
					onRemove={onRemoveMember}
					onResend={onResendInvitation}
					baseInviteURL={baseInviteURL}
				/>
			)
		}

		// User member
		return (
			<UserItem
				key={member.member_id}
				member={member}
				is_cn={is_cn}
				getRoleDisplayName={getRoleDisplayName}
				onRemove={onRemoveMember}
			/>
		)
	}

	return <div className={styles.memberList}>{members.map(renderMember)}</div>
}

export default MemberList
