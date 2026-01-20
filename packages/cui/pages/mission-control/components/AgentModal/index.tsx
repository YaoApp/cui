import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Creature from '@/widgets/Creature'
import type { RobotState, Execution } from '../../types'
import { robotNames } from '../../mock/data'
import ActiveTab from './tabs/ActiveTab'
import HistoryTab from './tabs/HistoryTab'
import ResultsTab from './tabs/ResultsTab'
import ConfigTab from './tabs/ConfigTab'
import AssignTaskDrawer from '../AssignTaskDrawer'
import ExecutionDetailDrawer from '../ExecutionDetailDrawer'
import styles from './index.less'

interface AgentModalProps {
	visible: boolean
	onClose: () => void
	robot: RobotState | null
	onDataUpdated?: () => void
}

type TabType = 'active' | 'history' | 'results' | 'config'

const AgentModal: React.FC<AgentModalProps> = ({ visible, onClose, robot, onDataUpdated }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [activeTab, setActiveTab] = useState<TabType>('active')
	const [loading, setLoading] = useState(false)
	const [showAssignDrawer, setShowAssignDrawer] = useState(false)
	const [showDetailDrawer, setShowDetailDrawer] = useState(false)
	const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null)

	// Reset tab when modal opens
	useEffect(() => {
		if (visible) {
			setActiveTab('active')
			setShowAssignDrawer(false)
			setShowDetailDrawer(false)
			setSelectedExecution(null)
		}
	}, [visible])

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

	// Get i18n display name
	const displayName = robotNames[robot.member_id]
		? (is_cn ? robotNames[robot.member_id].cn : robotNames[robot.member_id].en)
		: robot.display_name

	const tabs: { key: TabType; label: string; icon: string; count?: number }[] = [
		{
			key: 'active',
			label: is_cn ? '进行中' : 'Active',
			icon: 'material-play_circle',
			count: robot.running
		},
		{
			key: 'history',
			label: is_cn ? '历史' : 'History',
			icon: 'material-history'
		},
		{
			key: 'results',
			label: is_cn ? '产出' : 'Results',
			icon: 'material-folder_open'
		},
		{
			key: 'config',
			label: is_cn ? '配置' : 'Config',
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
				return <ActiveTab robot={robot} onAssignTask={handleAssignTask} onOpenDetail={handleOpenDetail} />
			case 'history':
				return <HistoryTab robot={robot} onOpenDetail={handleOpenDetail} />
			case 'results':
				return <ResultsTab robot={robot} />
			case 'config':
				return <ConfigTab robot={robot} />
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
							status={robot.status}
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
					robot={robot}
					onTaskAssigned={handleTaskAssigned}
				/>

				{/* Execution Detail Drawer - inside modal content */}
				<ExecutionDetailDrawer
					visible={showDetailDrawer}
					onClose={handleCloseDetail}
					execution={selectedExecution}
				/>
			</div>
		</Modal>
	)
}

export default AgentModal
