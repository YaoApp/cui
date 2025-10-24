import { useState } from 'react'
import { Form, Modal } from 'antd'
import { Button } from '@/components/ui'
import { Input, Select } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { TeamConfig, TeamRole } from '@/openapi/user/types'
import styles from './index.less'

interface InviteFormProps {
	visible: boolean
	onClose: () => void
	onInvite: (values: { email: string; role: string }) => Promise<void>
	onGenerateLink: (role: string) => Promise<void>
	inviteLink: string
	setInviteLink: (link: string) => void
	generatingLink: boolean
	inviting: boolean
	config: TeamConfig | null
	configLoading: boolean
	is_cn: boolean
	locale: string
}

const InviteForm = ({
	visible,
	onClose,
	onInvite,
	onGenerateLink,
	inviteLink,
	setInviteLink,
	generatingLink,
	inviting,
	config,
	configLoading,
	is_cn,
	locale
}: InviteFormProps) => {
	const [form] = Form.useForm()
	const [linkRole, setLinkRole] = useState<string>('')

	// 从配置中获取角色选项（过滤掉隐藏的角色）
	const roleOptions =
		config?.roles
			?.filter((role) => !role.hidden)
			.map((role) => ({
				label: role.label,
				value: role.role_id
			})) || []

	// 获取默认角色
	const defaultRole = config?.roles?.find((role) => role.default)?.role_id || 'team_member'

	// 解析过期时间字符串（如 "7d", "168h", "10080m"）为友好的显示文本
	const parseExpiryText = (expiry?: string): string => {
		if (!expiry) return is_cn ? '7天' : '7 days' // 默认值

		// 解析时间单位
		const match = expiry.match(/^(\d+)([dhms])$/)
		if (!match) return expiry

		const value = parseInt(match[1])
		const unit = match[2]

		switch (unit) {
			case 'd':
				return is_cn ? `${value}天` : `${value} day${value > 1 ? 's' : ''}`
			case 'h':
				return is_cn ? `${value}小时` : `${value} hour${value > 1 ? 's' : ''}`
			case 'm':
				return is_cn ? `${value}分钟` : `${value} minute${value > 1 ? 's' : ''}`
			case 's':
				return is_cn ? `${value}秒` : `${value} second${value > 1 ? 's' : ''}`
			default:
				return expiry
		}
	}

	const copyInviteLink = () => {
		if (inviteLink) {
			navigator.clipboard.writeText(inviteLink).then(() => {
				alert(is_cn ? '邀请链接已复制到剪贴板' : 'Invite link copied to clipboard')
			})
		}
	}

	const handleClose = () => {
		onClose()
		form.resetFields()
		setInviteLink('')
	}

	const handleInvite = async (values: { email: string; role: string }) => {
		await onInvite(values)
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-person_add' size={16} className={styles.titleIcon} />
						<span className={styles.modalTitle}>
							{is_cn ? '邀请团队成员' : 'Invite Team Member'}
						</span>
					</div>
					<div className={styles.closeButton} onClick={handleClose}>
						<Icon name='material-close' size={16} className={styles.closeIcon} />
					</div>
				</div>
			}
			open={visible}
			onCancel={handleClose}
			footer={null}
			width={480}
			className={styles.inviteModal}
			destroyOnClose
			closable={false}
		>
			<div className={styles.modalContent}>
				<div className={styles.inviteOptions}>
					{/* 邮箱邀请方式 */}
					<div className={styles.inviteSection}>
						<h5>{is_cn ? '通过邮箱邀请' : 'Invite by Email'}</h5>
						<Form form={form} layout='vertical' onFinish={handleInvite}>
							<Form.Item
								name='email'
								label={is_cn ? '邮箱地址' : 'Email Address'}
								rules={[
									{
										required: true,
										message: is_cn
											? '请输入邮箱地址'
											: 'Please enter email address'
									},
									{
										type: 'email',
										message: is_cn
											? '请输入有效的邮箱地址'
											: 'Please enter a valid email address'
									}
								]}
							>
								<Input
									schema={{
										type: 'string',
										placeholder: is_cn
											? '请输入邮箱地址'
											: 'Enter email address'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>

							<Form.Item
								name='role'
								label={is_cn ? '角色权限' : 'Role'}
								initialValue={defaultRole}
								rules={[
									{
										required: true,
										message: is_cn ? '请选择角色权限' : 'Please select role'
									}
								]}
							>
								<Select
									schema={{
										type: 'string',
										enum: roleOptions,
										placeholder: is_cn ? '选择角色权限' : 'Select role'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>

							<div className={styles.emailInviteActions}>
								<button
									type='submit'
									className={styles.submitButton}
									disabled={inviting || configLoading}
								>
									{inviting && (
										<Icon
											name='material-refresh'
											size={12}
											className={styles.buttonLoadingIcon}
										/>
									)}
									{is_cn ? '发送邀请' : 'Send Invitation'}
								</button>
							</div>
						</Form>
					</div>

					<div className={styles.divider}>
						<span>{is_cn ? '或' : 'OR'}</span>
					</div>

					{/* 邀请链接方式 */}
					<div className={styles.inviteSection}>
						<h5>{is_cn ? '生成邀请链接' : 'Generate Invite Link'}</h5>
						<p className={styles.linkDescription}>
							{is_cn
								? '生成一个邀请链接，可以分享给多个人使用'
								: 'Generate an invite link that can be shared with multiple people'}
						</p>

						<div className={styles.linkGenerate}>
							<Select
								schema={{
									type: 'string',
									enum: roleOptions,
									placeholder: is_cn ? '选择角色权限' : 'Select role'
								}}
								value={linkRole || defaultRole}
								onChange={(value) => setLinkRole(value as string)}
								error=''
								hasError={false}
							/>
							<Button
								type='primary'
								onClick={() => onGenerateLink(linkRole || defaultRole)}
								loading={generatingLink}
								disabled={generatingLink || configLoading}
								icon={<Icon name='material-link' size={14} />}
							>
								{is_cn ? '生成链接' : 'Generate Link'}
							</Button>
						</div>

						{inviteLink && (
							<div className={styles.generatedLink}>
								<div className={styles.linkDisplay}>
									<code className={styles.linkText}>{inviteLink}</code>
								</div>
								<div className={styles.linkFooter}>
									<p className={styles.linkNote}>
										{is_cn
											? `此链接将在${parseExpiryText(
													config?.invite?.expiry
											  )}后过期`
											: `This link will expire in ${parseExpiryText(
													config?.invite?.expiry
											  )}`}
									</p>
									<div className={styles.linkActions}>
										<Button
											type='default'
											size='small'
											onClick={copyInviteLink}
										>
											{is_cn ? '复制' : 'Copy'}
										</Button>
										<Button
											type='default'
											size='small'
											onClick={() => setInviteLink('')}
										>
											{is_cn ? '取消' : 'Cancel'}
										</Button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className={styles.modalActions}>
					<Button onClick={handleClose} disabled={inviting || generatingLink}>
						{is_cn ? '关闭' : 'Close'}
					</Button>
				</div>
			</div>
		</Modal>
	)
}

export default InviteForm
