import React, { useState, useEffect } from 'react'
import { Typography, Button, Tooltip, Modal, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'

import {
	Segment,
	SegmentVote,
	SegmentReaction,
	ScrollVotesRequest,
	VoteType,
	AddVotesRequest
} from '@/openapi/kb/types'
import { KB } from '@/openapi'
import { DataTable } from '@/components/ui'
import { DetailModal } from '@/pages/kb/components'
import { TableColumn, TableFilter, TableAction } from '@/components/ui/DataTable/types'
import { DetailSection } from '@/pages/kb/components/DetailModal/types'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface VoteData {
	totalVotes: number
	positiveVotes: number
	negativeVotes: number
	votesByScenario: {
		[key: string]: number
	}
}

interface VoteViewProps {
	segmentData: Segment
	docID: string
}

const VoteView: React.FC<VoteViewProps> = ({ segmentData, docID }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [voteData, setVoteData] = useState<VoteData | null>(null)
	const [loading, setLoading] = useState(true)
	const [tableData, setTableData] = useState<SegmentVote[]>([])
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0
	})
	const [filters, setFilters] = useState<Record<string, any>>({})
	const [hasMore, setHasMore] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [detailVisible, setDetailVisible] = useState(false)
	const [selectedRecord, setSelectedRecord] = useState<SegmentVote | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [addingTestData, setAddingTestData] = useState(false)
	const [scrollId, setScrollId] = useState<string | undefined>(undefined)

	useEffect(() => {
		loadVoteData()
		loadTableData()
	}, [segmentData.id])

	// 生成随机测试数据
	const generateTestData = (): AddVotesRequest => {
		const scenarios = ['智能问答', '文档检索', '知识推荐']
		const sources = ['web_chat', 'api_call', 'mobile_app', 'slack_bot', 'discord_bot', 'vscode_extension']
		const queries = [
			'如何使用这个功能？',
			'这个API的参数是什么？',
			'有什么最佳实践吗？',
			'如何解决这个错误？',
			'有相关的文档吗？',
			'这个配置如何设置？',
			'性能优化建议',
			'安全注意事项',
			'版本兼容性问题',
			'部署流程说明'
		]
		const candidates = [
			'根据文档内容，这个功能可以通过...',
			'API参数包括：id, name, options...',
			'最佳实践建议：1. 确保数据验证 2. 使用缓存...',
			'错误解决方案：检查配置文件和权限设置',
			'相关文档链接：https://docs.example.com',
			'配置步骤：1. 编辑配置文件 2. 重启服务...'
		]

		const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
		const getRandomContext = () => ({
			user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
			session_id: `session_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date().toISOString(),
			metadata: {
				ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
				user_agent: 'Mozilla/5.0 (compatible; TestBot/1.0)',
				language: Math.random() > 0.5 ? 'zh-CN' : 'en-US'
			}
		})

		// 生成 1-3 个测试 vote 记录
		const voteCount = Math.floor(Math.random() * 3) + 1
		const testVotes: SegmentVote[] = []

		for (let i = 0; i < voteCount; i++) {
			const voteType: VoteType = Math.random() > 0.7 ? 'negative' : 'positive' // 70% positive, 30% negative
			testVotes.push({
				id: segmentData.id,
				vote_id: `test_vote_${Date.now()}_${i}`,
				vote: voteType,
				source: getRandomItem(sources),
				scenario: getRandomItem(scenarios),
				query: getRandomItem(queries),
				candidate: getRandomItem(candidates),
				context: getRandomContext()
			})
		}

		const defaultReaction: SegmentReaction = {
			source: 'test_system',
			scenario: '测试数据生成',
			query: '批量测试数据添加',
			context: {
				test: true,
				generated_at: new Date().toISOString(),
				batch_id: `batch_${Date.now()}`
			}
		}

		return {
			segments: testVotes,
			default_reaction: defaultReaction
		}
	}

	// 添加测试数据
	const handleAddTestData = async () => {
		if (!window.$app?.openapi) {
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		try {
			setAddingTestData(true)

			// 生成测试数据
			const testData = generateTestData()

			// 调用 AddVotes API
			const kb = new KB(window.$app.openapi)
			const response = await kb.AddVotes(docID, segmentData.id, testData)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to add test data')
			}

			// 显示成功信息
			const result = response.data
			message.success(is_cn ? '测试数据添加成功！' : 'Test data added successfully!')

			// 刷新数据
			loadVoteData()
			loadTableData()
		} catch (error) {
			console.error('Failed to add test data:', error)
			const errorMsg =
				error instanceof Error ? error.message : is_cn ? '添加测试数据失败' : 'Failed to add test data'
			message.error({
				content: (
					<div>
						<div style={{ fontWeight: 'bold', marginBottom: 4 }}>
							{is_cn ? '添加失败' : 'Add Failed'}
						</div>
						<div style={{ fontSize: '12px', color: '#666' }}>{errorMsg}</div>
					</div>
				),
				duration: 8
			})
		} finally {
			setAddingTestData(false)
		}
	}

	// 定义表格列（设置合理的宽度）
	const columns: TableColumn<SegmentVote>[] = [
		{
			key: 'vote_id',
			title: is_cn ? '投票ID' : 'Vote ID',
			dataIndex: 'vote_id',
			width: 100,
			render: (vote_id: string) => (
				<span className={localStyles.voteId}>{vote_id ? vote_id.slice(-8) : '-'}</span>
			)
		},
		{
			key: 'vote',
			title: is_cn ? '投票' : 'Voting',
			dataIndex: 'vote',
			width: 120,
			render: (vote: VoteType) => (
				<span className={vote === 'positive' ? localStyles.positiveVote : localStyles.negativeVote}>
					<Icon
						name={vote === 'positive' ? 'material-thumb_up' : 'material-thumb_down'}
						size={12}
					/>
					{vote === 'positive' ? (is_cn ? '有用' : 'Useful') : is_cn ? '没用' : 'Useless'}
				</span>
			)
		},
		{
			key: 'scenario',
			title: is_cn ? '场景' : 'Scenario',
			dataIndex: 'scenario',
			width: 120,
			render: (scenario: string) => <span className={localStyles.scenarioTag}>{scenario || '-'}</span>
		},
		{
			key: 'source',
			title: is_cn ? '来源' : 'Source',
			dataIndex: 'source',
			width: 160,
			render: (source: string) => <span className={localStyles.sourceText}>{source || '-'}</span>
		},
		{
			key: 'query',
			title: is_cn ? '查询内容' : 'Query',
			dataIndex: 'query',
			width: 350,
			ellipsis: true,
			render: (query: string) => (
				<Tooltip title={query}>
					<span className={localStyles.queryText}>{query || '-'}</span>
				</Tooltip>
			)
		}
	]

	// 定义筛选器
	const tableFilters: TableFilter[] = [
		{
			key: 'vote_type',
			label: is_cn ? '投票类型' : 'Vote Type',
			type: 'select',
			options: [
				{ label: is_cn ? '全部' : 'All', value: '' },
				{ label: is_cn ? '有用' : 'Useful', value: 'positive' },
				{ label: is_cn ? '没用' : 'Useless', value: 'negative' }
			],
			onChange: (value) => {
				const newFilters = { ...filters }
				if (value) {
					newFilters.vote_type = value
				} else {
					delete newFilters.vote_type
				}
				setFilters(newFilters)
				setHasMore(true) // 重置加载状态
				loadTableData(undefined, false, newFilters) // 传递更新后的过滤器
			}
		},
		{
			key: 'scenario',
			label: is_cn ? '场景' : 'Scenario',
			type: 'select',
			options: [
				{ label: is_cn ? '智能问答' : 'Q&A', value: '智能问答' },
				{ label: is_cn ? '文档检索' : 'Document Search', value: '文档检索' },
				{ label: is_cn ? '知识推荐' : 'Recommendation', value: '知识推荐' }
			],
			onChange: (value) => {
				setFilters((prev) => ({ ...prev, scenario: value }))
				setHasMore(true) // 重置加载状态
				loadTableData({ scenario: value })
			}
		},
		{
			key: 'source',
			label: is_cn ? '来源' : 'Source',
			type: 'select',
			options: [
				{ label: 'Web Chat', value: 'web_chat' },
				{ label: 'API Call', value: 'api_call' },
				{ label: 'Mobile App', value: 'mobile_app' },
				{ label: 'Slack Bot', value: 'slack_bot' },
				{ label: 'Discord Bot', value: 'discord_bot' },
				{ label: 'VS Code', value: 'vscode_extension' }
			],
			onChange: (value) => {
				setFilters((prev) => ({ ...prev, source: value }))
				setHasMore(true) // 重置加载状态
				loadTableData({ source: value })
			}
		}
	]

	// 打开详情弹窗
	const handleViewDetails = async (record: SegmentVote) => {
		if (!record.vote_id || !window.$app?.openapi) {
			message.error(is_cn ? '无法获取详情信息' : 'Cannot get detail information')
			return
		}

		setDetailVisible(true)
		setDetailLoading(true)
		setSelectedRecord(record) // 先设置基本信息，避免弹窗空白

		try {
			const kb = new KB(window.$app.openapi)
			const response = await kb.GetVote(docID, segmentData.id, record.vote_id)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to get vote details')
			}

			// 更新为完整的详情数据
			if (response.data) {
				setSelectedRecord(response.data.vote)
			}
		} catch (error) {
			console.error('Failed to load vote details:', error)
			message.error(is_cn ? '获取详情失败' : 'Failed to load details')
			// 保持使用列表中的基本数据
		} finally {
			setDetailLoading(false)
		}
	}

	// 关闭详情弹窗
	const handleCloseDetails = () => {
		setDetailVisible(false)
		setSelectedRecord(null)
	}

	// 处理删除
	const handleDelete = async (record: SegmentVote) => {
		if (!record.vote_id || !window.$app?.openapi) {
			message.error(is_cn ? '无法删除记录' : 'Cannot delete record')
			return
		}

		try {
			const kb = new KB(window.$app.openapi)
			const response = await kb.RemoveVotes(docID, segmentData.id, [record.vote_id])

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to delete vote record')
			}

			// 从本地状态中移除
			setTableData((prevData) => prevData.filter((item) => item.vote_id !== record.vote_id))
			setPagination((prev) => ({ ...prev, total: prev.total - 1 }))

			// 更新统计数据
			setVoteData((prev) => {
				if (!prev) return prev
				const newTotal = Math.max(0, prev.totalVotes - 1)
				const isPositive = record.vote === 'positive'
				const newPositive = isPositive ? Math.max(0, prev.positiveVotes - 1) : prev.positiveVotes
				const newNegative = !isPositive ? Math.max(0, prev.negativeVotes - 1) : prev.negativeVotes
				const newScenarioCounts = { ...prev.votesByScenario }
				if (record.scenario && newScenarioCounts[record.scenario]) {
					newScenarioCounts[record.scenario] = Math.max(0, newScenarioCounts[record.scenario] - 1)
					if (newScenarioCounts[record.scenario] === 0) {
						delete newScenarioCounts[record.scenario]
					}
				}
				return {
					totalVotes: newTotal,
					positiveVotes: newPositive,
					negativeVotes: newNegative,
					votesByScenario: newScenarioCounts
				}
			})

			const result = response.data
			message.success(is_cn ? '删除成功！' : 'Deleted successfully!')
		} catch (error) {
			console.error('Delete failed:', error)
			const errorMsg = error instanceof Error ? error.message : is_cn ? '删除失败' : 'Delete failed'
			message.error(errorMsg)
		}
	}

	// 定义操作按钮
	const actions: TableAction<SegmentVote>[] = [
		{
			key: 'view',
			label: is_cn ? '查看详情' : 'View Details',
			icon: <Icon name='material-visibility' size={14} />,
			onClick: (record) => {
				handleViewDetails(record)
			}
		},
		{
			key: 'delete',
			label: is_cn ? '删除' : 'Delete',
			icon: <Icon name='material-delete' size={14} />,
			type: 'text',
			onClick: (record) => {
				// 使用 Modal.confirm 来显示确认对话框
				Modal.confirm({
					title: is_cn ? '确认删除' : 'Confirm Delete',
					content: is_cn
						? '确定要删除这条投票记录吗？删除后将无法恢复！'
						: 'Are you sure to delete this vote record? This action cannot be undone!',
					okText: is_cn ? '确认' : 'Confirm',
					cancelText: is_cn ? '取消' : 'Cancel',
					okType: 'danger',
					onOk: () => handleDelete(record)
				})
			}
		}
	]

	const loadVoteData = async () => {
		// 初始统计数据将在 loadTableData 中更新
		setVoteData({
			totalVotes: 0,
			positiveVotes: 0,
			negativeVotes: 0,
			votesByScenario: {}
		})
	}

	const loadTableData = async (
		params?: Partial<ScrollVotesRequest>,
		isLoadMore = false,
		customFilters?: Record<string, any>
	) => {
		if (!window.$app?.openapi) {
			console.error('OpenAPI not available')
			return
		}

		try {
			if (!isLoadMore) {
				setLoading(true)
				setTableData([]) // 重新搜索时清空数据
				setScrollId(undefined) // 重置滚动ID
			} else {
				setLoadingMore(true)
			}

			const request: ScrollVotesRequest = {
				limit: 10, // 每次加载10条
				scroll_id: isLoadMore ? scrollId : undefined,
				...params
			}

			// 使用传入的 customFilters 或当前的 filters 状态
			const activeFilters = customFilters || filters

			// 只有当 filters 中有有效值时才添加到请求中
			Object.keys(activeFilters).forEach((key) => {
				const value = activeFilters[key]
				if (value !== undefined && value !== null && value !== '') {
					;(request as any)[key] = value
				}
			})

			const kb = new KB(window.$app.openapi)
			const response = await kb.ScrollVotes(docID, segmentData.id, request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load votes data')
			}

			const result = response.data

			if (!result) {
				throw new Error('No data received from API')
			}

			// 处理 votes 可能为 null 的情况
			const votes = result.votes ?? []

			if (isLoadMore) {
				// 追加数据
				setTableData((prev) => [...prev, ...votes])
			} else {
				// 替换数据
				setTableData(votes)
			}

			// 更新分页信息
			setPagination((prev) => ({
				...prev,
				total: result.total || 0
			}))

			// 更新滚动状态
			setScrollId(result.next_cursor)
			setHasMore(result.has_more)

			// 更新统计数据
			if (!isLoadMore && result.total !== undefined) {
				// 计算场景统计和投票类型统计
				const scenarioCounts: Record<string, number> = {}
				let positiveCount = 0
				let negativeCount = 0

				votes.forEach((vote) => {
					if (vote.scenario) {
						scenarioCounts[vote.scenario] = (scenarioCounts[vote.scenario] || 0) + 1
					}
					if (vote.vote === 'positive') {
						positiveCount++
					} else if (vote.vote === 'negative') {
						negativeCount++
					}
				})

				setVoteData({
					totalVotes: result.total || 0,
					positiveVotes: positiveCount,
					negativeVotes: negativeCount,
					votesByScenario: scenarioCounts
				})
			}
		} catch (error) {
			console.error('Failed to load votes table data:', error)
			message.error(is_cn ? '加载投票数据失败' : 'Failed to load votes data')
		} finally {
			setLoading(false)
			setLoadingMore(false)
		}
	}

	// 加载更多数据
	const handleLoadMore = () => {
		if (!loadingMore && hasMore) {
			loadTableData(undefined, true)
		}
	}

	// 处理搜索 - ScrollVotes API 暂不支持关键字搜索
	const handleSearch = (value: string) => {
		// ScrollVotesRequest 不支持 keywords 参数，暂时保留函数以备后续扩展
		console.log('Search not supported in ScrollVotes API:', value)
	}

	// 配置详情弹窗的字段
	const detailSections: DetailSection[] = [
		{
			title: is_cn ? '基本信息' : 'Basic Information',
			fields: [
				{
					key: 'id',
					label: is_cn ? '段落ID' : 'Segment ID',
					value: selectedRecord?.id,
					span: 12,
					copyable: true
				},
				{
					key: 'vote_id',
					label: is_cn ? '投票ID' : 'Vote ID',
					value: selectedRecord?.vote_id,
					span: 12,
					copyable: true
				},
				{
					key: 'vote',
					label: is_cn ? '投票' : 'Voting',
					value: selectedRecord?.vote,
					span: 12,
					render: (value: VoteType) => (
						<span
							className={
								value === 'positive'
									? localStyles.positiveVote
									: localStyles.negativeVote
							}
						>
							<Icon
								name={
									value === 'positive' ? 'material-thumb_up' : 'material-thumb_down'
								}
								size={12}
							/>
							{value === 'positive'
								? is_cn
									? '有用'
									: 'Useful'
								: is_cn
								? '没用'
								: 'Useless'}
						</span>
					)
				},
				{
					key: 'scenario',
					label: is_cn ? '场景' : 'Scenario',
					value: selectedRecord?.scenario,
					span: 12,
					type: 'tag'
				},
				{
					key: 'source',
					label: is_cn ? '来源' : 'Source',
					value: selectedRecord?.source,
					span: 12,
					type: 'tag'
				},
				{
					key: 'hit_id',
					label: is_cn ? '关联命中ID' : 'Associated Hit ID',
					value: selectedRecord?.hit_id,
					span: 12,
					copyable: true
				}
			]
		},
		{
			title: is_cn ? '查询信息' : 'Query Information',
			fields: [
				{
					key: 'query',
					label: is_cn ? '查询内容' : 'Query',
					value: selectedRecord?.query,
					span: 24,
					copyable: true
				},
				{
					key: 'candidate',
					label: is_cn ? '候选答案' : 'Candidate',
					value: selectedRecord?.candidate,
					span: 24,
					copyable: true
				}
			]
		},
		{
			title: 'Context',
			collapsible: true,
			fields: [
				{
					key: 'context',
					label: is_cn ? '上下文数据' : 'Context Data',
					value: selectedRecord?.context,
					span: 24,
					type: 'json'
				}
			]
		}
	]

	// 初始化数据
	useEffect(() => {
		loadVoteData()
		loadTableData()
	}, [segmentData.id])

	return (
		<div className={styles.tabContent}>
			{/* Header - 与Hits一致的结构 */}
			<div className={`${styles.tabHeader} ${localStyles.cardHeader}`}>
				<div className={localStyles.chunkMeta}>
					<span className={localStyles.chunkNumber}>
						{segmentData.metadata?.chunk_details?.depth !== undefined &&
						segmentData.metadata?.chunk_details?.index !== undefined ? (
							<>
								<span className={localStyles.levelInfo}>
									<Icon name='material-account_tree' size={10} />
									{segmentData.metadata.chunk_details.depth}
								</span>
								<span>#{segmentData.metadata.chunk_details.index + 1}</span>
							</>
						) : (
							`#${segmentData.id.slice(-8)}`
						)}
					</span>
				</div>
				<div className={localStyles.metaInfo}>
					<span className={localStyles.metaItem}>
						{is_cn ? '有用' : 'Useful'}{' '}
						<span className={localStyles.metaNumber} style={{ color: 'var(--color_success)' }}>
							{voteData?.positiveVotes || 0}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '没用' : 'Useless'}{' '}
						<span className={localStyles.metaNumber} style={{ color: 'var(--color_danger)' }}>
							{voteData?.negativeVotes || 0}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '总计' : 'Total'}{' '}
						<span className={localStyles.metaNumber}>{voteData?.totalVotes || 0}</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '场景数' : 'Scenarios'}{' '}
						<span className={localStyles.metaNumber}>
							{Object.keys(voteData?.votesByScenario || {}).length}
						</span>
					</span>
				</div>
			</div>

			{/* Body - 表格内容 */}
			<div className={styles.tableContainer}>
				{loading ? (
					<div className={localStyles.loadingState}>
						<Icon name='material-hourglass_empty' size={32} />
						<Text>{is_cn ? '正在加载投票记录...' : 'Loading vote records...'}</Text>
					</div>
				) : (
					<DataTable<SegmentVote>
						data={tableData}
						columns={columns}
						loading={false} // 不使用DataTable内置的loading
						total={pagination.total} // 传递总记录数
						columnWidthPreset='normal' // 使用预设的列宽配置
						autoFitColumns={true} // 自动适应容器宽度
						pagination={false} // 禁用分页器，使用滚动
						filters={tableFilters}
						rowKey={(record, index) => record.vote_id || `${record.id}-${index}`}
						// searchPlaceholder={is_cn ? '搜索查询内容...' : 'Search queries...'}
						// onSearch={handleSearch}
						extraActions={
							<Button
								type='primary'
								ghost
								size='small'
								loading={addingTestData}
								onClick={handleAddTestData}
								icon={<Icon name='material-add_circle' size={14} />}
							>
								{is_cn ? '添加测试数据' : 'Add Test Data'}
							</Button>
						}
						actions={actions}
						size='small'
						scroll={{ x: 'max-content' }} // 只设置水平滚动，垂直滚动由CSS控制
						hasMore={hasMore} // 是否还有更多数据
						onLoadMore={handleLoadMore} // 加载更多回调
						loadingMore={loadingMore} // 加载状态
					/>
				)}
			</div>

			{/* 详情弹窗 */}
			<DetailModal<SegmentVote>
				visible={detailVisible}
				onClose={handleCloseDetails}
				title={is_cn ? '投票记录详情' : 'Vote Record Details'}
				data={selectedRecord}
				sections={detailSections}
				width='60%'
				height='90vh'
				size='middle'
				loading={detailLoading}
			/>
		</div>
	)
}

export default VoteView
