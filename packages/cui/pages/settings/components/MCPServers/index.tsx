import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, message } from 'antd'
import { getLocale } from '@umijs/max'
import { Button, Dropdown } from '@/components/ui'
import type { DropdownMenuItem } from '@/components/ui'
import Icon from '@/widgets/Icon'
import CardList from '../CardList'
import styles from './index.less'

export interface MCPServer {
	id: string
	label: string
	description: string
	command: string
	args?: string
	transport: 'stdio' | 'sse'
	created_at?: string
	updated_at?: string
}

interface MCPServerFormData {
	label: string
	description: string
	command: string
	args?: string
	transport: 'stdio' | 'sse'
}

const MCPServers = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [form] = Form.useForm<MCPServerFormData>()

	// 状态管理
	const [data, setData] = useState<MCPServer[]>([])
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(true)
	const [currentPage, setCurrentPage] = useState(1)
	const [modalVisible, setModalVisible] = useState(false)
	const [editingServer, setEditingServer] = useState<MCPServer | null>(null)
	const [formLoading, setFormLoading] = useState(false)

	const pageSize = 20

	// 模拟 API 数据
	const generateMockServers = (page: number, size: number): MCPServer[] => {
		const servers: MCPServer[] = []
		const serverTypes = [
			{
				label: 'File System Server',
				label_cn: '文件系统服务器',
				desc: 'Local file system access server',
				desc_cn: '本地文件系统访问服务器',
				command: 'node',
				args: '/path/to/filesystem-server.js',
				transport: 'stdio' as const
			},
			{
				label: 'Database Connector',
				label_cn: '数据库连接器',
				desc: 'PostgreSQL database connection server',
				desc_cn: 'PostgreSQL 数据库连接服务器',
				command: 'python',
				args: '-m mcp_database --db postgresql://localhost:5432/mydb',
				transport: 'stdio' as const
			},
			{
				label: 'Git Repository Server',
				label_cn: 'Git 仓库服务器',
				desc: 'Git repository management server',
				desc_cn: 'Git 仓库管理服务器',
				command: 'mcp-git-server',
				args: '--repo /path/to/repo',
				transport: 'sse' as const
			},
			{
				label: 'Web Search Server',
				label_cn: '网页搜索服务器',
				desc: 'Web search and scraping server',
				desc_cn: '网页搜索和抓取服务器',
				command: 'node',
				args: '/opt/mcp-servers/web-search/index.js',
				transport: 'stdio' as const
			}
		]

		const start = (page - 1) * size
		const end = Math.min(start + size, 100) // 总共100条数据，确保有足够内容触发滚动

		for (let i = start; i < end; i++) {
			const serverType = serverTypes[i % serverTypes.length]
			servers.push({
				id: `mcp-${i + 1}`,
				label: is_cn ? serverType.label_cn : serverType.label,
				description: is_cn ? serverType.desc_cn : serverType.desc,
				command: serverType.command,
				args: serverType.args,
				transport: serverType.transport,
				created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
				updated_at: new Date().toISOString()
			})
		}

		return servers
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

			const newServers = generateMockServers(page, pageSize)

			if (append) {
				setData((prev) => [...prev, ...newServers])
			} else {
				setData(newServers)
			}

			setCurrentPage(page)
			setHasMore(newServers.length === pageSize && page * pageSize < 100)
		} catch (error) {
			console.error('Failed to load MCP servers:', error)
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
		setEditingServer(null)
		form.resetFields()
		setModalVisible(true)
	}

	// 处理编辑
	const handleEdit = (server: MCPServer) => {
		setEditingServer(server)
		form.setFieldsValue({
			label: server.label,
			description: server.description,
			command: server.command,
			args: server.args,
			transport: server.transport
		})
		setModalVisible(true)
	}

	// 处理删除
	const handleDelete = async (server: MCPServer) => {
		try {
			// 模拟删除 API 调用
			await new Promise((resolve) => setTimeout(resolve, 500))

			setData((prev) => prev.filter((item) => item.id !== server.id))
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

			if (editingServer) {
				// 编辑模式
				const updatedServer: MCPServer = {
					...editingServer,
					...values,
					updated_at: new Date().toISOString()
				}
				setData((prev) => prev.map((item) => (item.id === editingServer.id ? updatedServer : item)))
				message.success(is_cn ? '更新成功' : 'Updated successfully')
			} else {
				// 添加模式
				const newServer: MCPServer = {
					id: `mcp-${Date.now()}`,
					...values,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
				setData((prev) => [newServer, ...prev])
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
		setEditingServer(null)
	}

	// 渲染卡片
	const renderServerCard = (server: MCPServer) => {
		const menuItems: DropdownMenuItem[] = [
			{
				key: 'edit',
				label: is_cn ? '编辑' : 'Edit',
				icon: <Icon name='material-edit' size={14} />,
				onClick: () => handleEdit(server)
			},
			{
				key: 'delete',
				label: is_cn ? '删除' : 'Delete',
				icon: <Icon name='material-delete' size={14} />,
				onClick: () => handleDelete(server)
			}
		]

		return (
			<div className={styles.serverCard}>
				<div className={styles.cardHeader}>
					<div className={styles.cardTitle}>
						<Icon name='material-dns' size={16} className={styles.cardIcon} />
						<h3 className={styles.serverLabel}>{server.label}</h3>
					</div>
					<Dropdown items={menuItems} placement='bottomRight'>
						<button className={styles.moreButton} title={is_cn ? '更多操作' : 'More actions'}>
							<Icon name='material-more_horiz' size={16} />
						</button>
					</Dropdown>
				</div>

				<div className={styles.cardContent}>
					<p className={styles.serverDescription}>{server.description}</p>
					<div className={styles.transportTag}>{server.transport.toUpperCase()}</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.mcpServers}>
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h1 className={styles.title}>{is_cn ? 'MCP 服务器' : 'MCP Servers'}</h1>
					<p className={styles.subtitle}>
						{is_cn
							? '管理您的模型上下文协议服务器配置'
							: 'Manage your Model Context Protocol server configurations'}
					</p>
				</div>
				<Button type='primary' icon={<Icon name='material-add' size={14} />} onClick={handleAdd}>
					{is_cn ? '添加服务器' : 'Add Server'}
				</Button>
			</div>

			<div className={styles.contentStack}>
				<CardList
					data={data}
					loading={loading}
					loadingMore={loadingMore}
					hasMore={hasMore}
					onLoadMore={handleLoadMore}
					renderCard={renderServerCard}
					emptyIcon='material-dns'
					emptyTitle={is_cn ? '暂无 MCP 服务器' : 'No MCP servers'}
					emptyDescription={
						is_cn
							? '点击上方按钮添加您的第一个服务器'
							: 'Click the button above to add your first server'
					}
					className={styles.serverList}
				/>
			</div>

			<Modal
				title={
					editingServer
						? is_cn
							? '编辑服务器'
							: 'Edit Server'
						: is_cn
						? '添加服务器'
						: 'Add Server'
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
						label={is_cn ? '服务器名称' : 'Server Name'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入服务器名称' : 'Please enter server name'
							}
						]}
					>
						<Input
							placeholder={is_cn ? '例如：文件系统服务器' : 'e.g., File System Server'}
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
									? '简要描述这个服务器的功能和用途'
									: 'Briefly describe the functionality and purpose of this server'
							}
							autoComplete='off'
						/>
					</Form.Item>

					<Form.Item
						name='command'
						label={is_cn ? '启动命令' : 'Command'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入启动命令' : 'Please enter command'
							}
						]}
					>
						<Input
							placeholder={
								is_cn
									? '例如：node, python, mcp-server'
									: 'e.g., node, python, mcp-server'
							}
							autoComplete='off'
							data-lpignore='true'
							data-form-type='other'
						/>
					</Form.Item>

					<Form.Item name='args' label={is_cn ? '参数 (可选)' : 'Arguments (Optional)'}>
						<Input
							placeholder={
								is_cn
									? '例如：/path/to/script.js --port 3000'
									: 'e.g., /path/to/script.js --port 3000'
							}
							autoComplete='off'
							data-lpignore='true'
							data-form-type='other'
						/>
					</Form.Item>

					<Form.Item
						name='transport'
						label={is_cn ? '传输方式' : 'Transport'}
						rules={[
							{
								required: true,
								message: is_cn ? '请选择传输方式' : 'Please select transport'
							}
						]}
					>
						<Select
							placeholder={is_cn ? '选择传输方式' : 'Select transport'}
							options={[
								{ value: 'stdio', label: 'STDIO' },
								{ value: 'sse', label: 'SSE (Server-Sent Events)' }
							]}
						/>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	)
}

export default MCPServers
