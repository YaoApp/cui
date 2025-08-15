import { useEffect, useRef, useState } from 'react'
import { Button, Input, Spin, Modal, message } from 'antd'
import {
	SearchOutlined,
	ClockCircleOutlined,
	PlayCircleOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined
} from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import TaskDetail from './TaskDetail'
import { ListResponse, Task, Catgory, TaskLog } from './types'
import { mockFetchTasks, mockFetchTaskDetail } from './mockData'
import styles from './index.less'

const Index = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [searchText, setSearchText] = useState('')
	const [activeCategory, setActiveCategory] = useState('all')
	const [tasks, setTasks] = useState<Task[]>([])
	const [categories, setCategories] = useState<Catgory[]>([])
	const [allCategories, setAllCategories] = useState<Catgory[]>([])
	const [total, setTotal] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)

	// 详情弹窗状态
	const [detailModalVisible, setDetailModalVisible] = useState(false)
	const [selectedTask, setSelectedTask] = useState<Task | null>(null)
	const [taskDetail, setTaskDetail] = useState<Task | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)

	// 获取任务状态图标
	const getTaskStatusIcon = (status: string): string => {
		const iconMap: Record<string, string> = {
			pending: 'material-schedule',
			running: 'material-play_circle',
			completed: 'material-check_circle',
			failed: 'material-error_outline'
		}
		return iconMap[status] || 'material-help_outline'
	}

	// 获取任务状态颜色
	const getTaskStatusColor = (status: string): string => {
		const colorMap: Record<string, string> = {
			pending: 'var(--color_warning)',
			running: 'var(--color_main)',
			completed: 'var(--color_success)',
			failed: 'var(--color_error)'
		}
		return colorMap[status] || 'var(--color_text_grey)'
	}

	// 获取分类图标
	const getCategoryIcon = (category: string): string => {
		const iconMap: Record<string, string> = {
			assistant: 'material-assistant',
			knowledge: 'material-menu_book',
			workflow: 'material-account_tree',
			schedule: 'material-schedule'
		}
		return iconMap[category] || 'material-folder'
	}

	// 格式化时间
	const formatTime = (timestamp: string): string => {
		const date = new Date(timestamp)
		const now = new Date()
		const diff = now.getTime() - date.getTime()
		const minutes = Math.floor(diff / 60000)
		const hours = Math.floor(diff / 3600000)
		const days = Math.floor(diff / 86400000)

		if (days > 0) {
			return is_cn ? `${days}天前` : `${days}d ago`
		} else if (hours > 0) {
			return is_cn ? `${hours}小时前` : `${hours}h ago`
		} else if (minutes > 0) {
			return is_cn ? `${minutes}分钟前` : `${minutes}m ago`
		} else {
			return is_cn ? '刚刚' : 'Just now'
		}
	}

	// 计算任务运行时间
	const getTaskDuration = (task: Task): string => {
		if (!task.started_at) return '-'

		const startTime = new Date(task.started_at).getTime()
		const endTime = task.ended_at ? new Date(task.ended_at).getTime() : new Date().getTime()
		const duration = endTime - startTime

		const seconds = Math.floor(duration / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m`
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`
		} else {
			return `${seconds}s`
		}
	}

	// 加载任务列表
	const loadTasks = async () => {
		setLoading(true)
		try {
			const response = await mockFetchTasks()
			if ('tasks' in response) {
				setTasks(response.tasks)
				setCategories(response.categories)
				setTotal(response.total)

				// 添加"全部"分类
				const allCategory: Catgory = {
					id: 'all',
					name: is_cn ? '全部' : 'All',
					icon: 'material-apps',
					description: is_cn ? '显示所有任务' : 'Show all tasks',
					sort: 0
				}
				setAllCategories([allCategory, ...response.categories])
			} else {
				message.error(response.message)
			}
		} catch (error) {
			console.error('Failed to load tasks:', error)
			message.error(is_cn ? '加载任务失败' : 'Failed to load tasks')
		} finally {
			setLoading(false)
		}
	}

	// 加载任务详情
	const loadTaskDetail = async (taskId: string) => {
		setDetailLoading(true)
		try {
			const response = await mockFetchTaskDetail(taskId)
			if ('id' in response) {
				setTaskDetail(response)
			} else {
				message.error(response.message)
			}
		} catch (error) {
			console.error('Failed to load task detail:', error)
			message.error(is_cn ? '加载任务详情失败' : 'Failed to load task detail')
		} finally {
			setDetailLoading(false)
		}
	}

	// 定时更新任务列表
	useEffect(() => {
		loadTasks()
		const interval = setInterval(loadTasks, 120000) // 每120秒更新
		return () => clearInterval(interval)
	}, [])

	// 过滤任务
	const filteredTasks = tasks.filter((task) => {
		// 分类过滤
		if (activeCategory !== 'all' && task.category !== activeCategory) {
			return false
		}

		// 搜索过滤
		if (searchText.trim()) {
			const keyword = searchText.toLowerCase()
			return task.name.toLowerCase().includes(keyword) || task.description.toLowerCase().includes(keyword)
		}

		return true
	})

	// 搜索处理
	const handleSearch = () => {
		setSearchText(search)
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	// 任务卡片点击
	const handleTaskClick = (task: Task) => {
		setSelectedTask(task)
		setDetailModalVisible(true)
		loadTaskDetail(task.id)
	}

	// 分类点击
	const handleCategoryClick = (categoryId: string) => {
		setActiveCategory(categoryId)
	}

	// 关闭详情弹窗
	const handleCloseDetail = () => {
		setDetailModalVisible(false)
		setSelectedTask(null)
		setTaskDetail(null)
	}

	// 渲染分类列表
	const renderCategories = () => {
		// 只显示有任务的分类
		const categoriesWithTasks = allCategories.filter((category) => {
			if (category.id === 'all') return true
			return tasks.some((task) => task.category === category.id)
		})

		return (
			<div className={styles.categoriesList}>
				{categoriesWithTasks.map((category) => (
					<div
						key={category.id}
						className={`${styles.categoryItem} ${
							activeCategory === category.id ? styles.active : ''
						}`}
						onClick={() => handleCategoryClick(category.id)}
					>
						<Icon name={category.icon || getCategoryIcon(category.id)} size={16} />
						<span className={styles.categoryName}>{category.name}</span>
						<span className={styles.categoryCount}>
							{category.id === 'all'
								? total
								: tasks.filter((t) => t.category === category.id).length}
						</span>
					</div>
				))}
			</div>
		)
	}

	// 渲染任务卡片
	const renderTaskCard = (task: Task) => {
		return (
			<div key={task.id} className={styles.taskCard} onClick={() => handleTaskClick(task)}>
				<div className={styles.cardHeader}>
					<div className={styles.cardHeaderLeft}>
						<div className={styles.cardTitleWithIcon}>
							<Icon name={task.icon || getCategoryIcon(task.category)} size={16} />
							<h3 className={styles.cardTitle}>{task.name}</h3>
						</div>
						<div className={styles.cardStatus}>
							<Icon
								name={getTaskStatusIcon(task.status)}
								size={14}
								style={{ color: getTaskStatusColor(task.status) }}
							/>
							<span
								className={styles.statusText}
								style={{ color: getTaskStatusColor(task.status) }}
							>
								{is_cn
									? {
											pending: '等待中',
											running: '运行中',
											completed: '已完成',
											failed: '失败'
									  }[task.status] || task.status
									: task.status}
							</span>
						</div>
					</div>
				</div>

				<div className={styles.cardContent}>
					<p className={styles.cardDescription}>{task.description}</p>
				</div>

				<div className={styles.cardFooter}>
					<div className={styles.taskInfo}>
						<div className={styles.infoItem}>
							<Icon name='material-schedule' size={12} />
							<span>
								{is_cn ? '创建时间' : 'Created'}: {formatTime(task.created_at)}
							</span>
						</div>
						{task.started_at && (
							<div className={styles.infoItem}>
								<Icon name='material-timer' size={12} />
								<span>
									{is_cn ? '运行时间' : 'Duration'}: {getTaskDuration(task)}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	// 渲染任务列表
	const renderTasks = () => {
		if (loading) {
			return (
				<div className={styles.loading}>
					<Spin size='large' />
				</div>
			)
		}

		if (total === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-assignment' size={64} />
					<div className={styles.emptyTitle}>{is_cn ? '暂无任务' : 'No Tasks'}</div>
					<div className={styles.emptyDescription}>
						{is_cn ? '还没有任何任务' : 'No tasks available'}
					</div>
				</div>
			)
		}

		if (filteredTasks.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-search_off' size={64} />
					<div className={styles.emptyTitle}>
						{is_cn ? '未找到匹配的任务' : 'No Matching Tasks'}
					</div>
					<div className={styles.emptyDescription}>
						{is_cn
							? '请尝试修改搜索条件或选择其他分类'
							: 'Try adjusting your search or select a different category'}
					</div>
				</div>
			)
		}

		return <div className={styles.tasksGrid}>{filteredTasks.map(renderTaskCard)}</div>
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.titleContainer}>
					<div className={styles.titleWithIcon}>
						<Icon
							name='material-assignment'
							size={24}
							style={{ color: 'var(--color_page_title)' }}
						/>
						<h1 className={styles.title}>{is_cn ? '当前任务' : 'Current Tasks'}</h1>
					</div>
				</div>

				<div className={styles.searchWrapper}>
					<Input
						size='large'
						className={styles.search}
						placeholder={is_cn ? '搜索任务...' : 'Search tasks...'}
						prefix={<SearchOutlined />}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyPress={handleKeyPress}
						allowClear
					/>
					<Button type='primary' size='large' onClick={handleSearch}>
						{is_cn ? '搜索' : 'Search'}
					</Button>
				</div>
			</div>

			<div className={styles.content}>
				<div className={styles.sidebar}>{renderCategories()}</div>
				<div className={styles.main}>{renderTasks()}</div>
			</div>

			{/* 任务详情弹窗 */}
			<Modal
				title={
					<div className={styles.modalTitle}>
						<Icon name='material-assignment' size={18} />
						<span>{is_cn ? '任务详情' : 'Task Details'}</span>
					</div>
				}
				open={detailModalVisible}
				onCancel={handleCloseDetail}
				footer={null}
				width={800}
				className={styles.detailModal}
			>
				{selectedTask && (
					<TaskDetail
						task={selectedTask}
						taskDetail={taskDetail}
						loading={detailLoading}
						onRefresh={() => loadTaskDetail(selectedTask.id)}
					/>
				)}
			</Modal>
		</div>
	)
}

export default Index
