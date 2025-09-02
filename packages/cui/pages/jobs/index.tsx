import { useEffect, useRef, useState } from 'react'
import { Button, Input, Spin, Modal, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import TaskDetail from './TaskDetail'
import { JobAPI, Job, Category, ListJobsRequest } from '@/openapi'
import styles from './index.less'

const Index = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [searchKeywords, setSearchKeywords] = useState('') // 实际用于搜索的关键词
	const [activeCategory, setActiveCategory] = useState('running') // 默认显示运行中的任务
	const [jobs, setJobs] = useState<Job[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [allCategories, setAllCategories] = useState<Category[]>([])
	const [total, setTotal] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)

	// 分页状态
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize] = useState(20)
	const [hasMore, setHasMore] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)

	// 详情弹窗状态
	const [detailModalVisible, setDetailModalVisible] = useState(false)
	const [selectedJob, setSelectedJob] = useState<Job | null>(null)
	const [jobDetail, setJobDetail] = useState<Job | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)

	// 获取 Job 状态图标
	const getJobStatusIcon = (status: string): string => {
		const iconMap: Record<string, string> = {
			draft: 'material-edit',
			ready: 'material-schedule',
			running: 'material-play_circle',
			completed: 'material-check_circle',
			failed: 'material-error_outline',
			disabled: 'material-pause_circle',
			deleted: 'material-delete'
		}
		return iconMap[status] || 'material-help_outline'
	}

	// 获取 Job 状态颜色
	const getJobStatusColor = (status: string): string => {
		const colorMap: Record<string, string> = {
			draft: 'var(--color_text_grey)',
			ready: 'var(--color_warning)',
			running: 'var(--color_main)',
			completed: 'var(--color_success)',
			failed: 'var(--color_error)',
			disabled: 'var(--color_text_grey)',
			deleted: 'var(--color_text_grey)'
		}
		return colorMap[status] || 'var(--color_text_grey)'
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

	// 计算 Job 运行时间
	const getJobDuration = (job: Job): string => {
		if (!job.last_run_at) return '-'

		const startTime = new Date(job.last_run_at).getTime()
		const endTime = new Date().getTime()
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

	// 加载 Job 数据 - 初始加载
	const loadData = async () => {
		if (!window.$app?.openapi) {
			console.error('OpenAPI not available')
			return
		}

		try {
			setLoading(true)
			const jobAPI = new JobAPI(window.$app.openapi)

			// 构建请求参数
			const request: ListJobsRequest = {
				page: 1,
				pagesize: pageSize,
				...(searchKeywords && { keywords: searchKeywords })
			}

			// 如果是运行中的特殊分类
			if (activeCategory === 'running') {
				request.status = 'running'
			} else if (activeCategory !== 'all') {
				request.category_id = activeCategory
			}

			const response = await jobAPI.ListJobs(request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load jobs')
			}

			const jobsData = Array.isArray(response.data?.data) ? response.data.data : []
			const totalJobs = typeof response.data?.total === 'number' ? response.data.total : 0

			// 重新加载模式：替换数据
			setJobs(jobsData)
			setCurrentPage(1)
			setTotal(totalJobs)

			// 检查是否还有更多数据
			setHasMore(jobsData.length < totalJobs)
		} catch (error) {
			console.error(is_cn ? '加载 Job 失败:' : 'Failed to load jobs:', error)
			message.error(is_cn ? '加载 Job 失败' : 'Failed to load jobs')
		} finally {
			setLoading(false)
		}
	}

	// 加载更多数据
	const loadMoreData = async () => {
		if (!hasMore || loadingMore) return

		const nextPage = currentPage + 1
		setCurrentPage(nextPage)

		try {
			setLoadingMore(true)
			const jobAPI = new JobAPI(window.$app.openapi)

			const request: ListJobsRequest = {
				page: nextPage,
				pagesize: pageSize,
				...(searchKeywords && { keywords: searchKeywords })
			}

			// 如果是运行中的特殊分类
			if (activeCategory === 'running') {
				request.status = 'running'
			} else if (activeCategory !== 'all') {
				request.category_id = activeCategory
			}

			const response = await jobAPI.ListJobs(request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load jobs')
			}

			const jobsData = Array.isArray(response.data?.data) ? response.data.data : []
			const totalJobs = typeof response.data?.total === 'number' ? response.data.total : 0

			// 追加数据
			setJobs((prev) => (Array.isArray(prev) ? [...prev, ...jobsData] : jobsData))
			setTotal(totalJobs)

			// 检查是否还有更多数据
			const loadedCount = jobs.length + jobsData.length
			setHasMore(loadedCount < totalJobs)
		} catch (error) {
			console.error('Load more jobs failed:', error)
			message.error(is_cn ? '加载更多 Job 失败' : 'Failed to load more jobs')
		} finally {
			setLoadingMore(false)
		}
	}

	// 加载 Job 详情
	const loadJobDetail = async (jobId: string) => {
		setDetailLoading(true)
		try {
			const jobAPI = new JobAPI(window.$app.openapi)
			const response = await jobAPI.GetJob(jobId)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load job detail')
			}

			setJobDetail(response.data!)
		} catch (error) {
			console.error('Failed to load job detail:', error)
			message.error(is_cn ? '加载 Job 详情失败' : 'Failed to load job detail')
		} finally {
			setDetailLoading(false)
		}
	}

	// 加载分类数据和统计信息
	const loadCategories = async () => {
		if (!window.$app?.openapi) return

		try {
			const jobAPI = new JobAPI(window.$app.openapi)

			// 并行加载分类和所有 jobs 数据
			const [categoriesResponse, allJobsResponse] = await Promise.all([
				jobAPI.ListCategories(),
				jobAPI.ListJobs({ page: 1, pagesize: 1000 }) // 获取所有 jobs 用于统计
			])

			if (window.$app.openapi.IsError(categoriesResponse)) {
				console.warn('Failed to load categories:', categoriesResponse.error)
				return
			}

			const categoriesData = Array.isArray(categoriesResponse.data?.data)
				? categoriesResponse.data.data
				: []
			setCategories(categoriesData)

			// 获取所有 jobs 用于统计
			let allJobs: Job[] = []
			if (!window.$app.openapi.IsError(allJobsResponse)) {
				allJobs = Array.isArray(allJobsResponse.data?.data) ? allJobsResponse.data.data : []
			}

			// 统计运行中的 jobs
			const runningJobsCount = allJobs.filter((job) => job.status === 'running').length
			const totalJobsCount = allJobs.length

			// 构建所有分类列表（包含特殊分类）
			const runningCategory: Category = {
				id: 0,
				category_id: 'running',
				name: is_cn ? `运行中 (${runningJobsCount})` : `Running (${runningJobsCount})`,
				icon: 'material-play_circle',
				description: is_cn ? '当前正在运行的 Job' : 'Currently running jobs',
				sort: -1,
				system: true,
				enabled: true,
				readonly: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			}

			const allCategory: Category = {
				id: 0,
				category_id: 'all',
				name: is_cn ? `全部 (${totalJobsCount})` : `All (${totalJobsCount})`,
				icon: 'material-apps',
				description: is_cn ? '显示所有 Job' : 'Show all jobs',
				sort: 0,
				system: true,
				enabled: true,
				readonly: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			}

			// 为每个分类添加统计数量
			const categoriesWithCount = categoriesData.map((category) => ({
				...category,
				name: `${category.name} (${
					allJobs.filter((job) => job.category_id === category.category_id).length
				})`
			}))

			setAllCategories([runningCategory, allCategory, ...categoriesWithCount])
		} catch (error) {
			console.error('Failed to load categories:', error)
		}
	}

	// 处理滚动加载
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container
			if (scrollHeight - scrollTop - clientHeight < 50 && !loadingMore && hasMore) {
				loadMoreData()
			}
		}

		container.addEventListener('scroll', handleScroll)
		return () => container.removeEventListener('scroll', handleScroll)
	}, [loadingMore, hasMore, jobs])

	// 初始加载
	useEffect(() => {
		loadCategories()
		loadData()

		// 刷新运行中的Jobs数量，确保Header显示一致
		window.$app?.Event?.emit('app/refreshJobsCount')
	}, [])

	// 搜索关键词或分类变化时重新加载数据
	useEffect(() => {
		loadData()
	}, [searchKeywords, activeCategory])

	// 搜索处理
	const handleSearch = () => {
		setSearchKeywords(search.trim())
	}

	const handleClearSearch = () => {
		setSearch('')
		setSearchKeywords('')
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	// Job 卡片点击
	const handleJobClick = (job: Job) => {
		setSelectedJob(job)
		setDetailModalVisible(true)
		loadJobDetail(job.job_id)
	}

	// 分类点击
	const handleCategoryClick = (categoryId: string) => {
		setActiveCategory(categoryId)
	}

	// 关闭详情弹窗
	const handleCloseDetail = () => {
		setDetailModalVisible(false)
		setSelectedJob(null)
		setJobDetail(null)
	}

	// 渲染分类列表
	const renderCategories = () => {
		return (
			<div className={styles.categoriesList}>
				{allCategories.map((category) => (
					<div
						key={category.category_id}
						className={`${styles.categoryItem} ${
							activeCategory === category.category_id ? styles.active : ''
						}`}
						onClick={() => handleCategoryClick(category.category_id)}
					>
						<Icon
							name={
								category.category_id === 'running' || category.category_id === 'all'
									? category.icon || 'material-work'
									: 'material-local_offer'
							}
							size={16}
						/>
						<span className={styles.categoryName}>{category.name}</span>
					</div>
				))}
			</div>
		)
	}

	// 渲染 Job 卡片
	const renderJobCard = (job: Job) => {
		return (
			<div key={job.job_id} className={styles.taskCard} onClick={() => handleJobClick(job)}>
				<div className={styles.cardHeader}>
					<div className={styles.cardHeaderLeft}>
						<div className={styles.cardTitleWithIcon}>
							<Icon
								name={
									job.icon
										? job.icon.startsWith('material-')
											? job.icon
											: `material-${job.icon}`
										: 'material-work'
								}
								size={16}
							/>
							<h3 className={styles.cardTitle}>{job.name}</h3>
						</div>
						<div className={styles.cardStatus}>
							<Icon
								name={getJobStatusIcon(job.status)}
								size={14}
								style={{ color: getJobStatusColor(job.status) }}
							/>
							<span
								className={styles.statusText}
								style={{ color: getJobStatusColor(job.status) }}
							>
								{is_cn
									? {
											draft: '草稿',
											ready: '就绪',
											running: '运行中',
											completed: '已完成',
											failed: '失败',
											disabled: '已禁用',
											deleted: '已删除'
									  }[job.status] || job.status
									: job.status}
							</span>
						</div>
					</div>
				</div>

				<div className={styles.cardContent}>
					<p className={styles.cardDescription}>
						{job.description || (is_cn ? '无描述' : 'No description')}
					</p>
				</div>

				<div className={styles.cardFooter}>
					<div className={styles.taskInfo}>
						<div className={styles.infoItem}>
							<Icon name='material-schedule' size={12} />
							<span>
								{is_cn ? '创建时间' : 'Created'}: {formatTime(job.created_at)}
							</span>
						</div>
						{job.last_run_at && (
							<div className={styles.infoItem}>
								<Icon name='material-timer' size={12} />
								<span>
									{is_cn ? '最后运行' : 'Last run'}: {formatTime(job.last_run_at)}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	// 渲染 Job 列表
	const renderJobs = () => {
		if (loading && jobs.length === 0) {
			return (
				<div className={styles.loading}>
					<Spin size='large' />
					<span style={{ marginLeft: 8 }}>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			)
		}

		if (jobs.length === 0 && !loading) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-work' size={64} />
					<div className={styles.emptyTitle}>
						{searchKeywords
							? is_cn
								? '未找到匹配的 Job'
								: 'No matching jobs found'
							: is_cn
							? '暂无 Job'
							: 'No Jobs'}
					</div>
					<div className={styles.emptyDescription}>
						{searchKeywords
							? is_cn
								? '尝试调整搜索关键词或选择其他分类'
								: 'Try adjusting your search keywords or select a different category'
							: is_cn
							? '还没有任何 Job'
							: 'No jobs available'}
					</div>
				</div>
			)
		}

		return (
			<>
				<div className={styles.tasksGrid}>{jobs.map(renderJobCard)}</div>

				{/* 加载更多指示器 */}
				{loadingMore && (
					<div className={styles.loading}>
						<Spin />
						<span style={{ marginLeft: 8 }}>
							{is_cn ? '加载更多 Job...' : 'Loading more jobs...'}
						</span>
					</div>
				)}

				{/* 没有更多数据的提示 */}
				{!hasMore && jobs.length > 0 && (
					<div className={styles.loading}>
						<span>{is_cn ? '已加载全部 Job' : 'All jobs loaded'}</span>
					</div>
				)}
			</>
		)
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.titleContainer}>
					<div className={styles.titleWithIcon}>
						<Icon name='material-work' size={24} style={{ color: 'var(--color_page_title)' }} />
						<h1 className={styles.title}>{is_cn ? '作业' : 'Jobs'}</h1>
					</div>
				</div>

				<div className={styles.searchWrapper}>
					<Input
						size='large'
						className={styles.search}
						placeholder={is_cn ? '搜索 Job...' : 'Search jobs...'}
						prefix={<SearchOutlined />}
						value={search}
						onChange={(e) => {
							const value = e.target.value
							setSearch(value)
							if (!value) {
								handleClearSearch()
							}
						}}
						onKeyPress={handleKeyPress}
						allowClear
					/>
					<Button type='primary' size='large' onClick={handleSearch}>
						{is_cn ? '搜索' : 'Search'}
					</Button>
				</div>
			</div>

			<div className={styles.content} ref={containerRef}>
				<div className={styles.sidebar}>{renderCategories()}</div>
				<div className={styles.main}>{renderJobs()}</div>
			</div>

			{/* Job 详情弹窗 */}
			<Modal
				title={
					<div className={styles.modalTitle}>
						<Icon name='material-work' size={18} />
						<span>{is_cn ? 'Job 详情' : 'Job Details'}</span>
					</div>
				}
				open={detailModalVisible}
				onCancel={handleCloseDetail}
				footer={null}
				width={800}
				className={styles.detailModal}
			>
				{selectedJob && (
					<TaskDetail
						task={selectedJob}
						taskDetail={jobDetail}
						loading={detailLoading}
						onRefresh={() => loadJobDetail(selectedJob.job_id)}
					/>
				)}
			</Modal>
		</div>
	)
}

export default Index
