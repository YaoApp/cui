import React, { useState, useEffect } from 'react'
import { Table, Button, Popconfirm, message, Tag } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from '../detail.less'
import localStyles from './index.less'

interface HitRecord {
	id: string
	query: string
	rank: number
	timestamp: string
	score: number
	source: string
}

interface HitListProps {
	chunkId: string
}

const HitList: React.FC<HitListProps> = ({ chunkId }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [data, setData] = useState<HitRecord[]>([])
	const [loading, setLoading] = useState(true)
	const [currentPage, setCurrentPage] = useState(1)
	const pageSize = 10

	useEffect(() => {
		loadHitData()
	}, [chunkId])

	const loadHitData = async () => {
		try {
			setLoading(true)
			// 模拟加载时间
			await new Promise((resolve) => setTimeout(resolve, 500))

			// 模拟命中数据
			const mockData: HitRecord[] = [
				{
					id: 'hit_1',
					query: '系统架构设计',
					rank: 1,
					timestamp: '2024-01-15 14:32:15',
					score: 0.95,
					source: 'user_search'
				},
				{
					id: 'hit_2',
					query: '数据处理流程',
					rank: 3,
					timestamp: '2024-01-15 13:28:42',
					score: 0.87,
					source: 'auto_hit'
				},
				{
					id: 'hit_3',
					query: '用户界面设计原则',
					rank: 2,
					timestamp: '2024-01-15 12:15:30',
					score: 0.91,
					source: 'user_search'
				},
				{
					id: 'hit_4',
					query: '安全性要求',
					rank: 5,
					timestamp: '2024-01-15 11:45:18',
					score: 0.78,
					source: 'related_query'
				},
				{
					id: 'hit_5',
					query: 'API接口文档',
					rank: 1,
					timestamp: '2024-01-15 10:30:25',
					score: 0.96,
					source: 'user_search'
				},
				{
					id: 'hit_6',
					query: '系统部署方案',
					rank: 4,
					timestamp: '2024-01-15 09:22:10',
					score: 0.82,
					source: 'auto_hit'
				},
				{
					id: 'hit_7',
					query: '数据库优化策略',
					rank: 2,
					timestamp: '2024-01-14 16:45:33',
					score: 0.89,
					source: 'user_search'
				},
				{
					id: 'hit_8',
					query: '性能监控',
					rank: 6,
					timestamp: '2024-01-14 15:12:45',
					score: 0.75,
					source: 'related_query'
				}
			]

			setData(mockData)
		} catch (error) {
			message.error(is_cn ? '加载命中数据失败' : 'Failed to load hit data')
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
			case 'user_search':
				return 'blue'
			case 'auto_hit':
				return 'green'
			case 'related_query':
				return 'orange'
			default:
				return 'default'
		}
	}

	const getSourceLabel = (source: string) => {
		switch (source) {
			case 'user_search':
				return is_cn ? '用户搜索' : 'User Search'
			case 'auto_hit':
				return is_cn ? '自动命中' : 'Auto Hit'
			case 'related_query':
				return is_cn ? '相关查询' : 'Related Query'
			default:
				return source
		}
	}

	const columns = [
		{
			title: is_cn ? '查询内容' : 'Query',
			dataIndex: 'query',
			key: 'query',
			width: '30%',
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
			title: is_cn ? '得分' : 'Score',
			dataIndex: 'score',
			key: 'score',
			width: '10%',
			render: (score: number) => <span className={styles.scoreValue}>{(score * 100).toFixed(1)}%</span>
		},
		{
			title: is_cn ? '来源' : 'Source',
			dataIndex: 'source',
			key: 'source',
			width: '12%',
			render: (source: string) => <Tag color={getSourceColor(source)}>{getSourceLabel(source)}</Tag>
		},
		{
			title: is_cn ? '时间' : 'Time',
			dataIndex: 'timestamp',
			key: 'timestamp',
			width: '20%',
			render: (timestamp: string) => <span className={styles.timestamp}>{timestamp}</span>
		},
		{
			title: is_cn ? '操作' : 'Actions',
			key: 'actions',
			width: '10%',
			render: (_: any, record: HitRecord) => (
				<Popconfirm
					title={is_cn ? '确定要删除这条命中记录吗？' : 'Are you sure to delete this hit record?'}
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

	return (
		<div className={styles.tabContent}>
			<div className={styles.tabHeader}>
				<div className={styles.tabTitle}>
					<Icon name='material-history' size={16} />
					<span>{is_cn ? '命中记录' : 'Hit Records'}</span>
					<span className={styles.recordCount}>({data.length})</span>
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

export default HitList
