import { Form, FormInstance } from 'antd'
import { Input } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import { UserTeamDetail } from '@/openapi/user/types'
import styles from './index.less'

interface TeamEditFormProps {
	form: FormInstance
	team: UserTeamDetail | null
	onFinish: (values: { name: string; description?: string; avatar?: string }) => Promise<void>
	is_cn: boolean
}

const TeamEditForm = ({ form, team, onFinish, is_cn }: TeamEditFormProps) => {
	// 监听表单的 avatar 字段变化
	const formAvatar = Form.useWatch('avatar', form)

	const handleAvatarUploadSuccess = (fileId: string, avatarWrapper: string) => {
		// avatarWrapper 是 wrapper 格式，如 __yao.attachment://file123
		form.setFieldsValue({ avatar: avatarWrapper })
	}

	return (
		<div className={styles.editTeamContainer}>
			{/* Avatar Section - Always Centered */}
			<div className={styles.avatarSection}>
				<UserAvatar
					mode='form'
					size='xl'
					shape='square'
					borderRadius={12}
					displayType='avatar'
					buttonText={is_cn ? '更换团队头像' : 'Change Team Avatar'}
					modalTitle={is_cn ? '设置团队头像' : 'Set Team Avatar'}
					data={{
						id: team?.team_id || '',
						name: team?.name || '',
						avatar: formAvatar || team?.logo // 优先使用表单字段的值
					}}
					onUploadSuccess={handleAvatarUploadSuccess}
				/>
			</div>

			{/* Profile Fields */}
			<Form
				form={form}
				onFinish={onFinish}
				initialValues={{
					name: team?.name || '',
					description: team?.description || '',
					avatar: team?.logo || ''
				}}
			>
				<div className={styles.fieldsContainer}>
					{/* Team Name Field */}
					<div className={styles.fieldItem}>
						<div className={styles.fieldIcon}>
							<Icon name='material-group' size={20} />
						</div>
						<div className={styles.fieldContent}>
							<div className={styles.fieldLabel}>{is_cn ? '团队名称' : 'Team Name'}</div>
							<Form.Item name='name' style={{ margin: 0 }}>
								<Input
									schema={{
										type: 'string',
										placeholder: is_cn ? '请输入团队名称' : 'Enter team name'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>
						</div>
					</div>

					{/* Team Description Field */}
					<div className={styles.fieldItem}>
						<div className={styles.fieldIcon}>
							<Icon name='material-description' size={20} />
						</div>
						<div className={styles.fieldContent}>
							<div className={styles.fieldLabel}>
								{is_cn ? '团队简介' : 'Team Description'}
							</div>
							<Form.Item name='description' style={{ margin: 0 }}>
								<Input
									schema={{
										type: 'string',
										placeholder: is_cn
											? '请输入团队简介'
											: 'Enter team description'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>
						</div>
					</div>

				{/* Hidden avatar field */}
				<Form.Item name='avatar' hidden noStyle>
					<input type='hidden' />
				</Form.Item>
				</div>
			</Form>
		</div>
	)
}

export default TeamEditForm
