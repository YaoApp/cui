import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getLocale } from '@umijs/max'
import { Tooltip } from 'antd'
import Modal from './components/Modal'
import AgentModal from './components/AgentModal'
import ResultDetailModal from './components/ResultDetailModal'
import AddAgentModal from './components/AddAgentModal'
import { observer } from 'mobx-react-lite'
import Icon from '@/widgets/Icon'
import { useGlobal } from '@/context/app'
import clsx from 'clsx'
import {
	mockRobots,
	getRobotStats,
	getActiveExecutions,
	getRobotDisplayName,
	getRecentActivities,
	type Activity,
	type Delivery
} from './mock/data'
import type { RobotState } from './types'
import styles from './index.less'

const MissionControl = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()

	// State
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [robots, setRobots] = useState<RobotState[]>(mockRobots)
	const [currentTime, setCurrentTime] = useState(new Date())
	const [colonBlink, setColonBlink] = useState(false)
	const [updatedDigits, setUpdatedDigits] = useState<Set<number>>(new Set())

	// Filter state
	const [showFilter, setShowFilter] = useState(false)
	const [searchKeyword, setSearchKeyword] = useState('')
	const [filterStatus, setFilterStatus] = useState<RobotState['status'] | 'all'>('all')
	const filterRef = useRef<HTMLDivElement>(null)

	// Activity feed state
	const [activities] = useState<Activity[]>(getRecentActivities(10))
	const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
	const [showActivityModal, setShowActivityModal] = useState(false)

	// Agent Modal state
	const [selectedRobot, setSelectedRobot] = useState<RobotState | null>(null)
	const [showAgentModal, setShowAgentModal] = useState(false)

	// Result Detail Modal state
	const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
	const [showResultDetailModal, setShowResultDetailModal] = useState(false)

	// Add Agent Modal state
	const [showAddAgentModal, setShowAddAgentModal] = useState(false)

	// Stats computed from robots
	const stats = useMemo(() => getRobotStats(robots), [robots])

	// Filtered robots
	const filteredRobots = useMemo(() => {
		return robots.filter((robot) => {
			// Filter by status
			if (filterStatus !== 'all' && robot.status !== filterStatus) {
				return false
			}
			// Filter by keyword
			if (searchKeyword.trim()) {
				const keyword = searchKeyword.toLowerCase().trim()
				return (
					robot.display_name.toLowerCase().includes(keyword) ||
					robot.name.toLowerCase().includes(keyword) ||
					robot.description?.toLowerCase().includes(keyword)
				)
			}
			return true
		})
	}, [robots, filterStatus, searchKeyword])

	// Check if filter is active
	const isFilterActive = filterStatus !== 'all' || searchKeyword.trim() !== ''

	// Reset filter
	const resetFilter = () => {
		setSearchKeyword('')
		setFilterStatus('all')
	}

	// Get count by status
	const getStatusCount = (status: RobotState['status'] | 'all') => {
		if (status === 'all') return robots.length
		return robots.filter((r) => r.status === status).length
	}

	// Clock update
	useEffect(() => {
		const timer = setInterval(() => {
			const newTime = new Date()
			const oldTimeStr = formatTime(currentTime)
			const newTimeStr = formatTime(newTime)

			// Track which digits changed
			const changed = new Set<number>()
			for (let i = 0; i < newTimeStr.length; i++) {
				if (oldTimeStr[i] !== newTimeStr[i] && newTimeStr[i] !== ':') {
					changed.add(i)
				}
			}
			if (changed.size > 0) {
				setUpdatedDigits(changed)
				setTimeout(() => setUpdatedDigits(new Set()), 300)
			}

			setCurrentTime(newTime)
			setColonBlink((prev) => !prev)
		}, 1000)

		return () => clearInterval(timer)
	}, [currentTime])

	// Format time as HH:MM:SS
	const formatTime = (date: Date): string => {
		return date.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})
	}

	// Format date
	const formatDate = (date: Date): string => {
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}
		return date.toLocaleDateString(is_cn ? 'zh-CN' : 'en-US', options)
	}

	// Toggle fullscreen
	const toggleFullscreen = useCallback(() => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen()
			setIsFullscreen(true)
		} else {
			document.exitFullscreen()
			setIsFullscreen(false)
		}
	}, [])

	// Listen for fullscreen changes
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement)
		}
		document.addEventListener('fullscreenchange', handleFullscreenChange)
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
	}, [])

	// Close filter dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
				setShowFilter(false)
			}
		}
		if (showFilter) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [showFilter])

	// Activity feed auto-rotate
	useEffect(() => {
		if (activities.length <= 1) return
		const timer = setInterval(() => {
			setCurrentActivityIndex((prev) => (prev + 1) % activities.length)
		}, 6000) // Rotate every 6 seconds
		return () => clearInterval(timer)
	}, [activities.length])

	// Handle station click
	const handleStationClick = (robot: RobotState) => {
		setSelectedRobot(robot)
		setShowAgentModal(true)
	}

	// Handle agent modal close
	const handleAgentModalClose = () => {
		setShowAgentModal(false)
		setSelectedRobot(null)
	}

	// Handle add agent click
	const handleAddAgent = () => {
		setShowAddAgentModal(true)
	}

	// Handle add agent modal close
	const handleAddAgentModalClose = () => {
		setShowAddAgentModal(false)
	}

	// Handle agent created
	const handleAgentCreated = () => {
		// TODO: Refresh robot list from API
		console.log('Agent created, refreshing list...')
	}

	// Get status text
	const getStatusText = (status: RobotState['status']): string => {
		const texts: Record<RobotState['status'], { en: string; cn: string }> = {
			working: { en: 'WORKING', cn: '工作中' },
			idle: { en: 'IDLE', cn: '空闲' },
			paused: { en: 'PAUSED', cn: '已暂停' },
			error: { en: 'ERROR', cn: '错误' },
			maintenance: { en: 'MAINTENANCE', cn: '维护中' }
		}
		return is_cn ? texts[status].cn : texts[status].en
	}

	// Format next run time
	const formatNextRun = (nextRun: string | undefined): string => {
		if (!nextRun) return ''
		const date = new Date(nextRun)
		const now = new Date()
		const diffMs = date.getTime() - now.getTime()

		if (diffMs < 0) return ''

		const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
		const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

		if (diffHours > 24) {
			return date.toLocaleDateString(is_cn ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })
		} else if (diffHours > 0) {
			return is_cn ? `${diffHours}小时${diffMins}分钟后` : `in ${diffHours}h ${diffMins}m`
		} else {
			return is_cn ? `${diffMins}分钟后` : `in ${diffMins}m`
		}
	}

	// Get activity icon
	const getActivityIcon = (type: Activity['type']): string => {
		const icons: Record<Activity['type'], string> = {
			completed: 'material-check_circle',
			file: 'material-description',
			error: 'material-error',
			started: 'material-play_circle',
			paused: 'material-pause_circle'
		}
		return icons[type]
	}

	// Format relative time
	const formatRelativeTime = (timestamp: string): string => {
		const now = new Date()
		const time = new Date(timestamp)
		const diffMs = now.getTime() - time.getTime()
		const diffMins = Math.floor(diffMs / (1000 * 60))
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

		if (diffMins < 1) return is_cn ? '刚刚' : 'Just now'
		if (diffMins < 60) return is_cn ? `${diffMins}分钟前` : `${diffMins}m ago`
		if (diffHours < 24) return is_cn ? `${diffHours}小时前` : `${diffHours}h ago`
		return time.toLocaleDateString(is_cn ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })
	}

	// Get progress for working robot
	const getProgress = (robot: RobotState): number => {
		// Get active executions and calculate average progress
		const executions = getActiveExecutions(robot.member_id)
		if (executions.length === 0) return 0

		// For simplicity, return a simulated progress based on tasks
		const exec = executions[0]
		if (exec.tasks && exec.current) {
			return ((exec.current.task_index + 1) / exec.tasks.length) * 100
		}
		return 50 // Default progress
	}

	// Render time with animated digits
	const renderTime = () => {
		const timeStr = formatTime(currentTime)
		return timeStr.split('').map((char, index) => {
			if (char === ':') {
				return (
					<span key={index} className={clsx(styles.colon, colonBlink && styles.blink)}>
						:
					</span>
				)
			}
			return (
				<span key={index} className={clsx(styles.digit, updatedDigits.has(index) && styles.updated)}>
					{char}
				</span>
			)
		})
	}

	// Render station (creature style)
	const renderStation = (robot: RobotState) => {
		const progress = robot.status === 'working' ? getProgress(robot) : 0
		const circumference = 2 * Math.PI * 45 // radius = 45
		const strokeDashoffset = circumference - (progress / 100) * circumference

		return (
			<div
				key={robot.member_id}
				className={clsx(styles.station, styles[robot.status])}
				onClick={() => handleStationClick(robot)}
			>
				{/* Concurrent badge */}
				{robot.running > 1 && <span className={styles.concurrentBadge}>×{robot.running}</span>}

				{/* Creature container */}
				<div className={styles.creatureContainer}>
					{/* Aura glow */}
					<div className={styles.aura} />

					{/* Orbit ring */}
					<div className={styles.orbitRing} />

					{/* Progress ring for working status */}
					{robot.status === 'working' && (
						<svg className={styles.progressRing} viewBox='0 0 100 100'>
							<circle className={styles.bg} cx='50' cy='50' r='45' />
							<circle
								className={styles.progress}
								cx='50'
								cy='50'
								r='45'
								style={{ strokeDashoffset }}
							/>
						</svg>
					)}

					{/* The creature */}
					<div className={styles.creature}>
						<div className={styles.creatureBody}>
							<div className={styles.eyes}>
								<span className={styles.eye} />
								<span className={styles.eye} />
							</div>
						</div>
					</div>

					{/* Floating particles for working */}
					{robot.status === 'working' && (
						<div className={styles.particles}>
							<span className={styles.particle} />
							<span className={styles.particle} />
							<span className={styles.particle} />
							<span className={styles.particle} />
						</div>
					)}
				</div>

				{/* Station info */}
				<div className={styles.stationInfo}>
					<div className={styles.name}>{getRobotDisplayName(robot.member_id, locale)}</div>
					<div className={clsx(styles.statusText, styles[robot.status])}>
						{getStatusText(robot.status)}
					</div>
					{robot.status === 'idle' && robot.next_run && (
						<div className={styles.nextRun}>
							{is_cn ? '下次：' : 'Next: '}
							<span className={styles.nextRunTime}>{formatNextRun(robot.next_run)}</span>
						</div>
					)}
				</div>
			</div>
		)
	}

	return (
		<div className={clsx(styles.missionControl, isFullscreen && styles.fullscreen)}>
			{/* Ambient glow layer */}
			<div className={styles.ambientGlow}>
				<div className={styles.glow1} />
				<div className={styles.glow2} />
			</div>

			{/* Header */}
			<div className={styles.header}>
				<div className={styles.logo}>
					<div className={styles.logoIcon}>
						<Icon name='material-rocket_launch' size={20} />
					</div>
					<span className={styles.title}>{is_cn ? '任务控制中心' : 'Mission Control'}</span>
				</div>

				<div className={styles.stats}>
					<div className={styles.statItem}>
						<span className={clsx(styles.statDot, styles.working)} />
						<span className={styles.statLabel}>{is_cn ? '运行中' : 'Working'}</span>
						<span className={styles.statValue}>{stats.working}</span>
					</div>
					<div className={styles.statItem}>
						<span className={clsx(styles.statDot, styles.idle)} />
						<span className={styles.statLabel}>{is_cn ? '空闲' : 'Idle'}</span>
						<span className={styles.statValue}>{stats.idle}</span>
					</div>
					{stats.error > 0 && (
						<div className={styles.statItem}>
							<span className={clsx(styles.statDot, styles.error)} />
							<span className={styles.statLabel}>{is_cn ? '错误' : 'Error'}</span>
							<span className={styles.statValue}>{stats.error}</span>
						</div>
					)}
				</div>

				<div className={styles.actions}>
					{/* Filter dropdown */}
					<div className={styles.filterWrapper} ref={filterRef}>
						<Tooltip title={is_cn ? '筛选' : 'Filter'} placement='bottom'>
							<button
								className={clsx(styles.actionBtn, showFilter && styles.active)}
								onClick={() => setShowFilter(!showFilter)}
							>
								<Icon name='material-filter_list' size={20} />
								{isFilterActive && <span className={styles.filterBadge} />}
							</button>
						</Tooltip>

						{/* Filter dropdown panel */}
						{showFilter && (
							<div className={styles.filterDropdown}>
								{/* Search input */}
								<div className={styles.filterSearch}>
									<Icon name='material-search' size={18} className={styles.searchIcon} />
									<input
										type='text'
										placeholder={is_cn ? '搜索名称...' : 'Search name...'}
										value={searchKeyword}
										onChange={(e) => setSearchKeyword(e.target.value)}
										className={styles.searchInput}
										autoFocus
									/>
									{searchKeyword && (
										<button
											className={styles.clearBtn}
											onClick={() => setSearchKeyword('')}
										>
											<Icon name='material-close' size={14} />
										</button>
									)}
								</div>

								{/* Status filters */}
								<div className={styles.filterStatuses}>
									{(
										[
											{ key: 'all', label: is_cn ? '全部' : 'All' },
											{ key: 'working', label: is_cn ? '工作中' : 'Working' },
											{ key: 'idle', label: is_cn ? '空闲' : 'Idle' },
											{ key: 'paused', label: is_cn ? '已暂停' : 'Paused' },
											{ key: 'error', label: is_cn ? '错误' : 'Error' },
											{ key: 'maintenance', label: is_cn ? '维护中' : 'Maintenance' }
										] as const
									).map((item) => (
										<button
											key={item.key}
											className={clsx(
												styles.statusBtn,
												filterStatus === item.key && styles.active,
												item.key !== 'all' && styles[item.key]
											)}
											onClick={() => setFilterStatus(item.key)}
										>
											<span className={styles.statusLabel}>{item.label}</span>
											<span className={styles.statusCount}>
												{getStatusCount(item.key)}
											</span>
										</button>
									))}
								</div>

								{/* Reset button */}
								{isFilterActive && (
									<button className={styles.resetBtn} onClick={resetFilter}>
										<Icon name='material-refresh' size={16} />
										<span>{is_cn ? '重置筛选' : 'Reset'}</span>
									</button>
								)}
							</div>
						)}
					</div>

					{/* Theme toggle */}
					<Tooltip title={is_cn ? '切换主题' : 'Toggle Theme'} placement='bottom'>
						<button
							className={styles.actionBtn}
							onClick={() => global.setTheme(global.theme === 'light' ? 'dark' : 'light')}
						>
							<Icon
								name={global.theme === 'light' ? 'material-dark_mode' : 'material-light_mode'}
								size={20}
							/>
						</button>
					</Tooltip>

					{/* Fullscreen toggle */}
					<Tooltip title={is_cn ? '全屏模式' : 'Fullscreen'} placement='bottom'>
						<button
							className={clsx(styles.actionBtn, isFullscreen && styles.active)}
							onClick={toggleFullscreen}
						>
							<Icon
								name={isFullscreen ? 'material-fullscreen_exit' : 'material-fullscreen'}
								size={20}
							/>
						</button>
					</Tooltip>
				</div>
			</div>

			{/* Content - outer container with overflow hidden */}
			<div className={styles.content}>
				{/* scrollArea - inner scrollable container */}
				<div className={styles.scrollArea}>
					{/* Clock Section */}
					<div className={styles.clockSection}>
						<div className={styles.time}>{renderTime()}</div>
						<div className={styles.date}>{formatDate(currentTime)}</div>
					</div>

					{/* Stations Grid */}
					<div className={styles.stationsSection}>
						<div className={styles.stationsScrollWrapper}>
							{filteredRobots.length > 0 ? (
								<div className={styles.stationsGrid}>
									{filteredRobots.map(renderStation)}
									{/* Add Agent - only show when no filter active */}
									{!isFilterActive && (
										<div className={styles.addStation} onClick={handleAddAgent}>
											<div className={styles.addCircle}>
												<Icon name='material-add' size={32} className={styles.addIcon} />
											</div>
											<span className={styles.addText}>
												{is_cn ? '添加智能体' : 'Add Agent'}
											</span>
										</div>
									)}
								</div>
							) : robots.length > 0 ? (
								<div className={styles.emptyState}>
									<Icon name='material-search_off' size={80} className={styles.emptyIcon} />
									<div className={styles.emptyTitle}>
										{is_cn ? '没有匹配的智能体' : 'No Matching Agents'}
									</div>
									<div className={styles.emptyDescription}>
										{is_cn
											? '尝试调整筛选条件或搜索关键词'
											: 'Try adjusting your filter or search keyword'}
									</div>
									<button className={styles.resetFilterBtn} onClick={resetFilter}>
										{is_cn ? '重置筛选' : 'Reset Filter'}
									</button>
								</div>
							) : (
								<div className={styles.emptyState}>
									<Icon name='material-auto_awesome' size={80} className={styles.emptyIcon} />
									<div className={styles.emptyTitle}>
										{is_cn ? '暂无智能体' : 'No Agents Yet'}
									</div>
									<div className={styles.emptyDescription}>
										{is_cn
											? '添加您的第一个自主智能体，开始自动化工作流程'
											: 'Add your first autonomous agent to start automating workflows'}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Activity Feed Banner */}
			{activities.length > 0 && (
				<div className={styles.activityBanner} onClick={() => setShowActivityModal(true)}>
					<div className={styles.activityContent}>
						<Icon
							name={getActivityIcon(activities[currentActivityIndex].type)}
							size={18}
							className={clsx(styles.activityIcon, styles[activities[currentActivityIndex].type])}
						/>
						<span className={styles.activityRobot}>
							{is_cn
								? activities[currentActivityIndex].robot_name.cn
								: activities[currentActivityIndex].robot_name.en}
						</span>
						<span className={styles.activityTitle}>
							{is_cn
								? activities[currentActivityIndex].title.cn
								: activities[currentActivityIndex].title.en}
						</span>
						<span className={styles.activityTime}>
							{formatRelativeTime(activities[currentActivityIndex].timestamp)}
						</span>
					</div>
					<div className={styles.activityAction}>
						<span className={styles.viewAll}>{is_cn ? '查看全部' : 'View All'}</span>
						<Icon name='material-chevron_right' size={18} />
					</div>
				</div>
			)}

			{/* Activity Modal */}
			<Modal
				open={showActivityModal}
				onClose={() => setShowActivityModal(false)}
				title={is_cn ? '最近动态' : 'Recent Activity'}
			>
				<div className={styles.modalContent}>
					{activities.map((activity) => (
						<div key={activity.id} className={styles.activityItem}>
							<Icon
								name={getActivityIcon(activity.type)}
								size={18}
								className={clsx(styles.activityIcon, styles[activity.type])}
							/>
							<div className={styles.activityInfo}>
								<div className={styles.activityItemTitle}>
									<span className={styles.robotName}>
										{is_cn ? activity.robot_name.cn : activity.robot_name.en}
									</span>
									{activity.file_id && (
										<button className={styles.downloadBtn}>
											<Icon name='material-download' size={16} />
										</button>
									)}
									<span className={styles.itemTime}>
										{formatRelativeTime(activity.timestamp)}
									</span>
								</div>
								<div className={styles.activityItemDesc}>
									{is_cn ? activity.title.cn : activity.title.en}
								</div>
								{activity.description && (
									<div className={styles.activityItemMeta}>
										{is_cn ? activity.description.cn : activity.description.en}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</Modal>

			{/* Agent Modal */}
			<AgentModal
				visible={showAgentModal}
				onClose={handleAgentModalClose}
				robot={selectedRobot}
				onOpenResultDetail={(delivery) => {
					setSelectedDelivery(delivery)
					setShowResultDetailModal(true)
				}}
			/>

			{/* Result Detail Modal */}
			<ResultDetailModal
				visible={showResultDetailModal}
				onClose={() => {
					setShowResultDetailModal(false)
					setTimeout(() => setSelectedDelivery(null), 200)
				}}
				delivery={selectedDelivery}
			/>

			{/* Add Agent Modal */}
			<AddAgentModal
				visible={showAddAgentModal}
				onClose={handleAddAgentModalClose}
				onCreated={handleAgentCreated}
			/>
		</div>
	)
}

export default observer(MissionControl)
