import { Tabs, Spin } from 'antd'
import { getLocale } from '@umijs/max'
import { App } from '@/types'
import Tag from '@/neo/components/AIChat/Tag'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface Message {
	role: 'system' | 'user' | 'assistant' | 'developer'
	content: string
}

interface ViewProps {
	data: App.Assistant
	connectors: any
}

const View = ({ data, connectors }: ViewProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const getRoleLabel = (role: string) => {
		switch (role) {
			case 'system':
				return is_cn ? '系统' : 'System'
			case 'user':
				return is_cn ? '用户' : 'User'
			case 'assistant':
				return is_cn ? '智能体' : 'Assistant'
			case 'developer':
				return is_cn ? '开发者' : 'Developer'
			default:
				return role
		}
	}

	const renderGeneral = () => (
		<div className={styles.viewSection}>
			<div className={styles.fieldGroup}>
				<div className={styles.fieldItem}>
					<div className={styles.fieldLabel}>{is_cn ? '智能体名称' : 'Assistant Name'}</div>
					<div className={styles.fieldValue}>{data.name || '-'}</div>
				</div>

				<div className={styles.fieldItem}>
					<div className={styles.fieldLabel}>{is_cn ? '标签' : 'Tags'}</div>
					<div className={styles.fieldValue}>
						{Array.isArray(data.tags) && data.tags.length > 0 ? (
							<div className={styles.tagsDisplay}>
								{data.tags.map((tag: string, index: number) => (
									<Tag key={index} variant='auto'>
										{tag}
									</Tag>
								))}
							</div>
						) : (
							<span className={styles.emptyValue}>-</span>
						)}
					</div>
				</div>

				<div className={styles.fieldItem}>
					<div className={styles.fieldLabel}>{is_cn ? '描述' : 'Description'}</div>
					<div className={styles.fieldValue}>{data.description || '-'}</div>
				</div>

				<div className={styles.fieldItem}>
					<div className={styles.fieldLabel}>{is_cn ? 'AI 连接器' : 'AI Connector'}</div>
					<div className={styles.fieldValue}>
						{data.connector ? connectors.mapping[data.connector] || data.connector : '-'}
					</div>
				</div>

				<div className={styles.fieldRow}>
					<div className={styles.fieldItem}>
						<div className={styles.fieldLabel}>{is_cn ? '自动化' : 'Automation'}</div>
						<div className={styles.fieldValue}>
							{data.automated === true ? (
								<span className={styles.statusBadge}>
									<Icon name='icon-check' size={14} color='var(--color_success)' />
									{is_cn ? '启用' : 'Enable'}
								</span>
							) : (
								<span className={styles.statusBadge}>
									<Icon name='icon-x' size={14} color='var(--color_text_grey)' />
									{is_cn ? '禁用' : 'Disable'}
								</span>
							)}
						</div>
					</div>

					<div className={styles.fieldItem}>
						<div className={styles.fieldLabel}>{is_cn ? '提及' : 'Mentions'}</div>
						<div className={styles.fieldValue}>
							{data.mentionable === true ? (
								<span className={styles.statusBadge}>
									<Icon name='icon-check' size={14} color='var(--color_success)' />
									{is_cn ? '允许' : 'Allow'}
								</span>
							) : (
								<span className={styles.statusBadge}>
									<Icon name='icon-x' size={14} color='var(--color_text_grey)' />
									{is_cn ? '不允许' : 'Disallow'}
								</span>
							)}
						</div>
					</div>
				</div>

				<div className={styles.fieldItem}>
					<div className={styles.fieldLabel}>{is_cn ? '对话占位符' : 'Chat Placeholder'}</div>
					<div className={styles.fieldValue}>
						{data.placeholder && Object.keys(data.placeholder).length > 0 ? (
							<div className={styles.placeholderDisplay}>
								{data.placeholder.title && (
									<div className={styles.placeholderItem}>
										<span className={styles.placeholderKey}>
											{is_cn ? '标题' : 'Title'}:
										</span>
										<span>{data.placeholder.title}</span>
									</div>
								)}
								{data.placeholder.description && (
									<div className={styles.placeholderItem}>
										<span className={styles.placeholderKey}>
											{is_cn ? '描述' : 'Description'}:
										</span>
										<span>{data.placeholder.description}</span>
									</div>
								)}
								{data.placeholder.prompts && data.placeholder.prompts.length > 0 && (
									<div className={styles.placeholderItem}>
										<span className={styles.placeholderKey}>
											{is_cn ? '提示词' : 'Prompts'}:
										</span>
										<div className={styles.promptsList}>
											{data.placeholder.prompts.map(
												(prompt: string, idx: number) => (
													<div key={idx} className={styles.promptChip}>
														{prompt}
													</div>
												)
											)}
										</div>
									</div>
								)}
							</div>
						) : (
							<span className={styles.emptyValue}>-</span>
						)}
					</div>
				</div>
			</div>
		</div>
	)

	const renderPrompts = () => (
		<div className={styles.viewSection}>
			<div className={styles.fieldGroup}>
				<div className={styles.fieldItem}>
					<div className={styles.fieldLabel}>{is_cn ? '消息' : 'Messages'}</div>
					<div className={styles.fieldValue}>
						{Array.isArray(data.prompts) && data.prompts.length > 0 ? (
							<div className={styles.messagesList}>
								{data.prompts.map((message: Message, index: number) => (
									<div key={index} className={styles.messageItem}>
										<div className={styles.messageHeader}>
											<span className={styles.messageRole}>
												{getRoleLabel(message.role)}
											</span>
										</div>
										<div className={styles.messageContent}>{message.content}</div>
									</div>
								))}
							</div>
						) : (
							<span className={styles.emptyValue}>{is_cn ? '暂无消息' : 'No messages'}</span>
						)}
					</div>
				</div>

				<div className={styles.fieldItem}>
					<div className={styles.fieldLabel}>{is_cn ? '选项' : 'Options'}</div>
					<div className={styles.fieldValue}>
						{(() => {
							const optionsData = data.option || data.options || {}
							return Object.keys(optionsData).length > 0 ? (
								<div className={styles.optionsList}>
									{Object.entries(optionsData).map(([key, value]) => (
										<div key={key} className={styles.optionItem}>
											<span className={styles.optionKey}>{key}:</span>
											<span className={styles.optionValue}>{String(value)}</span>
										</div>
									))}
								</div>
							) : (
								<span className={styles.emptyValue}>{is_cn ? '暂无选项' : 'No options'}</span>
							)
						})()}
					</div>
				</div>
			</div>
		</div>
	)

	const items = [
		{
			key: 'general',
			label: is_cn ? '基本信息' : 'General',
			children: renderGeneral()
		},
		{
			key: 'prompts',
			label: is_cn ? '提示词' : 'Prompts',
			children: renderPrompts()
		}
	]

	return (
		<div className={styles.viewContainer}>
			<Tabs items={items} defaultActiveKey='general' className={styles.viewTabs} size='large' type='card' />
		</div>
	)
}

export default View

