import React, { useState, useEffect, useMemo } from 'react'
import { Tooltip } from 'antd'
import { Input, Select, RadioGroup } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
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
 * - robot_email: Email (full email address string, e.g. "robot@ai.yaoagents.com")
 * - role_id: Role
 * - bio: Description
 * - manager_id: Reports To
 * - autonomous_mode: Work Mode
 */
const BasicPanel: React.FC<BasicPanelProps> = ({ robot, formData, onChange, is_cn, configData }) => {
	const [errors, setErrors] = useState<Record<string, string>>({})
	
	// Local state for email prefix and domain (for UI split display)
	const [emailPrefix, setEmailPrefix] = useState('')
	const [emailDomain, setEmailDomain] = useState('')

	// Get options from configData
	const emailDomains = useMemo(() => configData?.emailDomains || [], [configData?.emailDomains])
	const roles = useMemo(() => configData?.roles || [], [configData?.roles])
	const managers = useMemo(() => configData?.managers || [], [configData?.managers])

	// Parse robot_email into prefix and domain when formData changes
	useEffect(() => {
		const email = formData.robot_email || ''
		const atIndex = email.indexOf('@')
		if (atIndex > 0) {
			// Valid email like "robot@ai.yaoagents.com"
			setEmailPrefix(email.substring(0, atIndex))
			setEmailDomain(`@${email.substring(atIndex + 1)}`)
		} else if (atIndex === 0) {
			// Only domain like "@ai.yaoagents.com" (invalid, clear prefix)
			setEmailPrefix('')
			setEmailDomain(email)
		} else if (email === '') {
			// Empty email - keep prefix empty, set default domain if available
			setEmailPrefix('')
			if (emailDomains.length > 0 && !emailDomain) {
				setEmailDomain(emailDomains[0].value)
			}
		}
	}, [formData.robot_email, emailDomains])

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

	// Handle email prefix change - combine with domain and update formData
	const handleEmailPrefixChange = (value: any) => {
		const prefix = String(value || '')
		setEmailPrefix(prefix)
		// Only update robot_email if we have both prefix and domain
		if (prefix && emailDomain) {
			onChange('robot_email', `${prefix}${emailDomain}`)
		}
		if (errors.robot_email) {
			setErrors(prev => {
				const newErrors = { ...prev }
				delete newErrors.robot_email
				return newErrors
			})
		}
	}

	// Handle email domain change - combine with prefix and update formData
	const handleEmailDomainChange = (value: any) => {
		const domain = String(value || '')
		setEmailDomain(domain)
		// Only update robot_email if we have both prefix and domain
		if (emailPrefix && domain) {
			onChange('robot_email', `${emailPrefix}${domain}`)
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
