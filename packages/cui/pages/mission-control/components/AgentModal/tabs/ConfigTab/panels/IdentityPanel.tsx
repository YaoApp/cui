import React from 'react'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../../../types'
import styles from '../index.less'

interface IdentityPanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
}

/**
 * IdentityPanel - Identity and resources settings
 * 
 * Fields from `__yao.member`:
 * - system_prompt: Role & Responsibilities
 * - language_model: AI Model
 * - cost_limit: Monthly Budget
 * - agents: Accessible AI Assistants
 * - mcp_servers: Accessible Tools
 * 
 * Fields from `robot_config`:
 * - kb.collections: Accessible Knowledge
 * - db.models: Accessible Data
 */
const IdentityPanel: React.FC<IdentityPanelProps> = ({ robot, formData, onChange, is_cn }) => {
	return (
		<div className={styles.panelSection}>
			<div className={styles.panelTitle}>
				{is_cn ? '身份设定' : 'Identity & Resources'}
			</div>

			{/* Placeholder - will be replaced with form fields */}
			<div className={styles.placeholder}>
				<Icon name='material-badge' size={48} className={styles.placeholderIcon} />
				<div className={styles.placeholderText}>
					{is_cn ? '身份设定' : 'Identity & Resources'}
				</div>
				<div className={styles.placeholderHint}>
					{is_cn 
						? '职责说明、AI模型、月度预算、可协作智能体、工具、知识库、数据'
						: 'Role & Responsibilities, AI Model, Budget, Agents, Tools, Knowledge, Data'}
				</div>
			</div>

			{/* TODO: Implement form fields
			
			Fields:
			- Role & Responsibilities (system_prompt) - TextArea with AI generate button, required
			- AI Model (language_model) - Select from LLM providers
			- Monthly Budget (cost_limit) - InputNumber with USD/month
			- Accessible AI Assistants (agents) - CheckboxGroup from Agent API
			- Accessible Tools (mcp_servers) - CheckboxGroup from MCP API
			- Accessible Knowledge (robot_config.kb.collections) - CheckboxGroup from KB API
			- Accessible Data (robot_config.db.models) - CheckboxGroup from DB models
			
			*/}
		</div>
	)
}

export default IdentityPanel
