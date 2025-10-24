import { TeamMember } from '@/openapi/user/types'
import MemberItem from '../MemberItem'
import styles from './index.less'

interface MemberListProps {
	members: TeamMember[]
	is_cn: boolean
	getRoleDisplayName: (roleId: string) => string
	getStatusDisplayName: (status: string) => string
	onRemoveMember: (memberId: string) => void
}

const MemberList = ({ members, is_cn, getRoleDisplayName, getStatusDisplayName, onRemoveMember }: MemberListProps) => {
	return (
		<div className={styles.memberList}>
			{members.map((member) => (
				<MemberItem
					key={member.id}
					member={member}
					is_cn={is_cn}
					getRoleDisplayName={getRoleDisplayName}
					getStatusDisplayName={getStatusDisplayName}
					onRemove={onRemoveMember}
				/>
			))}
		</div>
	)
}

export default MemberList
