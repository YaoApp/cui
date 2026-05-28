import { useEffect, useState, useRef } from 'react'
import { useParams, history, getLocale } from '@umijs/max'
import { Spin, Breadcrumb, Tooltip, Popconfirm, message } from 'antd'
import { App } from '@/types'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import { Button } from '@/components/ui'
import DetailMenu from './components/DetailMenu'
import Overview from './components/Overview'
import SkillsTab from './components/SkillsTab'
import SecretsTab from './components/SecretsTab'
import SandboxTab from './components/SandboxTab'
import ApiAccess from './components/ApiAccess'
import styles from './index.less'
import viewStyles from './components/View/index.less'
import { useGlobal } from '@/context/app'
import { Agent } from '@/openapi/agent'

const AssistantDetail = () => {
	const params = useParams<{ '*': string }>()
	const id = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const global = useGlobal()
	const { connectors } = global

	const [loading, setLoading] = useState(true)
	const [assistantData, setAssistantData] = useState<App.Assistant | null>(null)
	const [avatarUrl, setAvatarUrl] = useState<string>('')
	const [activeSection, setActiveSection] = useState('overview')
	const containerRef = useRef<HTMLDivElement>(null)
	const fetchedRef = useRef(false)
	const previousIdRef = useRef<string>('')
	const [apiClient, setApiClient] = useState<Agent | null>(null)

	const name = assistantData?.name || ''
	const readonly = assistantData?.readonly === true
	const sandbox = !!assistantData?.sandbox

	const chatDisabled = sandbox && (assistantData as any)?.runnable === false

	useEffect(() => {
		if (window.$app?.openapi) {
			setApiClient(new Agent(window.$app.openapi))
		} else {
			console.error('OpenAPI not initialized')
			message.error(is_cn ? 'API未初始化' : 'API not initialized')
		}
	}, [is_cn])

	useEffect(() => {
		const handleDelete = async () => {
			if (readonly || !apiClient) return
			try {
				const response = await apiClient.assistants.Delete(id)
				if (window.$app.openapi.IsError(response)) {
					throw new Error(response.error?.error_description || 'Failed to delete assistant')
				}
				message.success(is_cn ? '专家删除成功' : 'Expert deleted successfully')
				fetchedRef.current = false
				previousIdRef.current = ''
				history.push('/assistants')
			} catch (error) {
				message.error(is_cn ? '删除专家失败' : 'Failed to delete expert')
			}
		}

		window.$app.Event.on('assistant/delete', handleDelete)
		return () => {
			window.$app.Event.off('assistant/delete', handleDelete)
		}
	}, [id, readonly, is_cn, apiClient])

	useEffect(() => {
		const fetchAssistant = async () => {
			if (!apiClient) return
			setLoading(true)

			try {
				if (!id) {
					message.error(is_cn ? '无效的专家ID' : 'Invalid expert ID')
					history.push('/assistants')
					return
				}

				const locale_param = is_cn ? 'zh-cn' : 'en-us'
				const response = await apiClient.assistants.Get(id, locale_param)

				if (window.$app.openapi.IsError(response)) {
					message.error(is_cn ? '未找到专家' : 'Expert not found')
					history.push('/assistants')
					return
				}

				const data = window.$app.openapi.GetData(response)
				if (!data) {
					message.error(is_cn ? '未找到专家' : 'Expert not found')
					history.push('/assistants')
					return
				}

				if (data.built_in !== undefined) data.built_in = Boolean(data.built_in)
				if (data.readonly !== undefined) data.readonly = Boolean(data.readonly)

				setAssistantData(data)
				setAvatarUrl(data.avatar || '')
				fetchedRef.current = true
			} catch (error) {
				message.error(is_cn ? '加载专家数据失败' : 'Failed to load expert data')
			}

			setLoading(false)
		}

		if (id && apiClient) {
			if (previousIdRef.current !== id) {
				fetchedRef.current = false
				previousIdRef.current = id
			}
			fetchAssistant()
		}
	}, [id, is_cn, apiClient])

	const handleSectionChange = (section: string) => {
		setActiveSection(section)
		containerRef.current?.scrollTo({ top: 0 })
	}

	const handleBack = () => {
		fetchedRef.current = false
		previousIdRef.current = ''
		history.push('/assistants')
	}

	const handleChatClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (chatDisabled) return
		window.$app.Event.emit('chat/newWithAssistant', id)
	}

	const canDelete = !readonly && !assistantData?.built_in

	if (loading || !assistantData) {
		return (
			<div className={styles.scrollWrap}>
				<div className={styles.loading}>
					<Spin />
				</div>
			</div>
		)
	}

	return (
		<div className={styles.scrollWrap} ref={containerRef}>
		<div className={styles.container}>
			<div className={styles.breadcrumbContainer}>
				<div className={styles.breadcrumbLeft}>
					<span className={styles.backArrow} onClick={handleBack}>
						<Icon name='material-arrow_back' size={16} />
					</span>
					<Breadcrumb>
						<Breadcrumb.Item>
							<a
								href='/assistants'
								onClick={(e) => {
									e.preventDefault()
									handleBack()
								}}
							>
								{is_cn ? '专家列表' : 'Experts'}
							</a>
						</Breadcrumb.Item>
						<Breadcrumb.Item>{name || (is_cn ? '专家详情' : 'Expert Detail')}</Breadcrumb.Item>
					</Breadcrumb>
				</div>
			</div>

			<div className={styles.content}>
				<DetailMenu active={activeSection} onChange={handleSectionChange} onBack={handleBack} />
				<div className={styles.main}>
					<div className={viewStyles.profileHeader}>
						<Tooltip
							title={
								chatDisabled
									? is_cn ? '需要配置计算节点' : 'Compute node required'
									: is_cn ? '开始聊天' : 'Start chat'
							}
						>
							<div
								className={`${viewStyles.avatarWrap} ${chatDisabled ? viewStyles.avatarDisabled : ''}`}
								onClick={chatDisabled ? undefined : handleChatClick}
							>
								<div className={viewStyles.avatarDefault}>
									<UserAvatar
										size='lg'
										shape='circle'
										displayType='avatar'
										data={{
											id: assistantData.assistant_id || '',
											name: assistantData.name || '',
											avatar: avatarUrl
										}}
									/>
								</div>
								{!chatDisabled && (
									<div className={viewStyles.avatarChat}>
										<Icon name='icon-message-circle' size={30} />
									</div>
								)}
							</div>
						</Tooltip>
						<div className={viewStyles.profileInfo}>
							<h1 className={viewStyles.profileName}>{assistantData.name}</h1>
							{assistantData.description && (
								<div className={viewStyles.profileDesc}>{assistantData.description}</div>
							)}
						</div>
						<div className={viewStyles.profileActions}>
							{activeSection === 'overview' ? (
								<>
									{canDelete && (
										<Popconfirm
											title={is_cn ? '确认删除此专家？删除后不可恢复' : 'Delete this expert? This cannot be undone'}
											onConfirm={() => window.$app.Event.emit('assistant/delete')}
											okText={is_cn ? '确认' : 'Confirm'}
											cancelText={is_cn ? '取消' : 'Cancel'}
										>
											<Button
												type='danger'
												size='small'
												icon={<Icon name='material-delete' size={12} />}
											>
												{is_cn ? '删除' : 'Delete'}
											</Button>
										</Popconfirm>
									)}
									<Tooltip
										title={
											chatDisabled
												? is_cn ? '需要配置计算节点' : 'Compute node required'
												: undefined
										}
									>
										<Button
											type='primary'
											size='small'
											icon={<Icon name='icon-message-circle' size={14} />}
											onClick={handleChatClick}
											disabled={chatDisabled}
										>
											{is_cn ? '聊天' : 'Chat'}
										</Button>
									</Tooltip>
								</>
							) : (
								<span className={viewStyles.sectionLabel}>
									<Icon name={
										activeSection === 'skills' ? 'material-auto_fix_high'
											: activeSection === 'secrets' ? 'material-key'
											: activeSection === 'sandbox' ? 'material-computer'
											: 'material-code'
									} size={16} />
									{activeSection === 'skills' ? (is_cn ? '技能' : 'Skills')
										: activeSection === 'secrets' ? (is_cn ? '密钥' : 'Secrets')
										: activeSection === 'sandbox' ? (is_cn ? '沙箱' : 'Sandbox')
										: (is_cn ? '集成' : 'Integrations')
									}
								</span>
							)}
						</div>
					</div>

					{activeSection === 'overview' && (
						<Overview data={assistantData} connectors={connectors} />
					)}
					{activeSection === 'skills' && <SkillsTab assistantId={id} />}
					{activeSection === 'secrets' && <SecretsTab assistantId={id} />}
					{activeSection === 'sandbox' && <SandboxTab assistantId={id} />}
					{activeSection === 'integrations' && (
						<ApiAccess data={assistantData} is_cn={is_cn} />
					)}
				</div>
			</div>
		</div>
		</div>
	)
}

export default AssistantDetail
