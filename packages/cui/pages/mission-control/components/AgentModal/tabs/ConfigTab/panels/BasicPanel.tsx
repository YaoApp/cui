import React, { useState, useEffect, useRef } from 'react'
import { Tooltip } from 'antd'
import { Input, Select, TextArea, RadioGroup } from '@/components/ui/inputs'
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
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [emailPrefix, setEmailPrefix] = useState('')
	const [emailDomain, setEmailDomain] = useState('@example.com')

	// TODO: Load from API
	const [roles, setRoles] = useState<Array<{ label: string; value: string }>>([])
	const [managers, setManagers] = useState<Array<{ label: string; value: string }>>([])
	const [emailDomains, setEmailDomains] = useState<Array<{ label: string; value: string }>>([])
	const [loading, setLoading] = useState(false)

	// Use ref to track if data has been loaded
	const dataLoadedRef = useRef(false)

	// Initialize form data from robot
	useEffect(() => {
		if (robot && !dataLoadedRef.current) {
			dataLoadedRef.current = true
			
			// Parse email
			const email = robot.description || '' // TODO: Use actual robot_email field
			const atIndex = email.indexOf('@')
			if (atIndex > 0) {
				setEmailPrefix(email.substring(0, atIndex))
				setEmailDomain(`@${email.substring(atIndex + 1)}`)
			}

			// TODO: Load actual data from robot config
			// For now, set mock data
			onChange('display_name', robot.display_name || '')
			onChange('bio', robot.description || '')
			onChange('autonomous_mode', false) // Default to on-demand
		}
	}, [robot])

	// Mock data - TODO: Replace with API calls
	useEffect(() => {
		// Mock roles
		setRoles([
			{ label: is_cn ? '团队成员' : 'Team Member', value: 'team_member' },
			{ label: is_cn ? '开发工程师' : 'Developer', value: 'developer' },
			{ label: is_cn ? '设计师' : 'Designer', value: 'designer' },
			{ label: is_cn ? '产品经理' : 'Product Manager', value: 'product_manager' }
		])

		// Mock managers
		setManagers([
			{ label: 'John Smith (john@example.com)', value: 'member_001' },
			{ label: 'Jane Doe (jane@example.com)', value: 'member_002' }
		])

		// Mock email domains
		setEmailDomains([
			{ label: 'example.com', value: '@example.com' },
			{ label: 'company.ai', value: '@company.ai' }
		])
	}, [is_cn])

	// Handle field change with error clearing
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

	// Handle email prefix change
	const handleEmailPrefixChange = (value: any) => {
		setEmailPrefix(String(value))
		// Combine and update
		onChange('robot_email', `${value}${emailDomain}`)
		if (errors.robot_email) {
			setErrors(prev => {
				const newErrors = { ...prev }
				delete newErrors.robot_email
				return newErrors
			})
		}
	}

	// Handle email domain change
	const handleEmailDomainChange = (value: any) => {
		setEmailDomain(String(value))
		onChange('robot_email', `${emailPrefix}${value}`)
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

			{/* Email */}
			<div className={styles.formItem}>
				<label className={styles.formLabel}>
					<span className={styles.required}>*</span>
					{is_cn ? '邮箱地址' : 'Email Address'}
					<Tooltip
						title={is_cn
							? '智能体可通过此邮箱接收任务和发送工作报告'
							: 'The agent can receive tasks and send reports through this email'
						}
						placement='top'
					>
						<span className={styles.helpIconWrapper}>
							<Icon name='material-help' size={14} className={styles.helpIcon} />
						</span>
					</Tooltip>
				</label>
				<div className={styles.emailInput}>
					<Input
						value={emailPrefix}
						onChange={handleEmailPrefixChange}
						schema={{
							type: 'string',
							placeholder: is_cn ? '邮箱前缀' : 'Email prefix'
						}}
						error=''
						hasError={!!errors.robot_email}
					/>
					<span className={styles.emailAt}>@</span>
					<Select
						value={emailDomain}
						onChange={handleEmailDomainChange}
						schema={{
							type: 'string',
							enum: emailDomains,
							placeholder: is_cn ? '选择域名' : 'Select domain'
						}}
						tabIndex={-1}
					/>
				</div>
				{errors.robot_email && (
					<div className={styles.formError}>{errors.robot_email}</div>
				)}
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
