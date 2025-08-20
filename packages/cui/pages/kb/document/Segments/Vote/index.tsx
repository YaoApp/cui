import React, { useState, useEffect } from 'react'
import { Typography, Button, message, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'

import { Segment } from '@/openapi/kb/types'
import { VoteRecord } from '@/pages/kb/types'
import { DataTable, DetailModal } from '@/pages/kb/components'
import { TableColumn, TableFilter, TableAction } from '@/pages/kb/components/DataTable/types'
import { DetailSection } from '@/pages/kb/components/DetailModal/types'
import { mockListVotes, ListVotesRequest } from './mockData'
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
}

const VoteView: React.FC<VoteViewProps> = ({ segmentData }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Vote统计数据
	const [voteData, setVoteData] = useState<VoteData | null>(null)
	const [loadingStats, setLoadingStats] = useState(true)

	// 表格数据状态
	const [tableData, setTableData] = useState<VoteRecord[]>([])
	const [loading, setLoading] = useState(false)
	const [loadingMore, setLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(true)
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0
	})

	// 详情弹窗状态
	const [detailVisible, setDetailVisible] = useState(false)
	const [selectedRecord, setSelectedRecord] = useState<VoteRecord | null>(null)

	// JSON代码高亮组件
	const JSONCode: React.FC<{ data: any }> = ({ data }) => {
		const jsonString = JSON.stringify(data, null, 2)

		// 使用正则表达式进行简单的语法高亮
		const highlightedJSON = jsonString
			.replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
			.replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
			.replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
			.replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
			.replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')

		return (
			<div className={localStyles.contextCode}>
				<pre dangerouslySetInnerHTML={{ __html: highlightedJSON }} />
			</div>
		)
	}

	// 表格列定义
	const columns: TableColumn<VoteRecord>[] = [
		{
			key: 'scenario',
			title: is_cn ? '场景' : 'Scenario',
			dataIndex: 'scenario',
			width: 120,
			render: (scenario: string) => <span className={localStyles.scenarioTag}>{scenario}</span>
		},
		{
			key: 'source',
			title: is_cn ? '来源' : 'Source',
			dataIndex: 'source',
			width: 140,
			render: (source: string) => <span className={localStyles.sourceText}>{source}</span>
		},
		{
			key: 'query',
			title: is_cn ? '查询' : 'Query',
			dataIndex: 'query',
			width: 250,
			ellipsis: true,
			render: (query: string) => (
				<Tooltip title={query}>
					<span className={localStyles.queryText}>{query || '-'}</span>
				</Tooltip>
			)
		},
		{
			title: is_cn ? '上下文' : 'Context',
			dataIndex: 'context',
			key: 'context',
			width: 300,
			render: (value: any) => <JSONCode data={value} />
		},
		{
			title: is_cn ? '好评' : 'Positive',
			dataIndex: 'positive_votes',
			key: 'positive_votes',
			width: 80,
			render: (value: number) => <span className={styles.positiveVotes}>{value}</span>
		},
		{
			title: is_cn ? '差评' : 'Negative',
			dataIndex: 'negative_votes',
			key: 'negative_votes',
			width: 80,
			render: (value: number) => <span className={styles.negativeVotes}>{value}</span>
		},
		{
			key: 'created_at',
			title: is_cn ? '创建时间' : 'Created At',
			dataIndex: 'created_at',
			width: 180,
			render: (date: string) => (
				<span className={localStyles.timestamp}>
					{new Date(date).toLocaleString(is_cn ? 'zh-CN' : 'en-US')}
				</span>
			)
		}
	]

	// 表格筛选器定义
	const tableFilters: TableFilter[] = [
		{
			key: 'scenario',
			label: is_cn ? '场景' : 'Scenario',
			type: 'select',
			options: [
				{ label: is_cn ? '智能问答' : 'Smart Q&A', value: '智能问答' },
				{ label: is_cn ? '文档检索' : 'Document Search', value: '文档检索' },
				{ label: is_cn ? '知识推荐' : 'Knowledge Recommendation', value: '知识推荐' },
				{ label: is_cn ? '内容生成' : 'Content Generation', value: '内容生成' },
				{ label: is_cn ? '数据分析' : 'Data Analysis', value: '数据分析' }
			],
			onChange: (value) => {
				handleFilter({ scenario: value })
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
				{ label: 'Email Assistant', value: 'email_assistant' }
			],
			onChange: (value) => {
				handleFilter({ source: value })
			}
		}
	]

	// 打开详情弹窗
	const handleViewDetails = (record: VoteRecord) => {
		setSelectedRecord(record)
		setDetailVisible(true)
	}

	// 关闭详情弹窗
	const handleCloseDetails = () => {
		setDetailVisible(false)
		setSelectedRecord(null)
	}

	// 定义操作按钮
	const actions: TableAction<VoteRecord>[] = [
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
				console.log('Delete vote:', record)
				// TODO: 删除确认
			}
		}
	]

	// 加载Vote统计数据
	const loadVoteData = async () => {
		try {
			setLoadingStats(true)
			// 模拟API请求延时
			await new Promise((resolve) => setTimeout(resolve, 100))

			// 模拟Vote统计数据
			const mockStats: VoteData = {
				totalVotes: 1250,
				positiveVotes: 980,
				negativeVotes: 270,
				votesByScenario: {
					智能问答: 450,
					文档检索: 320,
					知识推荐: 280,
					内容生成: 150,
					数据分析: 50
				}
			}

			setVoteData(mockStats)
		} catch (error) {
			console.error('Failed to load vote stats:', error)
		} finally {
			setLoadingStats(false)
		}
	}

	// 加载表格数据
	const loadTableData = async (isLoadMore = false) => {
		try {
			if (isLoadMore) {
				setLoadingMore(true)
			} else {
				setLoading(true)
			}

			const currentPage = isLoadMore ? pagination.current + 1 : 1
			const request: ListVotesRequest = {
				page: currentPage,
				pagesize: pagination.pageSize
			}

			const response = await mockListVotes(request)

			if (isLoadMore) {
				// 追加数据
				setTableData((prevData) => [...prevData, ...response.data])
				setPagination((prev) => ({
					...prev,
					current: currentPage
				}))
			} else {
				// 重置数据
				setTableData(response.data)
				setPagination((prev) => ({
					...prev,
					current: 1,
					total: response.total
				}))
			}

			// 计算是否还有更多数据
			const totalPages = Math.ceil(response.total / request.pagesize!)
			setHasMore(currentPage < totalPages)
		} catch (error) {
			console.error('加载投票数据失败:', error)
			message.error(is_cn ? '加载数据失败' : 'Failed to load data')
		} finally {
			if (isLoadMore) {
				setLoadingMore(false)
			} else {
				setLoading(false)
			}
		}
	}

	// 处理加载更多
	const handleLoadMore = () => {
		if (!loadingMore && hasMore) {
			loadTableData(true)
		}
	}

	// 处理搜索
	const handleSearch = async (searchValue: string) => {
		try {
			setLoading(true)
			const request: ListVotesRequest = {
				page: 1,
				pagesize: pagination.pageSize,
				query: searchValue
			}

			const response = await mockListVotes(request)

			setTableData(response.data)
			setPagination((prev) => ({
				...prev,
				current: 1,
				total: response.total
			}))

			const totalPages = Math.ceil(response.total / request.pagesize!)
			setHasMore(1 < totalPages)
		} catch (error) {
			console.error('搜索失败:', error)
			message.error(is_cn ? '搜索失败' : 'Search failed')
		} finally {
			setLoading(false)
		}
	}

	// 处理筛选
	const handleFilter = async (filters: Record<string, any>) => {
		try {
			setLoading(true)
			const request: ListVotesRequest = {
				page: 1,
				pagesize: pagination.pageSize,
				scenario: filters.scenario,
				source: filters.source
			}

			const response = await mockListVotes(request)

			setTableData(response.data)
			setPagination((prev) => ({
				...prev,
				current: 1,
				total: response.total
			}))

			const totalPages = Math.ceil(response.total / request.pagesize!)
			setHasMore(1 < totalPages)
		} catch (error) {
			console.error('筛选失败:', error)
			message.error(is_cn ? '筛选失败' : 'Filter failed')
		} finally {
			setLoading(false)
		}
	}

	// 配置详情弹窗的字段
	const detailSections: DetailSection[] = [
		{
			title: is_cn ? '基本信息' : 'Basic Information',
			fields: [
				{
					key: 'id',
					label: 'ID',
					value: selectedRecord?.id,
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
				},
				{
					key: 'created_at',
					label: is_cn ? '创建时间' : 'Created At',
					value: selectedRecord?.created_at,
					span: 12,
					type: 'time'
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
				}
			]
		},
		{
			title: is_cn ? '投票统计' : 'Vote Statistics',
			fields: [
				{
					key: 'positive_votes',
					label: is_cn ? '好评数' : 'Positive Votes',
					value: selectedRecord?.positive_votes,
					span: 12,
					render: (value) => (
						<span style={{ color: 'var(--color_success)', fontWeight: 'bold' }}>
							{value || 0}
						</span>
					)
				},
				{
					key: 'negative_votes',
					label: is_cn ? '差评数' : 'Negative Votes',
					value: selectedRecord?.negative_votes,
					span: 12,
					render: (value) => (
						<span style={{ color: 'var(--color_error)', fontWeight: 'bold' }}>
							{value || 0}
						</span>
					)
				}
			]
		},
		{
			title: 'Context',
			collapsible: true,
			fields: [
				{
					key: 'context',
					label: 'Context Data',
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
						{is_cn ? '好评' : 'Positive'}{' '}
						<span className={localStyles.metaNumber} style={{ color: 'var(--color_success)' }}>
							{voteData?.positiveVotes || 0}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '差评' : 'Negative'}{' '}
						<span className={localStyles.metaNumber} style={{ color: 'var(--color_error)' }}>
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
				<DataTable<VoteRecord>
					data={tableData}
					columns={columns}
					loading={loading}
					total={pagination.total}
					columnWidthPreset='normal'
					autoFitColumns={true}
					pagination={false}
					filters={tableFilters}
					searchPlaceholder={is_cn ? '搜索查询内容...' : 'Search queries...'}
					onSearch={handleSearch}
					actions={actions}
					size='small'
					scroll={{ x: 'max-content' }}
					hasMore={hasMore}
					onLoadMore={handleLoadMore}
					loadingMore={loadingMore}
				/>
			</div>

			{/* 详情弹窗 */}
			<DetailModal<VoteRecord>
				visible={detailVisible}
				onClose={handleCloseDetails}
				title={is_cn ? '投票记录详情' : 'Vote Record Details'}
				data={selectedRecord}
				sections={detailSections}
				width='60%'
				size='middle'
			/>
		</div>
	)
}

export default VoteView
