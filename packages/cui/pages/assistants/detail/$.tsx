import { useEffect, useState, useRef } from 'react'
import { useParams, history, getLocale } from '@umijs/max'
import { Spin, Form, message, Tabs, Tooltip, Breadcrumb } from 'antd'
import { Button } from '@/components/ui'
import { App } from '@/types'
import Tag from '@/neo/components/AIChat/Tag'
import Icon from '@/widgets/Icon'
import UserAvatar from '@/widgets/UserAvatar'
import View from './components/View'
import Edit from './components/Edit'
import styles from './index.less'
import { useGlobal } from '@/context/app'
import { Agent } from '@/openapi/agent'

interface Message {
	role: 'system' | 'user' | 'assistant' | 'developer'
	content: string
}

const AssistantDetail = () => {
	const params = useParams<{ '*': string }>()
	const id = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const global = useGlobal()
	const { default_assistant, connectors } = global

	const [loading, setLoading] = useState(true)
	const [editing, setEditing] = useState(false)
	const [saving, setSaving] = useState(false)
	const [form] = Form.useForm()
	const [avatarUrl, setAvatarUrl] = useState<string>('')
	const [assistantData, setAssistantData] = useState<App.Assistant | null>(null)
	const [prompts, setPrompts] = useState<Message[]>([])
	const [options, setOptions] = useState<{ key: string; value: string }[]>([])
	const fetchedRef = useRef(false)
	const previousIdRef = useRef<string>('')
	const [apiClient, setApiClient] = useState<Agent | null>(null)

	// Get values directly from assistantData state - no Form.useWatch to avoid Ant Design bugs
	const name = assistantData?.name || ''
	const automated = assistantData?.automated === true // Only true if explicitly set to true
	const readonly = assistantData?.readonly === true
	const built_in = assistantData?.built_in === true
	const mentionable = assistantData?.mentionable === true
	const connector = assistantData?.connector || ''
	const tags = assistantData?.tags || []
	const description = assistantData?.description || ''

	// Initialize API client
	useEffect(() => {
		const initializeAPI = async () => {
			if (window.$app?.openapi) {
				const client = new Agent(window.$app.openapi)
				setApiClient(client)
			} else {
				console.error('OpenAPI not initialized')
				message.error(is_cn ? 'API未初始化' : 'API not initialized')
			}
		}

		initializeAPI()
	}, [is_cn])

	// Add event listener for delete action
	useEffect(() => {
		const handleDelete = async () => {
			if (readonly || !apiClient) return
			try {
				const response = await apiClient.assistants.Delete(id)
				if (window.$app.openapi.IsError(response)) {
					throw new Error(response.error?.error_description || 'Failed to delete assistant')
				}
				message.success(is_cn ? '智能体删除成功' : 'Assistant deleted successfully')
				fetchedRef.current = false
				previousIdRef.current = ''
				history.push('/assistants')
			} catch (error) {
				message.error(is_cn ? '删除智能体失败' : 'Failed to delete assistant')
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
					message.error(is_cn ? '无效的智能体ID' : 'Invalid assistant ID')
					history.push('/assistants')
					return
				}

				// For view mode (not editing), pass locale to get translated values
				// For edit mode, don't pass locale to get raw values
				const locale_param = !editing ? (is_cn ? 'zh-cn' : 'en-us') : undefined
				const response = await apiClient.assistants.Get(id, locale_param)

				if (window.$app.openapi.IsError(response)) {
					message.error(is_cn ? '未找到智能体' : 'Assistant not found')
					history.push('/assistants')
					return
				}

				const data = window.$app.openapi.GetData(response)

				if (!data) {
					message.error(is_cn ? '未找到智能体' : 'Assistant not found')
					history.push('/assistants')
					return
				}

				// Ensure built_in and readonly are properly processed as boolean values
				if (data.built_in !== undefined) {
					data.built_in = Boolean(data.built_in)
				}

				if (data.readonly !== undefined) {
					data.readonly = Boolean(data.readonly)
				}

				// Extract options from either 'option' or 'options' field
				const optionsData = data.option || data.options || {}

				setAssistantData(data)
				setAvatarUrl(data.avatar || '')
				setPrompts(data.prompts || [])
				setOptions(
					Object.entries(optionsData).map(([key, value]) => ({
						key,
						value: String(value)
					}))
				)

				// Set form values explicitly with all fields
				form.setFieldsValue({
					assistant_id: data.assistant_id,
					name: data.name,
					description: data.description,
					tags: data.tags,
					connector: data.connector,
					automated: data.automated,
					mentionable: data.mentionable,
					built_in: data.built_in,
					readonly: data.readonly,
					placeholder: data.placeholder,
					avatar: data.avatar,
					type: data.type
				})

				fetchedRef.current = true
			} catch (error) {
				message.error(is_cn ? '加载智能体数据失败' : 'Failed to load assistant data')
			}

			setLoading(false)
		}

		// Refetch when id, editing mode, or apiClient changes
		if (id && apiClient) {
			// If ID changed, reset fetchedRef
			if (previousIdRef.current !== id) {
				fetchedRef.current = false
				previousIdRef.current = id
			}
			fetchAssistant()
		}
	}, [id, is_cn, apiClient, editing]) // Include editing to refetch when mode changes

	const handleAvatarUploadSuccess = (fileId: string, avatarWrapper: string) => {
		// avatarWrapper is in format: __yao.attachment://file123
		setAvatarUrl(avatarWrapper)
		form.setFieldValue('avatar', avatarWrapper)
	}

	const handleBack = () => {
		// Reset refs before redirecting
		fetchedRef.current = false
		previousIdRef.current = ''
		history.push('/assistants')
	}

	const handleEdit = () => {
		setEditing(true)
	}

	const handleCancel = () => {
		// Refetch data when canceling to restore original values
		fetchedRef.current = false
		setEditing(false)
	}

	const handleFormChange = () => {
		// Update assistantData when form values change in edit mode
		if (editing) {
			const formValues = form.getFieldsValue()
			setAssistantData((prev) => ({
				...prev,
				...formValues
			}))
		}
	}

	const handleSubmit = async (values: App.Assistant) => {
		if (readonly || !apiClient) return

		try {
			setSaving(true)

			// Ensure built_in and readonly are properly processed as boolean values
			if (values.built_in !== undefined) {
				values.built_in = Boolean(values.built_in)
			}

			if (values.readonly !== undefined) {
				values.readonly = Boolean(values.readonly)
			}

			// Prepare the assistant data
			const assistantData = {
				...values,
				assistant_id: id,
				type: 'assistant',
				prompts: prompts || [],
				option: Object.fromEntries(options.map(({ key, value }) => [key, value])) || {}
			}

			const response = await apiClient.assistants.Save(assistantData)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to save assistant')
			}

			message.success(is_cn ? '智能体更新成功' : 'Assistant updated successfully')
			setEditing(false)

			// Refetch data to get the updated version
			fetchedRef.current = false
		} catch (error) {
			message.error(is_cn ? '更新智能体失败' : 'Failed to update assistant')
		} finally {
			setSaving(false)
		}
	}

	// Handle chat button click to trigger new chat event
	const handleChatClick = (e: React.MouseEvent) => {
		e.stopPropagation()

		const options: App.NewChatOptions = {
			assistant: {
				assistant_id: id,
				assistant_name: name || '',
				assistant_avatar: avatarUrl,
				assistant_deleteable: id !== default_assistant.assistant_id
			},
			placeholder: assistantData?.placeholder || undefined
		}

		// Trigger the new chat event
		window.$app.Event.emit('app/neoNewChat', options)
	}

	if (loading || !assistantData) {
		return (
			<div className={styles.loading}>
				<Spin size='large' />
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<div className={styles.breadcrumbContainer}>
				<Breadcrumb>
					<Breadcrumb.Item>
						<a
							href='/assistants'
							onClick={(e) => {
								e.preventDefault()
								handleBack()
							}}
						>
							{is_cn ? '智能体列表' : 'Assistants'}
						</a>
					</Breadcrumb.Item>
					<Breadcrumb.Item>{name || (is_cn ? '智能体详情' : 'Assistant Detail')}</Breadcrumb.Item>
				</Breadcrumb>
				<Button
					className={styles.backButton}
					icon={<Icon name='icon-arrow-left' size={12} />}
					type='default'
					size='small'
					onClick={handleBack}
				>
					{is_cn ? '返回' : 'Back'}
				</Button>
			</div>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<div className={styles.headerMain}>
						<UserAvatar
							size='xl'
							shape='circle'
							displayType='avatar'
							data={{
								id: id,
								name: name || '',
								avatar: avatarUrl
							}}
							onUploadSuccess={editing && !readonly ? handleAvatarUploadSuccess : undefined}
						/>
						<div className={styles.headerInfo}>
							<h1 style={{ whiteSpace: 'nowrap' }}>{name}</h1>
							<div className={styles.tags}>
								{(() => {
									return Array.isArray(tags)
										? tags.map((tag: string, index: number) => (
												<Tag key={index} variant='auto'>
													{tag}
												</Tag>
										  ))
										: null
								})()}
							</div>
							<div className={styles.description}>{description}</div>
						</div>
						<div className={styles.headerMeta}>
							{connector && (
								<div className={styles.connector}>
									{connectors?.mapping?.[connector] || connector}
								</div>
							)}
							<div className={styles.statusIcons}>
								{built_in === true && (
									<Tooltip title={is_cn ? '系统内建' : 'Built-in'}>
										<span className={styles.statusIcon}>
											<Icon name='icon-package' size={16} color='#b37feb' />
										</span>
									</Tooltip>
								)}
								{!built_in && readonly === true && (
									<Tooltip title={is_cn ? '只读' : 'Readonly'}>
										<span className={styles.statusIcon}>
											<Icon name='icon-lock' size={16} color='#faad14' />
										</span>
									</Tooltip>
								)}
								{mentionable === true && (
									<Tooltip title={is_cn ? '可提及' : 'Mentionable'}>
										<span className={styles.statusIcon}>
											<Icon name='icon-at-sign' size={16} color='#52c41a' />
										</span>
									</Tooltip>
								)}
								{automated === true && (
									<Tooltip title={is_cn ? '自动化' : 'Automated'}>
										<span className={styles.statusIcon}>
											<Icon name='icon-cpu' size={16} color='#1890ff' />
										</span>
									</Tooltip>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className={styles.headerActions}>
					<div className={styles.leftButton}>
						<Button
							type='primary'
							size='small'
							icon={<Icon name='icon-message-circle' size={14} />}
							onClick={handleChatClick}
						>
							{is_cn ? '聊天' : 'Chat'}
						</Button>
					</div>
					<div className={styles.rightButton}>
						{editing ? (
							<div className={styles.buttonGroup}>
								<Button
									type='primary'
									size='small'
									icon={<Icon name='icon-save' size={14} />}
									onClick={() => {
										form.validateFields()
											.then((values) => {
												handleSubmit(values)
											})
											.catch((errorInfo) => {
												console.log('Validation failed:', errorInfo)
											})
									}}
									loading={saving}
								>
									{is_cn ? '保存' : 'Save'}
								</Button>
								<Button
									type='default'
									size='small'
									icon={<Icon name='icon-x' size={14} />}
									onClick={handleCancel}
									disabled={saving}
								>
									{is_cn ? '取消' : 'Cancel'}
								</Button>
							</div>
						) : (
							!readonly && (
								<Button
									type='default'
									size='small'
									icon={<Icon name='icon-edit' size={14} />}
									onClick={handleEdit}
								>
									{is_cn ? '编辑' : 'Edit'}
								</Button>
							)
						)}
					</div>
				</div>
			</div>

			<div className={styles.content}>
				<Form form={form} onFinish={handleSubmit} onValuesChange={handleFormChange}>
					{editing ? (
						<Edit
							form={form}
							prompts={prompts}
							options={options}
							onPromptsChange={setPrompts}
							onOptionsChange={setOptions}
						/>
					) : (
						<View data={assistantData} connectors={connectors} />
					)}
				</Form>
			</div>
		</div>
	)
}

export default AssistantDetail
