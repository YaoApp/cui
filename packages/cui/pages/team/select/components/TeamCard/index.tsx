import React from 'react'
import { Avatar, Tooltip } from 'antd'
import { UserTeam } from '@/openapi/user/types'
import styles from './index.less'

export interface TeamCardProps {
	team: UserTeam
	selected: boolean
	roleLabel: string
	ownerLabel: string
	onClick: () => void
}

const TeamCard: React.FC<TeamCardProps> = ({ team, selected, roleLabel, ownerLabel, onClick }) => {
	return (
		<Tooltip
			title={team.description || null}
			placement='top'
			mouseEnterDelay={0.3}
			overlayStyle={{ maxWidth: '400px' }}
		>
			<div className={`${styles.teamCard} ${selected ? styles.teamCardSelected : ''}`} onClick={onClick}>
				{/* Team Logo */}
				<div className={styles.teamLogoWrapper}>
					<Avatar size={40} src={team.logo} className={styles.teamLogo}>
						{!team.logo && (team.display_name || team.name)[0].toUpperCase()}
					</Avatar>
				</div>

				{/* Team Info */}
				<div className={styles.teamInfo}>
					<div className={styles.teamHeader}>
						<h3 className={styles.teamName}>{team.display_name || team.name}</h3>
						{team.is_owner && team.team_id !== 'personal' && (
							<span className={styles.ownerBadge}>{ownerLabel}</span>
						)}
					</div>
					{team.description && <p className={styles.teamDescription}>{team.description}</p>}
				</div>

				{/* Role - Don't show for personal workspace */}
				{team.team_id !== 'personal' && roleLabel && <div className={styles.teamRole}>{roleLabel}</div>}
			</div>
		</Tooltip>
	)
}

export default TeamCard
