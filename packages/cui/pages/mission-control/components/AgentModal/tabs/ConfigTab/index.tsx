import React, { useState, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../../types'
import BasicPanel from './panels/BasicPanel'
import IdentityPanel from './panels/IdentityPanel'
import SchedulePanel from './panels/SchedulePanel'
import AdvancedPanel from './panels/AdvancedPanel'
import styles from './index.less'

interface ConfigTabProps {
	robot: RobotState
}

type MenuKey = 'basic' | 'identity' | 'schedule' | 'advanced'

interface MenuItem {
	key: MenuKey
	label: string
	icon: string
	visible?: boolean
}

const ConfigTab: React.FC<ConfigTabProps> = ({ robot }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [activeMenu, setActiveMenu] = useState<MenuKey>('basic')
	const [formData, setFormData] = useState<Record<string, any>>({})
	const [isDirty, setIsDirty] = useState(false)
	const [saving, setSaving] = useState(false)

	// TODO: Load actual data from robot.config
	// For now, we use mock data for autonomous_mode
	const autonomousMode = formData.autonomous_mode ?? false

	// Menu items - schedule only visible when autonomous_mode is true
	const menuItems: MenuItem[] = useMemo(() => [
		{
			key: 'basic',
			label: is_cn ? '基本信息' : 'Basic',
			icon: 'material-person'
		},
		{
			key: 'identity',
			label: is_cn ? '身份设定' : 'Identity',
			icon: 'material-badge'
		},
		{
			key: 'schedule',
			label: is_cn ? '工作日程' : 'Schedule',
			icon: 'material-schedule',
			visible: autonomousMode
		},
		{
			key: 'advanced',
			label: is_cn ? '高级配置' : 'Advanced',
			icon: 'material-tune'
		}
	], [is_cn, autonomousMode])

	const visibleMenuItems = menuItems.filter(item => item.visible !== false)

	// Handle field change
	const handleFieldChange = (field: string, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }))
		setIsDirty(true)
	}

	// Handle save
	const handleSave = async () => {
		setSaving(true)
		try {
			// TODO: Call API to save
			console.log('Saving config:', formData)
			await new Promise(resolve => setTimeout(resolve, 1000))
			setIsDirty(false)
		} catch (error) {
			console.error('Failed to save:', error)
		} finally {
			setSaving(false)
		}
	}

	// Render active panel
	const renderPanel = () => {
		const panelProps = {
			robot,
			formData,
			onChange: handleFieldChange,
			is_cn
		}

		switch (activeMenu) {
			case 'basic':
				return <BasicPanel {...panelProps} />
			case 'identity':
				return <IdentityPanel {...panelProps} />
			case 'schedule':
				return <SchedulePanel {...panelProps} />
			case 'advanced':
				return <AdvancedPanel {...panelProps} />
			default:
				return null
		}
	}

	return (
		<div className={styles.configTab}>
			{/* Left Menu */}
			<div className={styles.menuSidebar}>
				<div className={styles.menuList}>
					{visibleMenuItems.map(item => (
						<div
							key={item.key}
							className={`${styles.menuItem} ${activeMenu === item.key ? styles.menuItemActive : ''}`}
							onClick={() => setActiveMenu(item.key)}
						>
							<Icon name={item.icon} size={16} />
							<span>{item.label}</span>
						</div>
					))}
				</div>
			</div>

			{/* Right Panel */}
			<div className={styles.panelContainer}>
				<div className={styles.panelContent}>
					{renderPanel()}
				</div>

				{/* Save Button */}
				<div className={styles.panelFooter}>
					<button
						className={`${styles.saveButton} ${!isDirty ? styles.saveButtonDisabled : ''}`}
						onClick={handleSave}
						disabled={!isDirty || saving}
					>
						{saving ? (
							<>
								<Icon name='material-hourglass_empty' size={16} />
								<span>{is_cn ? '保存中...' : 'Saving...'}</span>
							</>
						) : (
							<>
								<Icon name='material-save' size={16} />
								<span>{is_cn ? '保存更改' : 'Save Changes'}</span>
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export default ConfigTab
