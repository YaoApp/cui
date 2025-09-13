import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { Button, PaginatedTable } from '@/components/ui'
import { DateRange, DateRangeValue } from '@/components/ui/inputs'
import { TableColumn, TableAction } from '@/components/ui/PaginatedTable/types'
import Icon from '@/widgets/Icon'
import { mockApi, AuditLog, AuditLogResponse } from '../../mockData'
import styles from './index.less'

const AuditLogs = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
	const [total, setTotal] = useState(0)
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(20)
	const [dateRange, setDateRange] = useState<DateRangeValue>({
		start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		end: new Date().toISOString().split('T')[0]
	})

	// 加载审计日志
	useEffect(() => {
		loadAuditLogs()
	}, [currentPage, pageSize])

	// 处理分页变化
	const handlePageChange = (page: number, size: number) => {
		setCurrentPage(page)
		setPageSize(size)
	}

	// 加载审计日志数据
	const loadAuditLogs = async (page = currentPage, size = pageSize) => {
		try {
			setLoading(true)
			const response = await mockApi.getAuditLogs(page, size)
			setAuditLogs(response.records)
			setTotal(response.total)
		} catch (error) {
			console.error('Failed to load audit logs:', error)
		} finally {
			setLoading(false)
		}
	}

	// 处理日期范围变化
	const handleDateRangeChange = (newRange: DateRangeValue) => {
		setDateRange(newRange)
		// 重新加载审计日志
		loadAuditLogs(1, pageSize)
		setCurrentPage(1)
	}

	// 获取严重性显示文本
	const getSeverityText = (severity: AuditLog['severity']) => {
		if (is_cn) {
			switch (severity) {
				case 'critical':
					return '严重'
				case 'high':
					return '高'
				case 'medium':
					return '中'
				case 'low':
				default:
					return '低'
			}
		} else {
			return severity.charAt(0).toUpperCase() + severity.slice(1)
		}
	}

	// 获取分类显示文本
	const getCategoryText = (category?: AuditLog['category']) => {
		if (!category) return '-'
		if (is_cn) {
			switch (category) {
				case 'authentication':
					return '认证'
				case 'authorization':
					return '授权'
				case 'data':
					return '数据'
				case 'system':
					return '系统'
				default:
					return category
			}
		} else {
			return category.charAt(0).toUpperCase() + category.slice(1)
		}
	}

	// 表格列定义
	const columns: TableColumn<AuditLog>[] = [
		{
			key: 'created_at',
			title: is_cn ? '时间' : 'Time',
			dataIndex: 'created_at',
			width: 140,
			render: (date: string) => {
				return new Date(date).toLocaleDateString(locale, {
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})
			}
		},
		{
			key: 'user_name',
			title: is_cn ? '成员' : 'Member',
			dataIndex: 'user_name',
			width: 120,
			render: (name: string) => <span className={styles.userName}>{name || '-'}</span>
		},
		{
			key: 'operation',
			title: is_cn ? '操作' : 'Operation',
			dataIndex: 'operation',
			width: 100,
			render: (operation: string) => <span className={styles.operation}>{operation}</span>
		},
		{
			key: 'category',
			title: is_cn ? '分类' : 'Category',
			dataIndex: 'category',
			width: 120,
			render: (category?: AuditLog['category']) => (
				<span className={styles.category}>{getCategoryText(category)}</span>
			)
		},
		{
			key: 'severity',
			title: is_cn ? '级别' : 'Level',
			dataIndex: 'severity',
			width: 100,
			render: (severity: AuditLog['severity']) => (
				<span
					className={`${styles.levelTag} ${
						styles[`level${severity.charAt(0).toUpperCase() + severity.slice(1)}`]
					}`}
				>
					{getSeverityText(severity)}
				</span>
			)
		},
		{
			key: 'target_resource',
			title: is_cn ? '目标资源' : 'Resource',
			dataIndex: 'target_resource',
			width: 180,
			render: (resource?: string) => <span className={styles.resource}>{resource || '-'}</span>
		}
	]

	// 表格操作
	const actions: TableAction<AuditLog>[] = [
		{
			key: 'view',
			label: is_cn ? '查看详情' : 'View Details',
			icon: <Icon name='material-visibility' size={14} />,
			onClick: (record) => {
				console.log('View audit log details:', record)
			}
		}
	]

	if (loading && auditLogs.length === 0) {
		return (
			<div className={styles.auditLogs}>
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} className={styles.loadingIcon} />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.auditLogs}>
			{/* Header */}
			<div className={styles.header}>
				<div className={styles.headerContent}>
					<h2>{is_cn ? '审计日志' : 'Audit Logs'}</h2>
					<p>
						{is_cn
							? '查看系统操作的审计记录和安全日志'
							: 'View system operation audit records and security logs'}
					</p>
				</div>
				<div className={styles.headerActions}>
					<DateRange
						value={dateRange}
						onChange={handleDateRangeChange}
						size='small'
						presets={[
							{
								label: is_cn ? '最近7天' : 'Last 7 days',
								value: {
									start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
										.toISOString()
										.split('T')[0],
									end: new Date().toISOString().split('T')[0]
								}
							},
							{
								label: is_cn ? '最近30天' : 'Last 30 days',
								value: {
									start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
										.toISOString()
										.split('T')[0],
									end: new Date().toISOString().split('T')[0]
								}
							}
						]}
					/>
					<Button
						type='default'
						icon={<Icon name='material-download' size={14} />}
						onClick={() => console.log('Export audit logs')}
					>
						{is_cn ? '导出日志' : 'Export Logs'}
					</Button>
				</div>
			</div>

			{/* Audit Logs Table */}
			<div className={styles.logsSection}>
				<PaginatedTable
					data={auditLogs}
					columns={columns}
					actions={actions}
					loading={loading}
					total={total}
					current={currentPage}
					pageSize={pageSize}
					onPageChange={handlePageChange}
					size='small'
					showSizeChanger={true}
					showQuickJumper={true}
					showTotal={true}
					emptyText={
						<div className={styles.emptyState}>
							<Icon name='material-history' size={48} />
							<p>{is_cn ? '暂无审计日志' : 'No audit logs found'}</p>
						</div>
					}
					rowKey='id'
				/>
			</div>
		</div>
	)
}

export default AuditLogs
