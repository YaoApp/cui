import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import { RadioGroup, Select, CheckboxGroup } from '@/components/ui/inputs'
import type { ScheduleConfig } from '@/openapi/agent/tasks'
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
	{ label: '间隔', value: 'interval' }
]

const MODE_OPTIONS_EN = [
	{ label: 'Once', value: 'once' },
	{ label: 'Scheduled', value: 'times' },
	{ label: 'Interval', value: 'interval' }
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

interface Props {
	task: KanbanTask
	taskId: string
}

interface LogEntry {
	triggered_at: string
}

const ScheduleSection = ({ task, taskId }: Props) => {
	const is_cn = getLocale() === 'zh-CN'

	const [mode, setMode] = useState<ClockMode>('once')
	const [times, setTimes] = useState<string[]>(['09:00'])
	const [days, setDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
	const [intervalValue, setIntervalValue] = useState(30)
	const [intervalUnit, setIntervalUnit] = useState('m')
	const [timezone, setTimezone] = useState('Asia/Shanghai')
	const [saving, setSaving] = useState(false)
	const [loaded, setLoaded] = useState(false)

	const [logs, setLogs] = useState<LogEntry[]>([])
	const [logsTotal, setLogsTotal] = useState(0)
	const [logsPage, setLogsPage] = useState(1)
	const logsPageSize = 10

	const [instrEditing, setInstrEditing] = useState(false)
	const [instrPrompt, setInstrPrompt] = useState('')
	const [instrLocale, setInstrLocale] = useState('zh-cn')
	const [instrSaving, setInstrSaving] = useState(false)
	const [instrLocal, setInstrLocal] = useState(task.instruction)
	useEffect(() => { setInstrLocal(task.instruction) }, [task.instruction])

	useEffect(() => {
		if (!taskId || loaded) return
		const api = window.$app?.openapi
		if (!api) return
		api.Get<{ schedule: ScheduleConfig | null }>(`/agent/tasks/${taskId}/schedule`).then((res: any) => {
			if (api.IsError(res)) return
			const sched = res.data?.schedule
			if (!sched) return
			if (sched.mode) setMode(sched.mode as ClockMode)
			if (sched.times?.length) setTimes(sched.times)
			if (sched.days?.length) setDays(sched.days)
			if (sched.interval_value) setIntervalValue(sched.interval_value)
			if (sched.interval_unit) setIntervalUnit(sched.interval_unit)
			if (sched.timezone) setTimezone(sched.timezone)
		}).finally(() => setLoaded(true))
	}, [taskId])

	const fetchLogs = (page: number) => {
		const api = window.$app?.openapi
		if (!api || !taskId) return
		api.Get<{ logs: LogEntry[]; total: number }>(`/agent/tasks/${taskId}/schedule/logs?page=${page}&page_size=${logsPageSize}`).then((res: any) => {
			if (api.IsError(res)) {
				console.warn('[ScheduleSection] fetchLogs error:', res.error)
				return
			}
			setLogs(res.data?.logs || [])
			setLogsTotal(res.data?.total || 0)
			setLogsPage(page)
		}).catch((err: any) => {
			console.warn('[ScheduleSection] fetchLogs network error:', err)
		})
	}

	useEffect(() => {
		if (!taskId) return
		fetchLogs(1)
	}, [taskId])

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

	const saveSchedule = async (schedule: ScheduleConfig) => {
		const api = window.$app?.openapi
		if (!api) throw new Error('OpenAPI not initialized')
		const res = await api.Put(`/agent/tasks/${taskId}/schedule`, schedule)
		if (api.IsError(res)) throw new Error('save failed')
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			await saveSchedule({
				enabled: true,
				mode,
				times: mode === 'times' ? times : undefined,
				days: mode === 'times' ? days : undefined,
				interval_value: mode === 'interval' ? intervalValue : undefined,
				interval_unit: mode === 'interval' ? intervalUnit : undefined,
				timezone: mode === 'times' ? timezone : undefined
			})
			message.success(is_cn ? '保存成功' : 'Saved successfully')
		} catch {
			message.error(is_cn ? '保存失败' : 'Save failed')
		} finally {
			setSaving(false)
		}
	}

	const handleReset = async () => {
		setSaving(true)
		try {
			await saveSchedule({ enabled: false, mode: 'once' })
			setMode('once')
			setTimes(['09:00'])
			setDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
			setIntervalValue(30)
			setIntervalUnit('m')
			setTimezone('Asia/Shanghai')
			message.success(is_cn ? '已恢复默认' : 'Reset')
		} catch {
			message.error(is_cn ? '重置失败' : 'Reset failed')
		} finally {
			setSaving(false)
		}
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
						<Button size='small' onClick={handleReset}>
							{is_cn ? '恢复默认' : 'Reset'}
						</Button>
						<Button size='small' type='primary' loading={saving} onClick={handleSave}>
							{is_cn ? '保存' : 'Save'}
						</Button>
					</div>
				</div>

				

				{/* Mode selection */}
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

				{/* Scheduled: times + days */}
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

				{/* Interval */}
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

				{/* Daemon info */}
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

				{/* Timezone */}
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

		{/* Scheduled Instruction */}
		{instrLocal && (
			<div className={viewStyles.card} style={{ marginTop: 16 }}>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
					<div className={viewStyles.cardTitle}>
						{is_cn ? '定时执行指令' : 'Scheduled Instruction'}
					</div>
					{!instrEditing && (
						<span
							onClick={() => {
								setInstrPrompt(instrLocal?.prompt || '')
								const raw = (instrLocal?.locale || '').toLowerCase()
								setInstrLocale(raw.startsWith('zh') ? 'zh-cn' : 'en')
								setInstrEditing(true)
							}}
							style={{ fontSize: 12, color: 'var(--color_main)', cursor: 'pointer' }}
						>
							{is_cn ? '编辑' : 'Edit'}
						</span>
					)}
				</div>

				{instrEditing ? (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
						<div>
							<div style={{ fontSize: 12, color: 'var(--color_neo_text_secondary)', marginBottom: 4 }}>
								{is_cn ? '指令内容' : 'Prompt'}
							</div>
							<textarea
								value={instrPrompt}
								onChange={(e) => setInstrPrompt(e.target.value)}
								rows={4}
								style={{
									width: '100%',
									padding: '8px 12px',
									border: '1px solid var(--color_neo_border_field, var(--color_border_light))',
									borderRadius: 6,
									background: 'var(--color_neo_bg_field, var(--color_bg_2))',
									color: 'var(--color_neo_text_primary, var(--color_text))',
									fontSize: 13,
									lineHeight: 1.5,
									resize: 'vertical',
									outline: 'none',
									fontFamily: 'inherit'
								}}
							/>
						</div>
						<div>
							<div style={{ fontSize: 12, color: 'var(--color_neo_text_secondary)', marginBottom: 4 }}>
								{is_cn ? '执行语言' : 'Locale'}
							</div>
							<RadioGroup
								schema={{
									type: 'string',
									enum: [
										{ label: '中文', value: 'zh-cn' },
										{ label: 'English', value: 'en' }
									]
								}}
								value={instrLocale}
								onChange={(v) => setInstrLocale(v as string)}
							/>
						</div>
						{instrLocal?.first_question && (
							<div style={{ fontSize: 12, color: 'var(--color_neo_text_secondary)' }}>
								<span style={{ fontWeight: 500 }}>{is_cn ? '首次提问：' : 'First question: '}</span>
								<span style={{ opacity: 0.8 }}>
									{instrLocal.first_question.length > 80
										? instrLocal.first_question.slice(0, 80) + '...'
										: instrLocal.first_question}
								</span>
							</div>
						)}
						<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
							<Button size='small' onClick={() => setInstrEditing(false)}>
								{is_cn ? '取消' : 'Cancel'}
							</Button>
							<Button
								size='small'
								type='primary'
								loading={instrSaving}
								onClick={async () => {
									const api = window.$app?.openapi
									if (!api) return
									setInstrSaving(true)
									try {
										const updatedAt = new Date().toISOString()
										const res = await api.Put(`/agent/tasks/${taskId}`, {
											instruction: {
												prompt: instrPrompt,
												locale: instrLocale,
												updated_at: updatedAt
											}
										})
										if (!api.IsError(res)) {
											setInstrLocal({
												...instrLocal,
												prompt: instrPrompt,
												locale: instrLocale,
												updated_at: updatedAt
											})
											message.success(is_cn ? '保存成功' : 'Saved')
											setInstrEditing(false)
										}
									} catch { /* ignore */ }
									setInstrSaving(false)
								}}
							>
								{is_cn ? '保存' : 'Save'}
							</Button>
						</div>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						<div style={{
							fontSize: 13,
							color: 'var(--color_neo_text_secondary, var(--color_text_grey))',
							padding: '8px 12px',
							borderRadius: 6,
							background: 'var(--color_neo_bg_field, var(--color_bg_2))',
							lineHeight: 1.5,
							wordBreak: 'break-word'
						}}>
							{instrLocal?.prompt || '-'}
						</div>
						<div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color_neo_text_secondary)' }}>
							<span>
								{is_cn ? '语言：' : 'Locale: '}
								{(instrLocal?.locale || '').toLowerCase().startsWith('zh') ? '中文' : 'English'}
							</span>
							{instrLocal?.updated_at && (
								<span>
									{is_cn ? '更新：' : 'Updated: '}
									{new Date(instrLocal.updated_at).toLocaleString()}
								</span>
							)}
						</div>
						{instrLocal?.first_question && (
							<div style={{ fontSize: 12, color: 'var(--color_neo_text_secondary)', marginTop: 4 }}>
								<span style={{ fontWeight: 500 }}>{is_cn ? '首次提问：' : 'First Q: '}</span>
								<span style={{ opacity: 0.8 }}>
									{instrLocal.first_question.length > 100
										? instrLocal.first_question.slice(0, 100) + '...'
										: instrLocal.first_question}
								</span>
							</div>
						)}
					</div>
				)}
			</div>
		)}

		{/* Execution Logs */}
		<div className={viewStyles.card} style={{ marginTop: 16 }}>
			<div className={viewStyles.cardTitle} style={{ marginBottom: 12 }}>
				{is_cn ? '执行记录' : 'Execution Logs'}
			</div>
				{logs.length === 0 ? (
					<div style={{ fontSize: 13, color: 'var(--color_neo_text_secondary, var(--color_text_grey))' }}>
						{is_cn ? '暂无执行记录' : 'No execution logs'}
					</div>
				) : (
					<>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
							{logs.map((log, i) => (
								<div
									key={i}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 8,
										padding: '6px 10px',
										borderRadius: 6,
										background: 'var(--color_neo_bg_field, var(--color_bg_2))',
										fontSize: 13
									}}
								>
									<span style={{
										width: 6, height: 6, borderRadius: '50%',
										background: 'var(--color_success, #52c41a)', flexShrink: 0
									}} />
									<span style={{ color: 'var(--color_neo_text_primary, var(--color_text))', fontFamily: 'monospace' }}>
										{new Date(log.triggered_at).toLocaleString()}
									</span>
								</div>
							))}
						</div>
						{logsTotal > logsPageSize && (
							<div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
								<Button
									size='small'
									disabled={logsPage <= 1}
									onClick={() => fetchLogs(logsPage - 1)}
								>
									{is_cn ? '上一页' : 'Prev'}
								</Button>
								<span style={{ fontSize: 12, color: 'var(--color_neo_text_secondary)', lineHeight: '28px' }}>
									{logsPage} / {Math.ceil(logsTotal / logsPageSize)}
								</span>
								<Button
									size='small'
									disabled={logsPage >= Math.ceil(logsTotal / logsPageSize)}
									onClick={() => fetchLogs(logsPage + 1)}
								>
									{is_cn ? '下一页' : 'Next'}
								</Button>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}

export default ScheduleSection
