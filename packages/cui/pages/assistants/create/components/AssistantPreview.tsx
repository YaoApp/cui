import Icon from '@/widgets/Icon'
import { Button } from '@/components/ui'
import UserAvatar from '@/widgets/UserAvatar'
import styles from './AssistantPreview.less'

export interface AssistantPreviewData {
	name: string
	description: string
	avatar?: string
	agents?: string[]
	mcp_tools?: string[]
	agentNames?: Record<string, string>
	mcpToolNames?: Record<string, string>
}

interface AssistantPreviewProps {
	data: AssistantPreviewData
	is_cn: boolean
	onChat: () => void
	onViewDetail: () => void
	loading?: boolean
}

const AssistantPreview = ({ data, is_cn, onChat, onViewDetail, loading = false }: AssistantPreviewProps) => {
	const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${data.name || 'assistant'}`

	return (
		<div className={styles.previewContainer}>
			<div className={styles.previewCard}>
				<div className={styles.cardHeader}>
					<Icon name='material-check_circle' size={20} className={styles.successIcon} />
					<span className={styles.successTitle}>
						{is_cn ? '智能体创建成功' : 'Assistant Created Successfully'}
					</span>
				</div>

				<div className={styles.cardBody}>
					<div className={styles.avatarSection}>
						<UserAvatar
							size='xl'
							data={{
								name: data.name,
								avatar: data.avatar || defaultAvatar
							}}
						/>
					</div>

					<div className={styles.infoSection}>
						<h3 className={styles.assistantName}>{data.name}</h3>
						<p className={styles.assistantDescription}>{data.description}</p>
					</div>

					<div className={styles.capabilities}>
						<div className={styles.capabilitySection}>
							<div className={styles.capabilityLabel}>
								<Icon name='material-psychology' size={16} />
								<span>{is_cn ? '可访问的智能体' : 'Accessible Agents'}</span>
							</div>
							{data.agents && data.agents.length > 0 ? (
								<div className={styles.capabilityList}>
									{data.agents.map((agentId, index) => (
										<div key={index} className={styles.capabilityItem}>
											<Icon name='material-circle' size={6} />
											<span>{data.agentNames?.[agentId] || agentId}</span>
										</div>
									))}
								</div>
							) : (
								<div className={styles.emptyHint}>
									{is_cn ? '暂无可访问的智能体' : 'No accessible agents'}
								</div>
							)}
						</div>

						<div className={styles.capabilitySection}>
							<div className={styles.capabilityLabel}>
								<Icon name='material-construction' size={16} />
								<span>{is_cn ? '可使用的工具' : 'Available Tools'}</span>
							</div>
							{data.mcp_tools && data.mcp_tools.length > 0 ? (
								<div className={styles.capabilityList}>
									{data.mcp_tools.map((toolId, index) => (
										<div key={index} className={styles.capabilityItem}>
											<Icon name='material-circle' size={6} />
											<span>{data.mcpToolNames?.[toolId] || toolId}</span>
										</div>
									))}
								</div>
							) : (
								<div className={styles.emptyHint}>
									{is_cn ? '暂无可使用的工具' : 'No available tools'}
								</div>
							)}
						</div>
					</div>
				</div>

				<div className={styles.cardFooter}>
					<Button
						type='primary'
						size='medium'
						onClick={onChat}
						loading={loading}
						disabled={loading}
						icon={<Icon name='icon-message-circle' size={16} />}
					>
						{is_cn ? '聊天' : 'Chat'}
					</Button>
					<Button
						size='medium'
						onClick={onViewDetail}
						disabled={loading}
						icon={<Icon name='material-edit' size={16} />}
					>
						{is_cn ? '修改' : 'Edit'}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default AssistantPreview

