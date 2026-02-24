import React, { useState } from 'react'
import Icon from '@/widgets/Icon'
import AgentPicker from '@/components/AgentPicker'
import type { PickerItem } from '@/components/AgentPicker/types'
import Tooltip from './Tooltip'
import styles from './AgentTag.less'

interface IAgentTagProps {
	agent: {
		name: string
		avatar?: string
		id?: string
	}
	onSwitchAssistant?: (assistantId: string) => void
}

const AgentTag = ({ agent, onSwitchAssistant }: IAgentTagProps) => {
	const [pickerVisible, setPickerVisible] = useState(false)

	const handleClick = () => {
		if (onSwitchAssistant) {
			setPickerVisible(true)
		} else {
			if (window.$app?.Event) {
				window.$app.Event.emit('app/openSidebar', {
					path: '/assistants'
				})
			}
		}
	}

	const handleConfirm = (selected: PickerItem[]) => {
		if (selected.length > 0 && onSwitchAssistant) {
			onSwitchAssistant(selected[0].value)
		}
	}

	return (
		<>
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

			<AgentPicker
				visible={pickerVisible}
				onClose={() => setPickerVisible(false)}
				onConfirm={handleConfirm}
				type="assistant"
				mode="single"
				value={agent.id ? [{ value: agent.id, label: agent.name }] : []}
			/>
		</>
	)
}

export default AgentTag
