import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, message } from 'antd'
import { getLocale } from '@umijs/max'
import { Button, Dropdown } from '@/components/ui'
import type { DropdownMenuItem } from '@/components/ui'
import Icon from '@/widgets/Icon'
import CardList from '../CardList'
import styles from './index.less'

export interface StripeConfig {
	id: string
	label: string
	description: string
	public_key: string
	secret_key: string
	webhook_secret: string
	created_at?: string
	updated_at?: string
}

interface StripeConfigFormData {
	label: string
	description: string
	public_key: string
	secret_key: string
	webhook_secret: string
}

const Stripe = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm<StripeConfigFormData>()

	// 状态管理
	const [data, setData] = useState<StripeConfig[]>([])
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(true)
	const [currentPage, setCurrentPage] = useState(1)
	const [modalVisible, setModalVisible] = useState(false)
	const [editingConfig, setEditingConfig] = useState<StripeConfig | null>(null)
	const [formLoading, setFormLoading] = useState(false)

	const pageSize = 20

	// 模拟 API 数据
	const generateMockConfigs = (page: number, size: number): StripeConfig[] => {
		const configs: StripeConfig[] = []
		const environments = [
			{
				label: 'Production Environment',
				label_cn: '生产环境',
				desc: 'Production Stripe configuration for live payments',
				desc_cn: '用于实际支付的生产环境 Stripe 配置'
			},
			{
				label: 'Test Environment',
				label_cn: '测试环境',
				desc: 'Test Stripe configuration for development',
				desc_cn: '用于开发测试的 Stripe 配置'
			},
			{
				label: 'Staging Environment',
				label_cn: '预发布环境',
				desc: 'Staging environment for pre-production testing',
				desc_cn: '用于预发布测试的环境配置'
			},
			{
				label: 'Development Environment',
				label_cn: '开发环境',
				desc: 'Local development Stripe configuration',
				desc_cn: '本地开发环境的 Stripe 配置'
			}
		]

		const start = (page - 1) * size
		const end = Math.min(start + size, 100) // 总共100条数据，确保有足够内容触发滚动

		for (let i = start; i < end; i++) {
			const env = environments[i % environments.length]
			configs.push({
				id: `stripe-${i + 1}`,
				label: is_cn ? env.label_cn : env.label,
				description: is_cn ? env.desc_cn : env.desc,
				public_key: `pk_${i % 2 === 0 ? 'live' : 'test'}_${Math.random().toString(36).substr(2, 24)}`,
				secret_key: `sk_${i % 2 === 0 ? 'live' : 'test'}_${Math.random().toString(36).substr(2, 24)}`,
				webhook_secret: `whsec_${Math.random().toString(36).substr(2, 32)}`,
				created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
				updated_at: new Date().toISOString()
			})
		}

		return configs
	}

	// 加载数据
	const loadData = async (page: number = 1, append: boolean = false) => {
		try {
			if (!append) {
				setLoading(true)
			} else {
				setLoadingMore(true)
			}

			// 模拟网络延迟
			await new Promise((resolve) => setTimeout(resolve, 800))

			const newConfigs = generateMockConfigs(page, pageSize)

			if (append) {
				setData((prev) => [...prev, ...newConfigs])
			} else {
				setData(newConfigs)
			}

			setCurrentPage(page)
			setHasMore(newConfigs.length === pageSize && page * pageSize < 100)
		} catch (error) {
			console.error('Failed to load stripe configurations:', error)
			message.error(is_cn ? '加载失败' : 'Failed to load')
		} finally {
			setLoading(false)
			setLoadingMore(false)
		}
	}

	// 加载更多
	const handleLoadMore = () => {
		if (!loadingMore && hasMore) {
			loadData(currentPage + 1, true)
		}
	}

	// 初始加载
	useEffect(() => {
		loadData()
	}, [])

	// 处理添加
	const handleAdd = () => {
		setEditingConfig(null)
		form.resetFields()
		setModalVisible(true)
	}

	// 处理编辑
	const handleEdit = (config: StripeConfig) => {
		setEditingConfig(config)
		form.setFieldsValue({
			label: config.label,
			description: config.description,
			public_key: config.public_key,
			secret_key: config.secret_key,
			webhook_secret: config.webhook_secret
		})
		setModalVisible(true)
	}

	// 处理删除
	const handleDelete = async (config: StripeConfig) => {
		try {
			// 模拟删除 API 调用
			await new Promise((resolve) => setTimeout(resolve, 500))

			setData((prev) => prev.filter((item) => item.id !== config.id))
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
		} catch (error) {
			message.error(is_cn ? '删除失败' : 'Failed to delete')
		}
	}

	// 处理表单提交
	const handleSubmit = async () => {
		try {
			setFormLoading(true)
			const values = await form.validateFields()

			// 模拟 API 调用
			await new Promise((resolve) => setTimeout(resolve, 1000))

			if (editingConfig) {
				// 编辑模式
				const updatedConfig: StripeConfig = {
					...editingConfig,
					...values,
					updated_at: new Date().toISOString()
				}
				setData((prev) => prev.map((item) => (item.id === editingConfig.id ? updatedConfig : item)))
				message.success(is_cn ? '更新成功' : 'Updated successfully')
			} else {
				// 添加模式
				const newConfig: StripeConfig = {
					id: `stripe-${Date.now()}`,
					...values,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
				setData((prev) => [newConfig, ...prev])
				message.success(is_cn ? '添加成功' : 'Added successfully')
			}

			handleCancel()
		} catch (error) {
			console.error('Form validation failed:', error)
		} finally {
			setFormLoading(false)
		}
	}

	// 处理取消
	const handleCancel = () => {
		setModalVisible(false)
		form.resetFields()
		setEditingConfig(null)
	}

	// 渲染卡片
	const renderConfigCard = (config: StripeConfig) => {
		const menuItems: DropdownMenuItem[] = [
			{
				key: 'edit',
				label: is_cn ? '编辑' : 'Edit',
				icon: <Icon name='material-edit' size={14} />,
				onClick: () => handleEdit(config)
			},
			{
				key: 'delete',
				label: is_cn ? '删除' : 'Delete',
				icon: <Icon name='material-delete' size={14} />,
				onClick: () => handleDelete(config)
			}
		]

		return (
			<div className={styles.configCard}>
				<div className={styles.cardHeader}>
					<div className={styles.cardTitle}>
						<Icon name='material-payment' size={16} className={styles.cardIcon} />
						<h3 className={styles.configLabel}>{config.label}</h3>
					</div>
					<Dropdown items={menuItems} placement='bottomRight'>
						<button className={styles.moreButton} title={is_cn ? '更多操作' : 'More actions'}>
							<Icon name='material-more_horiz' size={16} />
						</button>
					</Dropdown>
				</div>

				<div className={styles.cardContent}>
					<p className={styles.configDescription}>{config.description}</p>
					<div className={styles.keyTag}>
						{config.public_key.startsWith('pk_live')
							? is_cn
								? '生产'
								: 'LIVE'
							: is_cn
							? '测试'
							: 'TEST'}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.stripe}>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h1 className={styles.title}>Stripe</h1>
					<p className={styles.subtitle}>
						{is_cn ? '管理您的 Stripe 支付配置' : 'Manage your Stripe payment configurations'}
					</p>
				</div>
				<Button type='primary' icon={<Icon name='material-add' size={14} />} onClick={handleAdd}>
					{is_cn ? '添加配置' : 'Add Configuration'}
				</Button>
			</div>

			<div className={styles.contentStack}>
				<CardList
					data={data}
					loading={loading}
					loadingMore={loadingMore}
					hasMore={hasMore}
					onLoadMore={handleLoadMore}
					renderCard={renderConfigCard}
					emptyIcon='material-payment'
					emptyTitle={is_cn ? '暂无 Stripe 配置' : 'No Stripe configurations'}
					emptyDescription={
						is_cn
							? '点击上方按钮添加您的第一个配置'
							: 'Click the button above to add your first configuration'
					}
					className={styles.configList}
				/>
			</div>

			<Modal
				title={
					editingConfig
						? is_cn
							? '编辑配置'
							: 'Edit Configuration'
						: is_cn
						? '添加配置'
						: 'Add Configuration'
				}
				open={modalVisible}
				onOk={handleSubmit}
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
						label={is_cn ? '配置名称' : 'Configuration Name'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入配置名称' : 'Please enter configuration name'
							}
						]}
					>
						<Input
							placeholder={is_cn ? '例如：生产环境' : 'e.g., Production Environment'}
							autoComplete='off'
						/>
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
									? '简要描述这个配置的用途和环境'
									: 'Briefly describe the purpose and environment of this configuration'
							}
							autoComplete='off'
						/>
					</Form.Item>

					<Form.Item
						name='public_key'
						label={is_cn ? '公钥 (Publishable Key)' : 'Publishable Key'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入公钥' : 'Please enter publishable key'
							},
							{
								pattern: /^pk_(test_|live_)[a-zA-Z0-9]{24,}$/,
								message: is_cn
									? '请输入有效的 Stripe 公钥'
									: 'Please enter a valid Stripe publishable key'
							}
						]}
					>
						<Input
							placeholder='pk_test_...'
							autoComplete='off'
							data-lpignore='true'
							data-form-type='other'
						/>
					</Form.Item>

					<Form.Item
						name='secret_key'
						label={is_cn ? '私钥 (Secret Key)' : 'Secret Key'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入私钥' : 'Please enter secret key'
							},
							{
								pattern: /^sk_(test_|live_)[a-zA-Z0-9]{24,}$/,
								message: is_cn
									? '请输入有效的 Stripe 私钥'
									: 'Please enter a valid Stripe secret key'
							}
						]}
					>
						<Input.Password
							placeholder='sk_test_...'
							autoComplete='off'
							data-lpignore='true'
							data-form-type='other'
						/>
					</Form.Item>

					<Form.Item
						name='webhook_secret'
						label={is_cn ? 'Webhook 密钥' : 'Webhook Secret'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入 Webhook 密钥' : 'Please enter webhook secret'
							},
							{
								pattern: /^whsec_[a-zA-Z0-9]{32,}$/,
								message: is_cn
									? '请输入有效的 Webhook 密钥'
									: 'Please enter a valid webhook secret'
							}
						]}
					>
						<Input.Password
							placeholder='whsec_...'
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

export default Stripe
