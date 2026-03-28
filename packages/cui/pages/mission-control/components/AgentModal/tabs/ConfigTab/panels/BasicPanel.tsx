import React, { useState, useEffect, useMemo } from 'react'
import { Tooltip } from 'antd'
import { Input, Select, RadioGroup } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { useWorkspace } from '@/hooks/useComputerWorkspace'
import type { RobotState } from '../../../../../types'
import type { ConfigContextData } from '../index'
import styles from '../index.less'

interface BasicPanelProps {
	robot: RobotState
	formData: Record<string, any>
	onChange: (field: string, value: any) => void
	is_cn: boolean
	configData?: ConfigContextData
}

/**
 * BasicPanel - Basic information settings
 * 
 * Fields from `__yao.member`:
 * - display_name: Name
 * - role_id: Role
 * - bio: Description
 * - manager_id: Reports To
 * - autonomous_mode: Work Mode
 * - workspace: Workspace binding
 */
const BasicPanel: React.FC<BasicPanelProps> = ({ robot, formData, onChange, is_cn, configData }) => {
	const [errors, setErrors] = useState<Record<string, string>>({})

	const { fetchWorkspaces, workspaceOptionsGrouped } = useWorkspace()

	useEffect(() => {
		fetchWorkspaces()
	}, [fetchWorkspaces])

	const roles = useMemo(() => configData?.roles || [], [configData?.roles])
	const managers = useMemo(() => configData?.managers || [], [configData?.managers])

	const handleFieldChange = (field: string, value: any) => {
		onChange(field, value)
		if (errors[field]) {
			setErrors(prev => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})
		}
	}

	return (
		<div className={styles.panelInner}>
			<div className={styles.panelTitle}>
				{is_cn ? '基本信息' : 'Basic Information'}
			</div>

			{/* Name */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					<span className={styles.required}>*</span>
					{is_cn ? '名称' : 'Name'}
				</label>
				<Input
					value={formData.display_name}
					onChange={(value) => handleFieldChange('display_name', value)}
					schema={{
						type: 'string',
						placeholder: is_cn ? '请输入智能体名称' : 'Enter agent name'
					}}
					error={errors.display_name || ''}
					hasError={!!errors.display_name}
				/>
			</div>

			{/* Workspace */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					{is_cn ? '工作空间' : 'Workspace'}
					<Tooltip
						title={is_cn
							? '将智能体绑定到指定的工作空间环境'
							: 'Bind the agent to a specific workspace environment'
						}
						placement='top'
					>
						<span className={styles.helpIconWrapper}>
							<Icon name='material-help' size={14} className={styles.helpIcon} />
						</span>
					</Tooltip>
				</label>
				<Select
					value={formData.workspace || undefined}
					onChange={(value) => handleFieldChange('workspace', value || null)}
					schema={{
						type: 'string',
						enum: workspaceOptionsGrouped,
						placeholder: is_cn ? '选择工作空间（可选）' : 'Select workspace (optional)',
						searchable: true,
						allowClear: true
					}}
				/>
			</div>

			{/* Role and Manager - Two columns */}
			<div className={styles.formRow}>
				<div className={styles.formItemHalf}>
					<label className={styles.formLabel}>
						{is_cn ? '角色' : 'Role'}
					</label>
					<Select
						value={formData.role_id}
						onChange={(value) => handleFieldChange('role_id', value)}
						schema={{
							type: 'string',
							enum: roles,
							placeholder: is_cn ? '选择角色' : 'Select role'
						}}
					/>
				</div>

				<div className={styles.formItemHalf}>
					<label className={styles.formLabel}>
						{is_cn ? '直属主管' : 'Reports To'}
						<Tooltip
							title={is_cn
								? '智能体会定期向主管发送工作报告'
								: 'Agent will send regular reports to the manager'
							}
						>
							<span className={styles.helpIconWrapper}>
								<Icon name='material-help' size={14} className={styles.helpIcon} />
							</span>
						</Tooltip>
					</label>
					<Select
						value={formData.manager_id}
						onChange={(value) => handleFieldChange('manager_id', value)}
						schema={{
							type: 'string',
							enum: managers,
							placeholder: is_cn ? '选择主管（可选）' : 'Select manager (optional)'
						}}
					/>
				</div>
			</div>

			{/* Description */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					{is_cn ? '简介' : 'Description'}
				</label>
				<Input
					value={formData.bio}
					onChange={(value) => handleFieldChange('bio', value)}
					schema={{
						type: 'string',
						placeholder: is_cn 
							? '简要介绍这个智能体的职责和特点' 
							: 'Brief description of this agent'
					}}
					error=''
					hasError={false}
				/>
			</div>

			{/* Work Mode */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					{is_cn ? '工作模式' : 'Work Mode'}
					<Tooltip
						title={is_cn
							? '自主模式：智能体会主动思考、发现任务并自主完成。按需模式：仅在收到任务指派时工作。'
							: 'Autonomous: Agent proactively thinks, identifies tasks and completes them independently. On Demand: Works only when assigned tasks.'
						}
					>
						<span className={styles.helpIconWrapper}>
							<Icon name='material-help' size={14} className={styles.helpIcon} />
						</span>
					</Tooltip>
				</label>
				<RadioGroup
					value={formData.autonomous_mode ? 'autonomous' : 'on_demand'}
					onChange={(value) => handleFieldChange('autonomous_mode', value === 'autonomous')}
					schema={{
						type: 'string',
						enum: [
							{
								label: is_cn ? '自主模式' : 'Autonomous',
								value: 'autonomous'
							},
							{
								label: is_cn ? '按需模式' : 'On Demand',
								value: 'on_demand'
							}
						]
					}}
				/>
				<div className={styles.formHint}>
					{formData.autonomous_mode
						? (is_cn ? '智能体会主动思考、发现任务并按计划自主完成' : 'Agent will proactively identify and complete tasks on schedule')
						: (is_cn ? '智能体仅在收到任务指派时工作' : 'Agent will only work when assigned tasks')
					}
				</div>
			</div>
		</div>
	)
}

export default BasicPanel
