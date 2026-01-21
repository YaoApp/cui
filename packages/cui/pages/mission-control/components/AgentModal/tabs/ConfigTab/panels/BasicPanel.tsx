import React from 'react'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../../../types'
import styles from '../index.less'

interface BasicPanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
}

/**
 * BasicPanel - Basic information settings
 * 
 * Fields from `__yao.member`:
 * - display_name: Name
 * - robot_email: Email
 * - role_id: Role
 * - bio: Description
 * - manager_id: Reports To
 * - autonomous_mode: Work Mode
 */
const BasicPanel: React.FC<BasicPanelProps> = ({ robot, formData, onChange, is_cn }) => {
	return (
		<div className={styles.panelSection}>
			<div className={styles.panelTitle}>
				{is_cn ? '基本信息' : 'Basic Information'}
			</div>

			{/* Placeholder - will be replaced with form fields */}
			<div className={styles.placeholder}>
				<Icon name='material-person' size={48} className={styles.placeholderIcon} />
				<div className={styles.placeholderText}>
					{is_cn ? '基本信息' : 'Basic Information'}
				</div>
				<div className={styles.placeholderHint}>
					{is_cn 
						? '姓名、邮箱、角色、简介、直属主管、工作模式'
						: 'Name, Email, Role, Description, Reports To, Work Mode'}
				</div>
			</div>

			{/* TODO: Implement form fields
			
			Fields:
			- Name (display_name) - Input, required
			- Email (robot_email) - Input with domain select, required
			- Role (role_id) - Select from __yao.role
			- Description (bio) - TextArea
			- Reports To (manager_id) - Select from team members
			- Work Mode (autonomous_mode) - RadioGroup: On Demand / Scheduled
			
			*/}
		</div>
	)
}

export default BasicPanel
