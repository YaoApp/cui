import React from 'react'
import styles from './AgentTag.less'

interface IAgentTagProps {
	agent: {
		name: string
		avatar?: string
		id?: string
	}
}

const AgentTag = ({ agent }: IAgentTagProps) => {
	return (
		<div className={styles.tag}>
			<div className={styles.avatar}>
				{agent.avatar && agent.avatar.length > 2 ? (
					<img src={agent.avatar} alt={agent.name} />
				) : (
					agent.avatar || agent.name[0]
				)}
			</div>
			<span>{agent.name}</span>
		</div>
	)
}

export default AgentTag
