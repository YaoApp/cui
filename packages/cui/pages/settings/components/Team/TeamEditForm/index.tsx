import { Form, FormInstance } from 'antd'
import { Input, Avatar } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import { UserTeamDetail } from '@/openapi/user/types'
import styles from './index.less'

interface TeamEditFormProps {
	form: FormInstance
	team: UserTeamDetail | null
	onFinish: (values: { name: string; description?: string; avatar?: string }) => Promise<void>
	is_cn: boolean
}

const TeamEditForm = ({ form, team, onFinish, is_cn }: TeamEditFormProps) => {
	return (
		<div className={styles.editTeamContainer}>
			{/* Avatar Section - Always Centered */}
			<div className={styles.avatarSection}>
				<Avatar
					schema={{
						type: 'string',
						variant: 'large',
						userName: team?.name || '',
						placeholder: is_cn ? '更换团队头像' : 'Change Team Avatar',
						readOnly: false
					}}
					value={undefined}
					onChange={(value) => {
						form.setFieldsValue({ avatar: value })
					}}
					error=''
					hasError={false}
				/>
			</div>

			{/* Profile Fields */}
			<Form form={form} onFinish={onFinish}>
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
					<Form.Item name='avatar' style={{ display: 'none' }} />
				</div>
			</Form>
		</div>
	)
}

export default TeamEditForm
