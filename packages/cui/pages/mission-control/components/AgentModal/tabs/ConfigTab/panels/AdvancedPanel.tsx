import React from 'react'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../../../types'
import styles from '../index.less'

interface AdvancedPanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
}

/**
 * AdvancedPanel - Advanced settings (rarely changed)
 * 
 * Sections:
 * 1. Delivery - Additional email recipients, webhook, process
 * 2. Phase Agents - Customize AI for each execution phase (P0-P5)
 * 3. Concurrency - Max concurrent, queue size, priority, timeout
 * 4. Testing - Dry run mode
 * 5. Learning - Learn from experience settings
 * 6. Triggers - Ad-hoc tasks, event triggers
 */
const AdvancedPanel: React.FC<AdvancedPanelProps> = ({ robot, formData, onChange, is_cn }) => {
	return (
		<div className={styles.panelSection}>
			<div className={styles.panelTitle}>
				{is_cn ? '高级配置' : 'Advanced Settings'}
			</div>

			{/* Placeholder - will be replaced with form fields */}
			<div className={styles.placeholder}>
				<Icon name='material-tune' size={48} className={styles.placeholderIcon} />
				<div className={styles.placeholderText}>
					{is_cn ? '高级配置' : 'Advanced Settings'}
				</div>
				<div className={styles.placeholderHint}>
					{is_cn 
						? '交付选项、阶段智能体、并发控制、测试模式、学习设置、触发器'
						: 'Delivery, Phase Agents, Concurrency, Testing, Learning, Triggers'}
				</div>
			</div>

			{/* TODO: Implement form fields
			
			=== Delivery Section ===
			Fields from robot_config.delivery:
			- Additional Recipients (delivery.email.targets) - Email list with add/remove
			- Webhook (delivery.webhook.enabled + delivery.webhook.targets) - Switch + URL input
			- Process (delivery.process.enabled + delivery.process.targets) - Switch + Process select
			
			=== Phase Agents Section ===
			Fields from robot_config.resources.phases:
			- Inspiration Agent (resources.phases.inspiration) - Select, default: __yao.inspiration
			- Goals Agent (resources.phases.goals) - Select, default: __yao.goals
			- Tasks Agent (resources.phases.tasks) - Select, default: __yao.tasks
			- Run Agent (resources.phases.run) - Select, default: __yao.run
			- Delivery Agent (resources.phases.delivery) - Select, default: __yao.delivery
			- Learning Agent (resources.phases.learning) - Select, default: __yao.learning
			
			=== Concurrency Section ===
			Fields from robot_config.quota:
			- Max Concurrent (quota.max) - InputNumber, default: 2
			- Max Queue (quota.queue) - InputNumber, default: 10
			- Priority (quota.priority) - InputNumber 1-10, default: 5
			- Timeout (clock.timeout) - InputNumber in minutes
			
			=== Testing Section ===
			Fields from robot_config.executor:
			- Dry Run Mode (executor.mode) - Switch for "dryrun"
			
			=== Learning Section ===
			Fields from robot_config.learn:
			- Learn from Experience (learn.on) - Switch
			- Learn Types (learn.types) - CheckboxGroup: execution, feedback, insight
			- Keep For (learn.keep) - InputNumber in days, 0 = forever
			
			=== Triggers Section ===
			Fields from robot_config.triggers:
			- Accept Ad-hoc Tasks (triggers.intervene.enabled) - Switch
			- Trigger on Events (triggers.event.enabled) - Switch
			
			*/}
		</div>
	)
}

export default AdvancedPanel
