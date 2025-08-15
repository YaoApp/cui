import React, { useState, useEffect } from 'react'
import { Table, Button, Popconfirm, message, Tag, Avatar } from 'antd'
import { DeleteOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from '../detail.less'
import localStyles from './index.less'

interface VoteRecord {
	id: string
	source: string
	query: string
	rank: number
	voteType: 'good' | 'bad'
	user: {
		name: string
		avatar?: string
		id: string
	}
	timestamp: string
	reason?: string
}

interface VoteListProps {
	chunkId: string
}

const VoteList: React.FC<VoteListProps> = ({ chunkId }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [data, setData] = useState<VoteRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [currentPage, setCurrentPage] = useState(1)
	const pageSize = 10

	useEffect(() => {
		loadVoteData()
	}, [chunkId])

	const loadVoteData = async () => {
		try {
			setLoading(true)
			// 模拟加载时间
			await new Promise((resolve) => setTimeout(resolve, 500))

			// 模拟投票数据
			const mockData: VoteRecord[] = [
				{
					id: 'vote_1',
					source: 'search_result',
					query: '系统架构设计',
					rank: 1,
					voteType: 'good',
					user: {
						id: 'user_1',
						name: '张三',
						avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
					},
					timestamp: '2024-01-15 14:32:15',
					reason: '内容准确，解决了我的问题'
				},
				{
					id: 'vote_2',
					source: 'recommendation',
					query: '数据处理流程',
					rank: 3,
					voteType: 'bad',
					user: {
						id: 'user_2',
						name: '李四'
					},
					timestamp: '2024-01-15 13:28:42',
					reason: '内容过于简单，缺少详细说明'
				},
				{
					id: 'vote_3',
					source: 'search_result',
					query: 'API接口文档',
					rank: 1,
					voteType: 'good',
					user: {
						id: 'user_3',
						name: '王五',
						avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
					},
					timestamp: '2024-01-15 12:15:30'
				},
				{
					id: 'vote_4',
					source: 'auto_complete',
					query: '安全性要求',
					rank: 5,
					voteType: 'good',
					user: {
						id: 'user_4',
						name: '赵六'
					},
					timestamp: '2024-01-15 11:45:18'
				},
				{
					id: 'vote_5',
					source: 'search_result',
					query: '用户界面设计',
					rank: 2,
					voteType: 'bad',
					user: {
						id: 'user_5',
						name: '钱七',
						avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5'
					},
					timestamp: '2024-01-15 10:30:25',
					reason: '示例代码有误'
				},
				{
					id: 'vote_6',
					source: 'recommendation',
					query: '数据库优化',
					rank: 4,
					voteType: 'good',
					user: {
						id: 'user_6',
						name: '孙八'
					},
					timestamp: '2024-01-15 09:22:10'
				}
			]

			setData(mockData)
		} catch (error) {
			message.error(is_cn ? '加载投票数据失败' : 'Failed to load vote data')
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async (id: string) => {
		try {
			// 模拟删除请求
			await new Promise((resolve) => setTimeout(resolve, 300))

			setData((prev) => prev.filter((item) => item.id !== id))
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
		} catch (error) {
			message.error(is_cn ? '删除失败' : 'Failed to delete')
		}
	}

	const getSourceColor = (source: string) => {
		switch (source) {
			case 'search_result':
				return 'blue'
			case 'recommendation':
				return 'green'
			case 'auto_complete':
				return 'orange'
			default:
				return 'default'
		}
	}

	const getSourceLabel = (source: string) => {
		switch (source) {
			case 'search_result':
				return is_cn ? '搜索结果' : 'Search Result'
			case 'recommendation':
				return is_cn ? '推荐' : 'Recommendation'
			case 'auto_complete':
				return is_cn ? '自动补全' : 'Auto Complete'
			default:
				return source
		}
	}

	const columns = [
		{
			title: is_cn ? '来源' : 'Source',
			dataIndex: 'source',
			key: 'source',
			width: '12%',
			render: (source: string) => <Tag color={getSourceColor(source)}>{getSourceLabel(source)}</Tag>
		},
		{
			title: is_cn ? '查询内容' : 'Query',
			dataIndex: 'query',
			key: 'query',
			width: '25%',
			render: (text: string) => (
				<div className={styles.queryText} title={text}>
					{text}
				</div>
			)
		},
		{
			title: is_cn ? '排名' : 'Rank',
			dataIndex: 'rank',
			key: 'rank',
			width: '8%',
			render: (rank: number) => (
				<Tag color={rank <= 3 ? 'success' : rank <= 5 ? 'warning' : 'default'}>#{rank}</Tag>
			)
		},
		{
			title: is_cn ? '评价' : 'Vote',
			dataIndex: 'voteType',
			key: 'voteType',
			width: '10%',
			render: (voteType: 'good' | 'bad') => (
				<div className={localStyles.voteTypeWrapper}>
					{voteType === 'good' ? (
						<Tag color='success' icon={<LikeOutlined />}>
							{is_cn ? '好评' : 'Good'}
						</Tag>
					) : (
						<Tag color='error' icon={<DislikeOutlined />}>
							{is_cn ? '差评' : 'Bad'}
						</Tag>
					)}
				</div>
			)
		},
		{
			title: is_cn ? '用户' : 'User',
			dataIndex: 'user',
			key: 'user',
			width: '15%',
			render: (user: VoteRecord['user']) => (
				<div className={localStyles.userInfo}>
					<Avatar
						size={24}
						src={user.avatar}
						style={{ backgroundColor: user.avatar ? undefined : '#87d068' }}
					>
						{!user.avatar && user.name.charAt(0)}
					</Avatar>
					<span className={localStyles.userName}>{user.name}</span>
				</div>
			)
		},
		{
			title: is_cn ? '时间' : 'Time',
			dataIndex: 'timestamp',
			key: 'timestamp',
			width: '15%',
			render: (timestamp: string) => <span className={styles.timestamp}>{timestamp}</span>
		},
		{
			title: is_cn ? '原因' : 'Reason',
			dataIndex: 'reason',
			key: 'reason',
			width: '20%',
			render: (reason?: string) => (
				<div className={localStyles.reasonText} title={reason}>
					{reason || '-'}
				</div>
			)
		},
		{
			title: is_cn ? '操作' : 'Actions',
			key: 'actions',
			width: '8%',
			render: (_: any, record: VoteRecord) => (
				<Popconfirm
					title={is_cn ? '确定要删除这条投票记录吗？' : 'Are you sure to delete this vote record?'}
					onConfirm={() => handleDelete(record.id)}
					okText={is_cn ? '确定' : 'OK'}
					cancelText={is_cn ? '取消' : 'Cancel'}
				>
					<Button
						type='text'
						size='small'
						danger
						icon={<DeleteOutlined />}
						className={styles.deleteButton}
					/>
				</Popconfirm>
			)
		}
	]

	const goodVotes = data.filter((vote) => vote.voteType === 'good').length
	const badVotes = data.filter((vote) => vote.voteType === 'bad').length

	return (
		<div className={styles.tabContent}>
			<div className={styles.tabHeader}>
				<div className={styles.tabTitle}>
					<Icon name='material-thumb_up' size={16} />
					<span>{is_cn ? '投票记录' : 'Vote Records'}</span>
					<span className={styles.recordCount}>({data.length})</span>
				</div>
				<div className={localStyles.voteStats}>
					<Tag color='success' icon={<LikeOutlined />}>
						{goodVotes}
					</Tag>
					<Tag color='error' icon={<DislikeOutlined />}>
						{badVotes}
					</Tag>
				</div>
			</div>

			<div className={styles.tableContainer}>
				<Table
					columns={columns}
					dataSource={data}
					rowKey='id'
					loading={loading}
					pagination={{
						current: currentPage,
						pageSize: pageSize,
						total: data.length,
						onChange: setCurrentPage,
						showSizeChanger: false,
						showQuickJumper: true,
						showTotal: (total, range) =>
							is_cn
								? `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
								: `${range[0]}-${range[1]} of ${total} items`
					}}
					size='small'
				/>
			</div>
		</div>
	)
}

export default VoteList
