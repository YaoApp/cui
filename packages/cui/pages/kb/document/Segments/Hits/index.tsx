import React, { useState, useEffect } from 'react'
import { Typography, Button, Tooltip, Modal, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'

import { Segment, AddHitsRequest, SegmentHit, SegmentReaction, ScrollHitsRequest } from '@/openapi/kb/types'
import { KB } from '@/openapi'
import { DataTable } from '@/components/ui'
import { DetailModal } from '@/pages/kb/components'
import { TableColumn, TableFilter, TableAction } from '@/components/ui/DataTable/types'
import { DetailSection } from '@/pages/kb/components/DetailModal/types'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface HitsData {
	totalHits: number
	hitsByScenario: {
		[key: string]: number
	}
}

interface HitsViewProps {
	segmentData: Segment
	docID: string
}

const HitsView: React.FC<HitsViewProps> = ({ segmentData, docID }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [hitsData, setHitsData] = useState<HitsData | null>(null)
	const [loading, setLoading] = useState(true)
	const [tableData, setTableData] = useState<SegmentHit[]>([])
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0
	})
	const [filters, setFilters] = useState<Record<string, any>>({})
	const [hasMore, setHasMore] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [detailVisible, setDetailVisible] = useState(false)
	const [selectedRecord, setSelectedRecord] = useState<SegmentHit | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [addingTestData, setAddingTestData] = useState(false)
	const [scrollId, setScrollId] = useState<string | undefined>(undefined)

	useEffect(() => {
		loadHitsData()
		loadTableData()
	}, [segmentData.id])

	// 生成随机测试数据
	const generateTestData = (): AddHitsRequest => {
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

		// 生成 1-3 个测试 hit 记录
		const hitCount = Math.floor(Math.random() * 3) + 1
		const testHits: SegmentHit[] = []

		for (let i = 0; i < hitCount; i++) {
			testHits.push({
				id: segmentData.id,
				hit_id: `test_hit_${Date.now()}_${i}`,
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
			segments: testHits,
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

			// 调用 AddHits API
			const kb = new KB(window.$app.openapi)
			const response = await kb.AddHits(docID, segmentData.id, testData)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to add test data')
			}

			// 显示成功信息
			const result = response.data
			message.success(is_cn ? '测试数据添加成功！' : 'Test data added successfully!')

			// 刷新数据
			loadHitsData()
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

	const loadHitsData = async () => {
		// 初始统计数据将在 loadTableData 中更新
		setHitsData({
			totalHits: 0,
			hitsByScenario: {}
		})
	}

	const loadTableData = async (params?: Partial<ScrollHitsRequest>, isLoadMore = false) => {
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

			const request: ScrollHitsRequest = {
				limit: 10, // 每次加载10条
				scroll_id: isLoadMore ? scrollId : undefined,
				...filters,
				...params
			}

			const kb = new KB(window.$app.openapi)
			const response = await kb.ScrollHits(docID, segmentData.id, request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load hits data')
			}

			const result = response.data

			if (!result) {
				throw new Error('No data received from API')
			}

			// 处理 hits 可能为 null 的情况
			const hits = result.hits ?? []

			if (isLoadMore) {
				// 追加数据
				setTableData((prev) => [...prev, ...hits])
			} else {
				// 替换数据
				setTableData(hits)
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
				// 计算场景统计
				const scenarioCounts: Record<string, number> = {}
				hits.forEach((hit) => {
					if (hit.scenario) {
						scenarioCounts[hit.scenario] = (scenarioCounts[hit.scenario] || 0) + 1
					}
				})

				setHitsData({
					totalHits: result.total || 0,
					hitsByScenario: scenarioCounts
				})
			}
		} catch (error) {
			console.error('Failed to load hits table data:', error)
			message.error(is_cn ? '加载命中数据失败' : 'Failed to load hits data')
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

	// 定义表格列（设置合理的宽度）
	const columns: TableColumn<SegmentHit>[] = [
		{
			key: 'hit_id',
			title: is_cn ? '命中ID' : 'Hit ID',
			dataIndex: 'hit_id',
			width: 120,
			render: (hit_id: string) => (
				<span className={localStyles.hitId}>{hit_id ? hit_id.slice(-8) : '-'}</span>
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
			width: 180,
			render: (source: string) => <span className={localStyles.sourceText}>{source || '-'}</span>
		},
		{
			key: 'query',
			title: is_cn ? '查询内容' : 'Query',
			dataIndex: 'query',
			width: 400,
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
	const handleViewDetails = async (record: SegmentHit) => {
		if (!record.hit_id || !window.$app?.openapi) {
			message.error(is_cn ? '无法获取详情信息' : 'Cannot get detail information')
			return
		}

		setDetailVisible(true)
		setDetailLoading(true)
		setSelectedRecord(record) // 先设置基本信息，避免弹窗空白

		try {
			const kb = new KB(window.$app.openapi)
			const response = await kb.GetHit(docID, segmentData.id, record.hit_id)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to get hit details')
			}

			// 更新为完整的详情数据
			if (response.data) {
				setSelectedRecord(response.data.hit)
			}
		} catch (error) {
			console.error('Failed to load hit details:', error)
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
	const handleDelete = async (record: SegmentHit) => {
		if (!record.hit_id || !window.$app?.openapi) {
			message.error(is_cn ? '无法删除记录' : 'Cannot delete record')
			return
		}

		try {
			const kb = new KB(window.$app.openapi)
			const response = await kb.RemoveHits(docID, segmentData.id, [record.hit_id])

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to delete hit record')
			}

			// 从本地状态中移除
			setTableData((prevData) => prevData.filter((item) => item.hit_id !== record.hit_id))
			setPagination((prev) => ({ ...prev, total: prev.total - 1 }))

			// 更新统计数据
			setHitsData((prev) => {
				if (!prev) return prev
				const newTotal = Math.max(0, prev.totalHits - 1)
				const newScenarioCounts = { ...prev.hitsByScenario }
				if (record.scenario && newScenarioCounts[record.scenario]) {
					newScenarioCounts[record.scenario] = Math.max(0, newScenarioCounts[record.scenario] - 1)
					if (newScenarioCounts[record.scenario] === 0) {
						delete newScenarioCounts[record.scenario]
					}
				}
				return {
					totalHits: newTotal,
					hitsByScenario: newScenarioCounts
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
	const actions: TableAction<SegmentHit>[] = [
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
						? '确定要删除这条命中记录吗？删除后将无法恢复！'
						: 'Are you sure to delete this hit record? This action cannot be undone!',
					okText: is_cn ? '确认' : 'Confirm',
					cancelText: is_cn ? '取消' : 'Cancel',
					okType: 'danger',
					onOk: () => handleDelete(record)
				})
			}
		}
	]

	// 处理搜索 - ScrollHits API 暂不支持关键字搜索
	const handleSearch = (value: string) => {
		// ScrollHitsRequest 不支持 keywords 参数，暂时保留函数以备后续扩展
		console.log('Search not supported in ScrollHits API:', value)
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
					key: 'hit_id',
					label: is_cn ? '命中ID' : 'Hit ID',
					value: selectedRecord?.hit_id,
					span: 12,
					copyable: true
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

	return (
		<div className={styles.tabContent}>
			{/* Header - 与Editor一致的结构 */}
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
						{is_cn ? '总命中' : 'Total Hits'}{' '}
						<span className={localStyles.metaNumber}>{hitsData?.totalHits || 0}</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '场景数' : 'Scenarios'}{' '}
						<span className={localStyles.metaNumber}>
							{Object.keys(hitsData?.hitsByScenario || {}).length}
						</span>
					</span>
				</div>
			</div>

			{/* Body - 表格内容 */}
			<div className={styles.tableContainer}>
				{loading ? (
					<div className={localStyles.loadingState}>
						<Icon name='material-hourglass_empty' size={32} />
						<Text>{is_cn ? '正在加载命中记录...' : 'Loading hit records...'}</Text>
					</div>
				) : (
					<DataTable<SegmentHit>
						data={tableData}
						columns={columns}
						loading={false} // 不使用DataTable内置的loading
						total={pagination.total} // 传递总记录数
						columnWidthPreset='normal' // 使用预设的列宽配置
						autoFitColumns={true} // 自动适应容器宽度
						pagination={false} // 禁用分页器，使用滚动
						filters={tableFilters}
						rowKey={(record, index) => record.hit_id || `${record.id}-${index}`}
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
			<DetailModal<SegmentHit>
				visible={detailVisible}
				onClose={handleCloseDetails}
				title={is_cn ? '命中记录详情' : 'Hit Record Details'}
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

export default HitsView
