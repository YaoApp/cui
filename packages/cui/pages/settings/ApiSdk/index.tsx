import { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, message, Spin, Tag, Space, Popconfirm } from 'antd'
import { CopyOutlined, EyeOutlined, EyeInvisibleOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import { mockApi, ApiKey } from '../mockData'
import styles from './index.less'

const ApiSdk = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm()

	const [loading, setLoading] = useState(true)
	const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
	const [modalVisible, setModalVisible] = useState(false)
	const [creating, setCreating] = useState(false)
	const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

	useEffect(() => {
		const loadApiKeys = async () => {
			try {
				setLoading(true)
				const data = await mockApi.getApiKeys()
				setApiKeys(data)
			} catch (error) {
				console.error('Failed to load API keys:', error)
				message.error(is_cn ? '加载API密钥失败' : 'Failed to load API keys')
			} finally {
				setLoading(false)
			}
		}

		loadApiKeys()
	}, [is_cn])

	const handleCreate = async (values: { name: string }) => {
		try {
			setCreating(true)
			// Mock create
			await new Promise((resolve) => setTimeout(resolve, 1000))
			const newKey: ApiKey = {
				id: Date.now().toString(),
				name: values.name,
				key: 'sk-' + Math.random().toString(36).substring(2, 34),
				created_at: new Date().toISOString(),
				status: 'active'
			}
			setApiKeys((prev) => [...prev, newKey])
			setModalVisible(false)
			form.resetFields()
			message.success(is_cn ? '创建成功' : 'Created successfully')
		} catch (error) {
			message.error(is_cn ? '创建失败' : 'Create failed')
		} finally {
			setCreating(false)
		}
	}

	const handleDelete = async (id: string) => {
		try {
			// Mock delete
			await new Promise((resolve) => setTimeout(resolve, 500))
			setApiKeys((prev) => prev.filter((key) => key.id !== id))
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
		} catch (error) {
			message.error(is_cn ? '删除失败' : 'Delete failed')
		}
	}

	const toggleKeyVisibility = (id: string) => {
		setVisibleKeys((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(id)) {
				newSet.delete(id)
			} else {
				newSet.add(id)
			}
			return newSet
		})
	}

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			message.success(is_cn ? '已复制到剪贴板' : 'Copied to clipboard')
		})
	}

	const maskKey = (key: string) => {
		return key.substring(0, 7) + '...' + key.substring(key.length - 4)
	}

	const columns = [
		{
			title: is_cn ? '名称' : 'Name',
			dataIndex: 'name',
			key: 'name'
		},
		{
			title: is_cn ? 'API密钥' : 'API Key',
			dataIndex: 'key',
			key: 'key',
			render: (key: string, record: ApiKey) => (
				<div className={styles.keyCell}>
					<code className={styles.keyText}>{visibleKeys.has(record.id) ? key : maskKey(key)}</code>
					<Space>
						<Button
							type='text'
							size='small'
							icon={visibleKeys.has(record.id) ? <EyeInvisibleOutlined /> : <EyeOutlined />}
							onClick={() => toggleKeyVisibility(record.id)}
						/>
						<Button
							type='text'
							size='small'
							icon={<CopyOutlined />}
							onClick={() => copyToClipboard(key)}
						/>
					</Space>
				</div>
			)
		},
		{
			title: is_cn ? '状态' : 'Status',
			dataIndex: 'status',
			key: 'status',
			render: (status: string) => (
				<Tag color={status === 'active' ? 'green' : 'red'}>
					{status === 'active' ? (is_cn ? '活跃' : 'Active') : is_cn ? '禁用' : 'Disabled'}
				</Tag>
			)
		},
		{
			title: is_cn ? '创建时间' : 'Created',
			dataIndex: 'created_at',
			key: 'created_at',
			render: (date: string) => new Date(date).toLocaleDateString()
		},
		{
			title: is_cn ? '最后使用' : 'Last Used',
			dataIndex: 'last_used_at',
			key: 'last_used_at',
			render: (date?: string) => (date ? new Date(date).toLocaleDateString() : '-')
		},
		{
			title: is_cn ? '操作' : 'Actions',
			key: 'actions',
			render: (_: any, record: ApiKey) => (
				<Popconfirm
					title={is_cn ? '确定要删除这个API密钥吗？' : 'Are you sure to delete this API key?'}
					onConfirm={() => handleDelete(record.id)}
					okText={is_cn ? '确认' : 'Yes'}
					cancelText={is_cn ? '取消' : 'No'}
				>
					<Button type='text' size='small' icon={<DeleteOutlined />} danger />
				</Popconfirm>
			)
		}
	]

	return (
		<div className={styles.apiSdk}>
			<div className={styles.header}>
				<div>
					<h2>{is_cn ? 'API SDK' : 'API SDK'}</h2>
					<p>{is_cn ? '管理您的API密钥和SDK集成' : 'Manage your API keys and SDK integrations'}</p>
				</div>
				<Button type='primary' icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
					{is_cn ? '创建API密钥' : 'Create API Key'}
				</Button>
			</div>

			<Card className={styles.card}>
				<Table
					columns={columns}
					dataSource={apiKeys}
					rowKey='id'
					loading={loading}
					pagination={false}
					locale={{
						emptyText: is_cn ? '暂无API密钥' : 'No API keys'
					}}
				/>
			</Card>

			<Modal
				title={is_cn ? '创建API密钥' : 'Create API Key'}
				open={modalVisible}
				onCancel={() => {
					setModalVisible(false)
					form.resetFields()
				}}
				footer={null}
				className={styles.modal}
			>
				<Form form={form} layout='vertical' onFinish={handleCreate}>
					<Form.Item
						name='name'
						label={is_cn ? '密钥名称' : 'Key Name'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入密钥名称' : 'Please enter key name'
							}
						]}
					>
						<Input placeholder={is_cn ? '请输入密钥名称' : 'Enter key name'} />
					</Form.Item>

					<Form.Item className={styles.actions}>
						<Space>
							<Button onClick={() => setModalVisible(false)}>
								{is_cn ? '取消' : 'Cancel'}
							</Button>
							<Button type='primary' htmlType='submit' loading={creating}>
								{is_cn ? '创建' : 'Create'}
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}

export default ApiSdk
