import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { getLocale } from '@umijs/max'
import { Button, Dropdown } from '@/components/ui'
import type { DropdownMenuItem } from '@/components/ui'
import Icon from '@/widgets/Icon'
import CardList from '../CardList'
import styles from './index.less'

export interface LLMProvider {
	id: string
	label: string
	model: string
	description: string
	key: string
	endpoint: string
	created_at?: string
	updated_at?: string
}

interface LLMProviderFormData {
	label: string
	model: string
	description: string
	key: string
	endpoint: string
}

const LLMProviders = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm<LLMProviderFormData>()

	// 状态管理
	const [data, setData] = useState<LLMProvider[]>([])
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(true)
	const [currentPage, setCurrentPage] = useState(1)
	const [modalVisible, setModalVisible] = useState(false)
	const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)
	const [formLoading, setFormLoading] = useState(false)

	const pageSize = 20

	// 模拟 API 数据
	const generateMockProviders = (page: number, size: number): LLMProvider[] => {
		const providers: LLMProvider[] = []
		const models = [
			'gpt-4o',
			'gpt-4o-mini',
			'claude-3-5-sonnet',
			'claude-3-haiku',
			'gemini-1.5-pro',
			'llama-3.1-70b',
			'mistral-large',
			'qwen-max'
		]
		const providers_list = [
			'OpenAI',
			'Anthropic',
			'Google',
			'Meta',
			'Mistral',
			'Alibaba',
			'DeepSeek',
			'Moonshot'
		]

		const start = (page - 1) * size
		const end = Math.min(start + size, 100) // 总共100条数据，确保有足够内容触发滚动

		for (let i = start; i < end; i++) {
			const providerName = providers_list[i % providers_list.length]
			const model = models[i % models.length]
			providers.push({
				id: `llm_${i + 1}`,
				label: `${providerName} ${model}`,
				model: model,
				description: is_cn
					? `${providerName} 提供的 ${model} 模型，支持高质量的文本生成和对话`
					: `${model} model provided by ${providerName}, supports high-quality text generation and conversation`,
				key: `sk-${Math.random().toString(36).substring(2, 15)}${Math.random()
					.toString(36)
					.substring(2, 15)}`,
				endpoint: `https://api.${providerName.toLowerCase()}.com/v1/chat/completions`,
				created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
				updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
			})
		}

		return providers
	}

	// 初始加载数据
	useEffect(() => {
		loadProviders(true)
	}, [])

	// 加载数据
	const loadProviders = async (reset: boolean = false) => {
		try {
			if (reset) {
				setLoading(true)
				setCurrentPage(1)
			} else {
				setLoadingMore(true)
			}

			// 模拟 API 调用
			await new Promise((resolve) => setTimeout(resolve, 800))

			const page = reset ? 1 : currentPage + 1
			const newProviders = generateMockProviders(page, pageSize)

			if (reset) {
				setData(newProviders)
			} else {
				setData((prev) => [...prev, ...newProviders])
				setCurrentPage(page)
			}

			// 检查是否还有更多数据
			setHasMore(newProviders.length === pageSize && page * pageSize < 100)
		} catch (error) {
			console.error('Failed to load LLM providers:', error)
			message.error(is_cn ? '加载失败' : 'Failed to load providers')
		} finally {
			setLoading(false)
			setLoadingMore(false)
		}
	}

	// 加载更多
	const handleLoadMore = () => {
		if (!hasMore || loadingMore) return
		loadProviders(false)
	}

	// 打开添加模态框
	const handleAdd = () => {
		setEditingProvider(null)
		form.resetFields()
		setModalVisible(true)
	}

	// 打开编辑模态框
	const handleEdit = (provider: LLMProvider) => {
		setEditingProvider(provider)
		form.setFieldsValue({
			label: provider.label,
			model: provider.model,
			description: provider.description,
			key: provider.key,
			endpoint: provider.endpoint
		})
		setModalVisible(true)
	}

	// 删除提供商
	const handleDelete = (provider: LLMProvider) => {
		Modal.confirm({
			title: is_cn ? '确认删除' : 'Confirm Delete',
			content: is_cn
				? `确定要删除 "${provider.label}" 吗？此操作不可撤销。`
				: `Are you sure you want to delete "${provider.label}"? This action cannot be undone.`,
			okText: is_cn ? '删除' : 'Delete',
			okType: 'danger',
			cancelText: is_cn ? '取消' : 'Cancel',
			onOk: async () => {
				try {
					// 模拟删除 API 调用
					await new Promise((resolve) => setTimeout(resolve, 500))
					setData((prev) => prev.filter((item) => item.id !== provider.id))
					message.success(is_cn ? '删除成功' : 'Deleted successfully')
				} catch (error) {
					console.error('Failed to delete provider:', error)
					message.error(is_cn ? '删除失败' : 'Failed to delete')
				}
			}
		})
	}

	// 保存表单
	const handleSave = async () => {
		try {
			const values = await form.validateFields()
			setFormLoading(true)

			// 模拟 API 调用
			await new Promise((resolve) => setTimeout(resolve, 1000))

			if (editingProvider) {
				// 编辑
				const updatedProvider: LLMProvider = {
					...editingProvider,
					...values,
					updated_at: new Date().toISOString()
				}
				setData((prev) => prev.map((item) => (item.id === editingProvider.id ? updatedProvider : item)))
				message.success(is_cn ? '更新成功' : 'Updated successfully')
			} else {
				// 添加
				const newProvider: LLMProvider = {
					id: `llm_${Date.now()}`,
					...values,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
				setData((prev) => [newProvider, ...prev])
				message.success(is_cn ? '添加成功' : 'Added successfully')
			}

			setModalVisible(false)
			form.resetFields()
		} catch (error) {
			console.error('Failed to save provider:', error)
			message.error(is_cn ? '保存失败' : 'Failed to save')
		} finally {
			setFormLoading(false)
		}
	}

	// 取消表单
	const handleCancel = () => {
		setModalVisible(false)
		form.resetFields()
		setEditingProvider(null)
	}

	// 渲染卡片
	const renderProviderCard = (provider: LLMProvider) => {
		const menuItems: DropdownMenuItem[] = [
			{
				key: 'edit',
				label: is_cn ? '编辑' : 'Edit',
				icon: <Icon name='material-edit' size={14} />,
				onClick: () => handleEdit(provider)
			},
			{
				key: 'delete',
				label: is_cn ? '删除' : 'Delete',
				icon: <Icon name='material-delete' size={14} />,
				onClick: () => handleDelete(provider)
			}
		]

		return (
			<div className={styles.providerCard}>
				<div className={styles.cardHeader}>
					<div className={styles.cardTitle}>
						<Icon name='material-psychology' size={16} className={styles.cardIcon} />
						<h3 className={styles.providerLabel}>{provider.label}</h3>
					</div>
					<Dropdown items={menuItems} placement='bottomRight'>
						<button className={styles.moreButton} title={is_cn ? '更多操作' : 'More actions'}>
							<Icon name='material-more_horiz' size={16} />
						</button>
					</Dropdown>
				</div>
				<div className={styles.cardContent}>
					<p className={styles.providerDescription}>{provider.description}</p>
					<div className={styles.modelTag}>{provider.model}</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.llmProviders}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? 'LLM 提供商' : 'LLM Providers'}</h2>
					<p>
						{is_cn
							? '管理您的大语言模型提供商配置'
							: 'Manage your large language model provider configurations'}
					</p>
				</div>
				<div className={styles.headerActions}>
					<Button type='primary' icon={<Icon name='material-add' size={14} />} onClick={handleAdd}>
						{is_cn ? '添加提供商' : 'Add Provider'}
					</Button>
				</div>
			</div>

			{/* Content Stack */}
			<div className={styles.contentStack}>
				<CardList
					data={data}
					loading={loading}
					loadingMore={loadingMore}
					hasMore={hasMore}
					onLoadMore={handleLoadMore}
					renderCard={renderProviderCard}
					emptyText={is_cn ? '暂无 LLM 提供商配置' : 'No LLM providers configured'}
					emptyIcon='material-psychology'
					cardClassName={styles.providerCardWrapper}
				/>
			</div>

			{/* 添加/编辑模态框 */}
			<Modal
				title={
					editingProvider
						? is_cn
							? '编辑提供商'
							: 'Edit Provider'
						: is_cn
						? '添加提供商'
						: 'Add Provider'
				}
				open={modalVisible}
				onOk={handleSave}
				onCancel={handleCancel}
				okText={is_cn ? '保存' : 'Save'}
				cancelText={is_cn ? '取消' : 'Cancel'}
				confirmLoading={formLoading}
				width={600}
				destroyOnClose
			>
				<Form form={form} layout='vertical' style={{ marginTop: 16 }} autoComplete='off'>
					{/* 隐藏字段防止浏览器自动填写 */}
					<input type='text' style={{ display: 'none' }} />
					<input type='password' style={{ display: 'none' }} />

					<Form.Item
						name='label'
						label={is_cn ? '显示名称' : 'Display Name'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入显示名称' : 'Please enter display name'
							}
						]}
					>
						<Input
							placeholder={is_cn ? '例如：OpenAI GPT-4o' : 'e.g., OpenAI GPT-4o'}
							autoComplete='off'
						/>
					</Form.Item>

					<Form.Item
						name='model'
						label={is_cn ? '模型名称' : 'Model Name'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入模型名称' : 'Please enter model name'
							}
						]}
					>
						<Input placeholder={is_cn ? '例如：gpt-4o' : 'e.g., gpt-4o'} autoComplete='off' />
					</Form.Item>

					<Form.Item
						name='description'
						label={is_cn ? '描述' : 'Description'}
						rules={[
							{ required: true, message: is_cn ? '请输入描述' : 'Please enter description' }
						]}
					>
						<Input.TextArea
							rows={3}
							placeholder={
								is_cn
									? '简要描述这个模型的特点和用途'
									: 'Briefly describe the features and use cases of this model'
							}
							autoComplete='off'
						/>
					</Form.Item>

					<Form.Item
						name='endpoint'
						label={is_cn ? 'API 端点' : 'API Endpoint'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入 API 端点' : 'Please enter API endpoint'
							},
							{
								type: 'url',
								message: is_cn ? '请输入有效的 URL' : 'Please enter a valid URL'
							}
						]}
					>
						<Input
							placeholder='https://api.openai.com/v1/chat/completions'
							autoComplete='off'
							data-lpignore='true'
							data-form-type='other'
						/>
					</Form.Item>

					<Form.Item
						name='key'
						label={is_cn ? 'API 密钥' : 'API Key'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入 API 密钥' : 'Please enter API key'
							}
						]}
					>
						<Input.Password
							placeholder={is_cn ? '请输入您的 API 密钥' : 'Please enter your API key'}
							autoComplete='off'
							data-lpignore='true'
							data-form-type='other'
						/>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}

export default LLMProviders
