import React, { useState, useEffect } from 'react'
import { Tooltip } from 'antd'
import { Select, Input, RadioGroup, CheckboxGroup } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import type { RobotState, ClockMode } from '../../../../../types'
import styles from '../index.less'

interface SchedulePanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
	configData?: any
}

// Days of week options
const DAYS_OPTIONS = [
	{ label: 'Mon', value: 'Mon' },
	{ label: 'Tue', value: 'Tue' },
	{ label: 'Wed', value: 'Wed' },
	{ label: 'Thu', value: 'Thu' },
	{ label: 'Fri', value: 'Fri' },
	{ label: 'Sat', value: 'Sat' },
	{ label: 'Sun', value: 'Sun' }
]

// Interval unit options
const INTERVAL_UNITS = [
	{ label: 'minutes', value: 'm' },
	{ label: 'hours', value: 'h' },
	{ label: 'days', value: 'd' }
]

// Common timezone options
const TIMEZONE_OPTIONS = [
	{ label: 'Asia/Shanghai (UTC+8)', value: 'Asia/Shanghai' },
	{ label: 'Asia/Tokyo (UTC+9)', value: 'Asia/Tokyo' },
	{ label: 'Asia/Singapore (UTC+8)', value: 'Asia/Singapore' },
	{ label: 'America/New_York (UTC-5)', value: 'America/New_York' },
	{ label: 'America/Los_Angeles (UTC-8)', value: 'America/Los_Angeles' },
	{ label: 'Europe/London (UTC+0)', value: 'Europe/London' },
	{ label: 'Europe/Paris (UTC+1)', value: 'Europe/Paris' },
	{ label: 'UTC', value: 'UTC' }
]

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
	// Local state for interval parsing
	const [intervalValue, setIntervalValue] = useState<number>(30)
	const [intervalUnit, setIntervalUnit] = useState<string>('m')

	// Get current clock mode
	const clockMode: ClockMode = formData['clock.mode'] || 'times'

	// Get current times list
	const times: string[] = formData['clock.times'] || ['09:00']

	// Parse interval when formData changes
	useEffect(() => {
		const every = formData['clock.every'] || '30m'
		const match = every.match(/^(\d+)([mhd])$/)
		if (match) {
			setIntervalValue(parseInt(match[1], 10))
			setIntervalUnit(match[2])
		}
	}, [formData['clock.every']])

	// Handle field change
	const handleFieldChange = (field: string, value: any) => {
		onChange(field, value)
	}

	// Handle clock mode change
	const handleModeChange = (value: any) => {
		handleFieldChange('clock.mode', value)
	}

	// Handle time add
	const handleAddTime = () => {
		const newTimes = [...times, '12:00']
		handleFieldChange('clock.times', newTimes)
	}

	// Handle time remove
	const handleRemoveTime = (index: number) => {
		if (times.length <= 1) return // Keep at least one
		const newTimes = times.filter((_, i) => i !== index)
		handleFieldChange('clock.times', newTimes)
	}

	// Handle time change
	const handleTimeChange = (index: number, value: string) => {
		const newTimes = [...times]
		newTimes[index] = value
		handleFieldChange('clock.times', newTimes)
	}

	// Handle interval change
	const handleIntervalChange = (value: number, unit: string) => {
		setIntervalValue(value)
		setIntervalUnit(unit)
		handleFieldChange('clock.every', `${value}${unit}`)
	}

	return (
		<div className={styles.panelInner}>
			<div className={styles.panelTitle}>
				{is_cn ? '工作日程' : 'Work Schedule'}
			</div>

			{/* Schedule Mode */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					{is_cn ? '执行方式' : 'When to run?'}
				</label>

				{/* Mode: At Specific Times */}
				<div 
					className={`${styles.scheduleOption} ${clockMode === 'times' ? styles.scheduleOptionActive : ''}`}
					onClick={() => handleModeChange('times')}
				>
					<div className={styles.scheduleOptionHeader}>
						<div className={styles.radioCircle}>
							{clockMode === 'times' && <div className={styles.radioDot} />}
						</div>
						<div className={styles.scheduleOptionTitle}>
							{is_cn ? '定时执行' : 'At Specific Times'}
						</div>
					</div>
					
					{clockMode === 'times' && (
						<div className={styles.scheduleOptionContent}>
							{/* Times list */}
							<div className={styles.timesRow}>
								<span className={styles.timesLabel}>{is_cn ? '时间' : 'At'}</span>
								<div className={styles.timesList}>
									{times.map((time, index) => (
										<div key={index} className={styles.timeItem}>
											<input
												type="time"
												value={time}
												onChange={(e) => handleTimeChange(index, e.target.value)}
												className={styles.timeInput}
											/>
											{times.length > 1 && (
												<div
													className={styles.timeRemove}
													onClick={(e) => {
														e.stopPropagation()
														handleRemoveTime(index)
													}}
												>
													<Icon name='material-close' size={12} />
												</div>
											)}
										</div>
									))}
									<div className={styles.addTimeButton} onClick={(e) => {
										e.stopPropagation()
										handleAddTime()
									}}>
										<Icon name='material-add' size={14} />
									</div>
								</div>
							</div>

							{/* Days selection */}
							<div className={styles.daysRow}>
								<span className={styles.timesLabel}>{is_cn ? '日期' : 'On'}</span>
								<div className={styles.daysGroup}>
									{DAYS_OPTIONS.map(day => {
										const days = formData['clock.days'] || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
										const isSelected = days.includes(day.value)
										return (
											<div
												key={day.value}
												className={`${styles.dayChip} ${isSelected ? styles.dayChipActive : ''}`}
												onClick={(e) => {
													e.stopPropagation()
													const newDays = isSelected
														? days.filter((d: string) => d !== day.value)
														: [...days, day.value]
													handleFieldChange('clock.days', newDays)
												}}
											>
												{is_cn ? {
													'Mon': '一',
													'Tue': '二', 
													'Wed': '三',
													'Thu': '四',
													'Fri': '五',
													'Sat': '六',
													'Sun': '日'
												}[day.value] : day.label}
											</div>
										)
									})}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Mode: At Regular Intervals */}
				<div 
					className={`${styles.scheduleOption} ${clockMode === 'interval' ? styles.scheduleOptionActive : ''}`}
					onClick={() => handleModeChange('interval')}
				>
					<div className={styles.scheduleOptionHeader}>
						<div className={styles.radioCircle}>
							{clockMode === 'interval' && <div className={styles.radioDot} />}
						</div>
						<div className={styles.scheduleOptionTitle}>
							{is_cn ? '间隔执行' : 'At Regular Intervals'}
						</div>
					</div>
					
					{clockMode === 'interval' && (
						<div className={styles.scheduleOptionContent}>
							<div className={styles.intervalRow}>
								<span className={styles.timesLabel}>{is_cn ? '每隔' : 'Every'}</span>
								<input
									type="number"
									value={intervalValue}
									onChange={(e) => handleIntervalChange(parseInt(e.target.value, 10) || 1, intervalUnit)}
									className={styles.intervalInput}
									min={1}
									onClick={(e) => e.stopPropagation()}
								/>
								<select
									value={intervalUnit}
									onChange={(e) => handleIntervalChange(intervalValue, e.target.value)}
									className={styles.intervalSelect}
									onClick={(e) => e.stopPropagation()}
								>
									<option value="m">{is_cn ? '分钟' : 'minutes'}</option>
									<option value="h">{is_cn ? '小时' : 'hours'}</option>
									<option value="d">{is_cn ? '天' : 'days'}</option>
								</select>
							</div>
						</div>
					)}
				</div>

				{/* Mode: Continuous (Daemon) */}
				<div 
					className={`${styles.scheduleOption} ${clockMode === 'daemon' ? styles.scheduleOptionActive : ''}`}
					onClick={() => handleModeChange('daemon')}
				>
					<div className={styles.scheduleOptionHeader}>
						<div className={styles.radioCircle}>
							{clockMode === 'daemon' && <div className={styles.radioDot} />}
						</div>
						<div className={styles.scheduleOptionTitle}>
							{is_cn ? '持续运行' : 'Continuous'}
						</div>
					</div>
					
					{clockMode === 'daemon' && (
						<div className={styles.scheduleOptionContent}>
							<div className={styles.daemonHint}>
								{is_cn 
									? '智能体将持续运行，直到手动停止' 
									: 'Agent runs non-stop until manually stopped'
								}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Timezone */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					{is_cn ? '时区' : 'Timezone'}
				</label>
				<Select
					value={formData['clock.tz'] || 'Asia/Shanghai'}
					onChange={(value) => handleFieldChange('clock.tz', value)}
					schema={{
						type: 'string',
						enum: TIMEZONE_OPTIONS,
						placeholder: is_cn ? '选择时区' : 'Select timezone'
					}}
				/>
			</div>

			{/* Note about delivery */}
			<div className={styles.scheduleNote}>
				<Icon name='material-info' size={14} />
				<span>
					{is_cn 
						? '执行结果默认发送给直属主管。如需添加其他收件人，请在「高级配置」中设置。'
						: 'Results are sent to your manager by default. Configure additional recipients in Advanced settings.'
					}
				</span>
			</div>
		</div>
	)
}

export default SchedulePanel
