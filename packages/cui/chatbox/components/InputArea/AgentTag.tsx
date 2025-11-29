import React from 'react'
import Icon from '@/widgets/Icon'
import Tooltip from './Tooltip'
import styles from './AgentTag.less'

interface IAgentTagProps {
	agent: {
		name: string
		avatar?: string
		id?: string
	}
}

const AgentTag = ({ agent }: IAgentTagProps) => {
	const handleClick = () => {
		// Open assistants page in sidebar
		if (window.$app?.Event) {
			window.$app.Event.emit('app/openSidebar', {
				path: '/assistants'
			})
		}
	}

	return (
		<Tooltip content={agent.name} placement="top">
			<div className={styles.tag} onClick={handleClick}>
				<div className={styles.avatar}>
					{agent.avatar && agent.avatar.length > 2 ? (
						<img src={agent.avatar} alt={agent.name} />
					) : (
						agent.avatar || agent.name[0]
					)}
				</div>
				<span className={styles.name}>{agent.name}</span>
				<Icon name="material-swap_horiz" size={14} className={styles.switchIcon} />
			</div>
		</Tooltip>
	)
}

export default AgentTag
