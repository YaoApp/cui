import { Form } from 'antd'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/inputs'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface CreateTeamFormProps {
	onFinish: (values: { name: string; description?: string }) => Promise<void>
	loading: boolean
	configLoading: boolean
	is_cn: boolean
}

const CreateTeamForm = ({ onFinish, loading, configLoading, is_cn }: CreateTeamFormProps) => {
	return (
		<div className={styles.promptPanel}>
			<div className={styles.promptContainer}>
				<div className={styles.promptContent}>
					<div className={styles.promptIcon}>
						<Icon name='material-group_add' size={48} />
					</div>
					<h3 className={styles.promptTitle}>{is_cn ? '创建您的团队' : 'Create Your Team'}</h3>
					<p className={styles.promptDescription}>
						{is_cn
							? '设置团队名称和简介，开始与他人协作'
							: 'Set up your team name and description to start collaborating'}
					</p>
					<div className={styles.promptActions}>
						<Form onFinish={onFinish} layout='vertical' className={styles.createTeamForm}>
							<Form.Item
								name='name'
								label={is_cn ? '团队名称' : 'Team Name'}
								rules={[
									{
										required: true,
										message: is_cn ? '请输入团队名称' : 'Please enter team name'
									}
								]}
							>
								<Input
									schema={{
										type: 'string',
										placeholder: is_cn ? '请输入团队名称' : 'Enter team name'
									}}
									error=''
									hasError={false}
								/>
							</Form.Item>
							<Form.Item name='description' label={is_cn ? '团队简介' : 'Team Description'}>
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
							<div className={styles.createTeamActions}>
								<Button
									type='primary'
									htmlType='submit'
									loading={loading || configLoading}
									disabled={loading || configLoading}
								>
									{is_cn ? '创建团队' : 'Create Team'}
								</Button>
							</div>
						</Form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CreateTeamForm
