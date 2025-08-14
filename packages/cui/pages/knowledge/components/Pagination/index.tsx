import React from 'react'
import { Button } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface PaginationProps {
	current: number
	total: number
	pageSize: number
	onChange: (page: number) => void
	showInfo?: boolean
	maxVisiblePages?: number
	itemName?: string // 项目名称，如 "文档", "集合" 等
	showPrevNext?: boolean // 是否显示上一页下一页按钮
}

const Pagination: React.FC<PaginationProps> = ({
	current,
	total,
	pageSize,
	onChange,
	showInfo = true,
	maxVisiblePages = 5,
	itemName,
	showPrevNext = true
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const totalPages = Math.ceil(total / pageSize)

	if (totalPages <= 1) {
		return null
	}

	const handlePrevious = () => {
		if (current > 1) {
			onChange(current - 1)
		}
	}

	const handleNext = () => {
		if (current < totalPages) {
			onChange(current + 1)
		}
	}

	const renderPageNumbers = () => {
		const pages = []

		let startPage = Math.max(1, current - Math.floor(maxVisiblePages / 2))
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

		if (endPage - startPage < maxVisiblePages - 1) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1)
		}

		for (let i = startPage; i <= endPage; i++) {
			pages.push(
				<Button
					key={i}
					type={i === current ? 'primary' : 'text'}
					onClick={() => onChange(i)}
					className={styles.pageNumberButton}
					size='small'
				>
					{i}
				</Button>
			)
		}

		return pages
	}

	return (
		<div className={styles.paginationContainer}>
			{showPrevNext && (
				<Button
					type='text'
					disabled={current === 1}
					onClick={handlePrevious}
					className={styles.paginationButton}
					icon={<Icon name='material-chevron_left' size={16} />}
				>
					{is_cn ? '上一页' : 'Previous'}
				</Button>
			)}

			<div className={styles.pageNumbers}>{renderPageNumbers()}</div>

			{showPrevNext && (
				<Button
					type='text'
					disabled={current >= totalPages}
					onClick={handleNext}
					className={styles.paginationButton}
				>
					{is_cn ? '下一页' : 'Next'}
					<Icon name='material-chevron_right' size={16} />
				</Button>
			)}
		</div>
	)
}

export default Pagination
