import React from 'react'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../../../types'
import styles from '../index.less'

interface SchedulePanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
}

/**
 * SchedulePanel - Schedule/clock settings (only visible when autonomous_mode is true)
 * 
 * Fields from `robot_config.clock`:
 * - mode: Clock mode (times/interval/daemon)
 * - times: Specific times (when mode=times)
 * - days: Days of week (when mode=times)
 * - every: Interval duration (when mode=interval)
 * - tz: Timezone
 */
const SchedulePanel: React.FC<SchedulePanelProps> = ({ robot, formData, onChange, is_cn }) => {
	return (
		<div className={styles.panelSection}>
			<div className={styles.panelTitle}>
				{is_cn ? '工作日程' : 'Work Schedule'}
			</div>

			{/* Placeholder - will be replaced with form fields */}
			<div className={styles.placeholder}>
				<Icon name='material-schedule' size={48} className={styles.placeholderIcon} />
				<div className={styles.placeholderText}>
					{is_cn ? '工作日程' : 'Work Schedule'}
				</div>
				<div className={styles.placeholderHint}>
					{is_cn 
						? '配置智能体的自动执行时间：定时、间隔或常驻模式'
						: 'Configure when the agent runs: specific times, intervals, or continuous'}
				</div>
			</div>

			{/* TODO: Implement form fields
			
			Fields:
			- Schedule Mode (clock.mode) - RadioGroup: At Specific Times / Every Interval / Always Running
			
			When mode = "times":
			- Run At (clock.times) - TimePicker list
			- Run On (clock.days) - CheckboxGroup: Mon/Tue/Wed/Thu/Fri/Sat/Sun or Every Day
			
			When mode = "interval":
			- Run Every (clock.every) - Input with duration (e.g., "30m", "1h", "2h")
			
			Common:
			- Timezone (clock.tz) - Select from common timezones
			
			Note: Results are sent to manager by default (advanced delivery options in Advanced panel)
			
			*/}
		</div>
	)
}

export default SchedulePanel
