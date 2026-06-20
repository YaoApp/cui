import { useState } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { RadioGroup, Select, CheckboxGroup } from '@/components/ui/inputs'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

type ClockMode = 'once' | 'times' | 'interval' | 'daemon'

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

const DAYS_OPTIONS = [
	{ label: '星期一', value: 'Mon' },
	{ label: '星期二', value: 'Tue' },
	{ label: '星期三', value: 'Wed' },
	{ label: '星期四', value: 'Thu' },
	{ label: '星期五', value: 'Fri' },
	{ label: '星期六', value: 'Sat' },
	{ label: '星期日', value: 'Sun' }
]

const DAYS_OPTIONS_EN = [
	{ label: 'Mon', value: 'Mon' },
	{ label: 'Tue', value: 'Tue' },
	{ label: 'Wed', value: 'Wed' },
	{ label: 'Thu', value: 'Thu' },
	{ label: 'Fri', value: 'Fri' },
	{ label: 'Sat', value: 'Sat' },
	{ label: 'Sun', value: 'Sun' }
]

const MODE_OPTIONS_CN = [
	{ label: '一次性', value: 'once' },
	{ label: '定时', value: 'times' },
	{ label: '间隔', value: 'interval' },
	{ label: '常驻', value: 'daemon' }
]

const MODE_OPTIONS_EN = [
	{ label: 'Once', value: 'once' },
	{ label: 'Scheduled', value: 'times' },
	{ label: 'Interval', value: 'interval' },
	{ label: 'Daemon', value: 'daemon' }
]

const UNIT_OPTIONS_CN = [
	{ label: '分钟', value: 'm' },
	{ label: '小时', value: 'h' },
	{ label: '天', value: 'd' }
]

const UNIT_OPTIONS_EN = [
	{ label: 'minutes', value: 'm' },
	{ label: 'hours', value: 'h' },
	{ label: 'days', value: 'd' }
]

