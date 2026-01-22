import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Modal, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Creature from '@/widgets/Creature'
import { useRobots } from '@/hooks/useRobots'
import type { RobotState, Execution, RobotStatus } from '../../types'
import { robotNames, type Delivery } from '../../mock/data'
import ActiveTab from './tabs/ActiveTab'
import HistoryTab from './tabs/HistoryTab'
import ResultsTab from './tabs/ResultsTab'
import ConfigTab from './tabs/ConfigTab'
import AssignTaskDrawer from '../AssignTaskDrawer'
import ExecutionDetailDrawer from '../ExecutionDetailDrawer'
import GuideExecutionDrawer from '../GuideExecutionDrawer'
import styles from './index.less'

interface AgentModalProps {
	visible: boolean
	onClose: () => void
	robot: RobotState | null
	onDataUpdated?: () => void
	onOpenResultDetail?: (delivery: Delivery) => void
}

type TabType = 'active' | 'history' | 'results' | 'config'

const AgentModal: React.FC<AgentModalProps> = ({ visible, onClose, robot, onDataUpdated, onOpenResultDetail }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Robot API hook for status refresh
	const { getRobotStatus } = useRobots()

	const [activeTab, setActiveTab] = useState<TabType>('active')
	const [loading, setLoading] = useState(false)
	const [showAssignDrawer, setShowAssignDrawer] = useState(false)
	const [showDetailDrawer, setShowDetailDrawer] = useState(false)
	const [showGuideDrawer, setShowGuideDrawer] = useState(false)
	const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null)

	// Real-time status state (merged with robot prop)
	const [robotStatus, setRobotStatus] = useState<{
		status: RobotStatus
		running: number
		max_running: number
		running_ids?: string[]
	} | null>(null)

	// Status refresh interval ref
	const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)

	// Refresh robot status from API
	const refreshStatus = useCallback(async () => {
		if (!robot) return

		try {
			const status = await getRobotStatus(robot.member_id)
			if (status) {
				setRobotStatus({
					status: status.status as RobotStatus,
					running: status.running,
					max_running: status.max_running,
					running_ids: status.running_ids
				})
			}
		} catch (err) {
			console.error('Failed to refresh robot status:', err)
		}
	}, [robot, getRobotStatus])

	// Reset tab and start status refresh when modal opens
	useEffect(() => {
		if (visible && robot) {
			setActiveTab('active')
			setShowAssignDrawer(false)
			setShowDetailDrawer(false)
			setShowGuideDrawer(false)
			setSelectedExecution(null)
			setRobotStatus(null)

			// Initial status refresh
			refreshStatus()

			// Start periodic refresh (every 10 seconds)
			statusIntervalRef.current = setInterval(refreshStatus, 10000)
		} else {
			// Clear interval when modal closes
			if (statusIntervalRef.current) {
				clearInterval(statusIntervalRef.current)
				statusIntervalRef.current = null
			}
		}

		return () => {
			if (statusIntervalRef.current) {
				clearInterval(statusIntervalRef.current)
				statusIntervalRef.current = null
			}
		}
	}, [visible, robot, refreshStatus])

	// Handle opening execution detail
	const handleOpenDetail = useCallback((execution: Execution) => {
		setSelectedExecution(execution)
		setShowDetailDrawer(true)
	}, [])

	const handleCloseDetail = useCallback(() => {
		setShowDetailDrawer(false)
		// Delay clearing execution to allow animation to complete
		setTimeout(() => setSelectedExecution(null), 300)
	}, [])

	// Handle opening guide drawer
	const handleOpenGuide = useCallback((execution: Execution) => {
		setSelectedExecution(execution)
		setShowDetailDrawer(false) // Close detail drawer if open
		setShowGuideDrawer(true)
	}, [])

	const handleCloseGuide = useCallback(() => {
		setShowGuideDrawer(false)
		// Delay clearing execution to allow animation to complete
		setTimeout(() => setSelectedExecution(null), 300)
	}, [])

	// Handle guide from execution card (need to find execution by ID)
	const handleGuideFromCard = useCallback((executionId: string, executions: Execution[]) => {
		const execution = executions.find(e => e.id === executionId)
		if (execution) {
			handleOpenGuide(execution)
		}
	}, [handleOpenGuide])

	// Handle guide from detail drawer (use selected execution)
	const handleGuideFromDetail = useCallback(() => {
		if (selectedExecution) {
			setShowDetailDrawer(false)
			setShowGuideDrawer(true)
		}
	}, [selectedExecution])

	const handleAssignTask = () => {
		setShowAssignDrawer(true)
	}

	const handleTaskAssigned = () => {
		// Refresh data after task is assigned
		onDataUpdated?.()
		// Switch to Active tab to see the new execution
		setActiveTab('active')
	}

	if (!robot) return null

	// Merge robot prop with real-time status
	const currentRobot: RobotState = {
		...robot,
		status: robotStatus?.status || robot.status,
		running: robotStatus?.running ?? robot.running,
		max_running: robotStatus?.max_running ?? robot.max_running,
		running_ids: robotStatus?.running_ids || robot.running_ids
	}

	// Get i18n display name
	const displayName = robotNames[robot.member_id]
		? (is_cn ? robotNames[robot.member_id].cn : robotNames[robot.member_id].en)
		: robot.display_name

	const tabs: { key: TabType; label: string; icon: string; count?: number }[] = [
		{
			key: 'active',
			label: is_cn ? '进行中' : 'Active',
			icon: 'material-play_circle',
			count: currentRobot.running
		},
		{
			key: 'history',
			label: is_cn ? '历史' : 'History',
			icon: 'material-history'
		},
		{
			key: 'results',
			label: is_cn ? '成果' : 'Results',
			icon: 'material-folder_open'
		},
		{
			key: 'config',
			label: is_cn ? '设置' : 'Settings',
			icon: 'material-settings'
		}
	]

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab)
	}

	const renderContent = () => {
		if (loading) {
			return (
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			)
		}

		switch (activeTab) {
			case 'active':
				return <ActiveTab robot={currentRobot} onAssignTask={handleAssignTask} onOpenDetail={handleOpenDetail} onOpenGuide={handleOpenGuide} />
			case 'history':
				return <HistoryTab robot={currentRobot} onOpenDetail={handleOpenDetail} />
			case 'results':
				return <ResultsTab robot={currentRobot} onOpenDetail={onOpenResultDetail} />
			case 'config':
				return <ConfigTab 
					robot={currentRobot} 
					onDelete={() => {
						// Close modal and refresh grid after delete
						onClose()
						onDataUpdated?.()
					}}
					onUpdated={() => {
						// Refresh grid data after update
						onDataUpdated?.()
						// Also refresh status
						refreshStatus()
					}}
				/>
			default:
				return null
		}
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Creature
							status={currentRobot.status}
							size='small'
							animated={false}
							showAura={false}
							showRing={false}
							showGlow={false}
						/>
						<span className={styles.modalTitle}>{displayName}</span>
					</div>
					<div className={styles.tabs}>
						{tabs.map((tab) => (
							<div
								key={tab.key}
								className={`${styles.tabItem} ${
									activeTab === tab.key ? styles.tabItemActive : ''
								}`}
								onClick={() => handleTabChange(tab.key)}
							>
								<Icon name={tab.icon} size={14} />
								<span>{tab.label}</span>
								{tab.count !== undefined && tab.count > 0 && (
									<span className={styles.tabCount}>{tab.count}</span>
								)}
							</div>
						))}
					</div>
					<div className={styles.headerActions}>
						<Tooltip title={is_cn ? '指派任务' : 'Assign Task'} placement='bottom'>
							<button className={styles.iconButton} onClick={handleAssignTask}>
								<Icon name='material-rocket_launch' size={18} />
							</button>
						</Tooltip>
						<button className={styles.iconButton} onClick={onClose}>
							<Icon name='material-close' size={18} />
						</button>
					</div>
				</div>
			}
			open={visible}
			onCancel={onClose}
			footer={null}
			width='90%'
			style={{
				top: '5vh',
				paddingBottom: 0,
				maxWidth: 'none'
			}}
			bodyStyle={{
				padding: 0,
				height: 'calc(90vh - 56px)',
				overflow: 'hidden'
			}}
			destroyOnClose
			closable={false}
			className={styles.agentModal}
		>
			<div className={styles.modalContent}>
				{renderContent()}

				{/* Assign Task Drawer - inside modal content */}
				<AssignTaskDrawer
					visible={showAssignDrawer}
					onClose={() => setShowAssignDrawer(false)}
					robot={currentRobot}
					onTaskAssigned={handleTaskAssigned}
				/>

				{/* Execution Detail Drawer - inside modal content */}
				<ExecutionDetailDrawer
					visible={showDetailDrawer}
					onClose={handleCloseDetail}
					execution={selectedExecution}
					onGuide={handleGuideFromDetail}
				/>

				{/* Guide Execution Drawer - inside modal content */}
				<GuideExecutionDrawer
					visible={showGuideDrawer}
					onClose={handleCloseGuide}
					robot={currentRobot}
					execution={selectedExecution}
					onGuidanceSent={() => {
						// Refresh data after guidance is sent
						onDataUpdated?.()
						// Also refresh status
						refreshStatus()
					}}
				/>
			</div>
		</Modal>
	)
}

export default AgentModal