const ScheduleSection = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'

	const [mode, setMode] = useState<ClockMode>('once')
	const [times, setTimes] = useState<string[]>(['09:00'])
	const [days, setDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
	const [intervalValue, setIntervalValue] = useState(30)
	const [intervalUnit, setIntervalUnit] = useState('m')
	const [timezone, setTimezone] = useState('Asia/Shanghai')
	const [saving, setSaving] = useState(false)

	const handleAddTime = () => {
		setTimes([...times, '12:00'])
	}

	const handleRemoveTime = (index: number) => {
		if (times.length <= 1) return
		setTimes(times.filter((_, i) => i !== index))
	}

	const handleTimeChange = (index: number, value: string) => {
		const next = [...times]
		next[index] = value
		setTimes(next)
	}

	const handleSave = async () => {
		setSaving(true)
		await new Promise((r) => setTimeout(r, 500))
		setSaving(false)
		message.success(is_cn ? '保存成功' : 'Saved successfully')
	}

	return (
		<div className={viewStyles.sectionContent}>
			<div className={viewStyles.card}>
				<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
					<div>
						<div className={viewStyles.cardTitle}>{is_cn ? '工作日程' : 'Work Schedule'}</div>
						<div className={viewStyles.cardDesc}>
							{is_cn
								? '配置任务的定时执行策略。'
								: 'Configure the scheduled execution strategy for this task.'}
						</div>
					</div>
					<div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
						<Button size='small' onClick={() => { setMode('once'); setTimes(['09:00']); setDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']); setIntervalValue(30); setIntervalUnit('m'); setTimezone('Asia/Shanghai') }}>
							{is_cn ? '恢复默认' : 'Reset'}
						</Button>
						<Button size='small' type='primary' loading={saving} onClick={handleSave}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
				</div>

				{/* 执行模式 */}
				<>
				<div className={viewStyles.settingRow}>
					<div className={viewStyles.settingHeader}>
						<div className={viewStyles.settingName}>
							{is_cn ? '执行方式' : 'Mode'}
						</div>
					</div>
					<div className={viewStyles.settingControl}>
						<RadioGroup
							schema={{
								type: 'string',
								enum: is_cn ? MODE_OPTIONS_CN : MODE_OPTIONS_EN
							}}
							value={mode}
							onChange={(v) => setMode(v as ClockMode)}
						/>
					</div>
				</div>

				{/* 定时执行：时间 + 星期 */}
				{mode === 'times' && (
					<>
						<div className={viewStyles.settingRow}>
							<div className={viewStyles.settingHeader}>
								<div className={viewStyles.settingName}>
									{is_cn ? '时间' : 'Time'}
								</div>
							</div>
							<div className={viewStyles.settingControl}>
								<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
									{times.map((time, index) => (
										<div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
											<input
												type='time'
												value={time}
												onChange={(e) => handleTimeChange(index, e.target.value)}
												style={{
													height: 32,
													padding: '0 10px',
													border: '1px solid var(--color_neo_border_field, var(--color_border_light))',
													borderRadius: 6,
													background: 'var(--color_neo_bg_field, var(--color_bg_2))',
													color: 'var(--color_neo_text_primary, var(--color_text))',
													fontSize: 13,
													fontFamily: 'monospace',
													outline: 'none'
												}}
											/>
											{times.length > 1 && (
												<span
													onClick={() => handleRemoveTime(index)}
													style={{ cursor: 'pointer', color: 'var(--color_text_grey)', display: 'flex', alignItems: 'center' }}
												>
													<Icon name='material-close' size={14} />
												</span>
											)}
										</div>
									))}
									<div
										onClick={handleAddTime}
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: 4,
											fontSize: 12,
											color: 'var(--color_main)',
											cursor: 'pointer',
											marginTop: 2
										}}
									>
										<Icon name='material-add' size={14} />
										<span>{is_cn ? '添加时间' : 'Add time'}</span>
									</div>
								</div>
							</div>
						</div>

						<div className={viewStyles.settingRow}>
							<div className={viewStyles.settingHeader}>
								<div className={viewStyles.settingName}>
									{is_cn ? '日期' : 'Days'}
								</div>
							</div>
							<div className={viewStyles.settingControl}>
								<CheckboxGroup
									schema={{
										type: 'array',
										enum: is_cn ? DAYS_OPTIONS : DAYS_OPTIONS_EN
									}}
									value={days}
									onChange={(v) => setDays(v as string[])}
								/>
							</div>
						</div>
					</>
				)}

				{/* 间隔执行 */}
				{mode === 'interval' && (
					<div className={viewStyles.settingRow}>
					<div className={viewStyles.settingHeader}>
						<div className={viewStyles.settingName}>
							{is_cn ? '间隔' : 'Interval'}
						</div>
					</div>
						<div className={viewStyles.settingControl}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
								<span style={{ fontSize: 13, color: 'var(--color_neo_text_secondary)', flexShrink: 0, whiteSpace: 'nowrap' }}>
									{is_cn ? '每隔' : 'Every'}
								</span>
								<input
									type='number'
									value={intervalValue}
									min={1}
									onChange={(e) => setIntervalValue(parseInt(e.target.value, 10) || 1)}
									style={{
										width: 70,
										flexShrink: 0,
										height: 32,
										padding: '0 10px',
										border: '1px solid var(--color_neo_border_field, var(--color_border_light))',
										borderRadius: 6,
										background: 'var(--color_neo_bg_field, var(--color_bg_2))',
										color: 'var(--color_neo_text_primary, var(--color_text))',
										fontSize: 13,
										fontFamily: 'monospace',
										outline: 'none',
										textAlign: 'center'
									}}
								/>
								<div style={{ width: 120, flexShrink: 0 }}>
									<Select
										schema={{
											type: 'string',
											enum: is_cn ? UNIT_OPTIONS_CN : UNIT_OPTIONS_EN
										}}
										value={intervalUnit}
										onChange={(v) => setIntervalUnit(v as string)}
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* 持续运行 */}

				{/* 常驻说明 */}
				{mode === 'daemon' && (
					<div className={viewStyles.settingRow}>
						<div className={viewStyles.settingControl}>
							<div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color_neo_bg_field, var(--color_bg_2))', fontSize: 13, color: 'var(--color_neo_text_secondary)' }}>
								<Icon name='material-info' size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
								{is_cn
									? '任务将常驻运行，直到手动停止。适合监控、守护进程类场景。'
									: 'Task runs continuously until manually stopped. Suitable for monitoring and daemon processes.'}
							</div>
						</div>
					</div>
				)}

				{/* 时区 - 仅定时执行时显示 */}
				{mode === 'times' && (
					<div className={viewStyles.settingRow}>
					<div className={viewStyles.settingHeader}>
						<div className={viewStyles.settingName}>
							{is_cn ? '时区' : 'Timezone'}
						</div>
					</div>
						<div className={viewStyles.settingControl}>
							<Select
								schema={{
									type: 'string',
									enum: TIMEZONE_OPTIONS
								}}
								value={timezone}
								onChange={(v) => setTimezone(v as string)}
							/>
						</div>
					</div>
				)}
				</>

			</div>
		</div>
	)
}

export default ScheduleSection
