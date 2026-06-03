import React, { useState } from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import type { TodoMessage } from '../../../openapi'
import { Icon } from '@/widgets'
import styles from './index.less'

interface ITodoViewProps {
	message: TodoMessage
	loading?: boolean
}

interface TodoItem {
	id: string
	content: string
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

const TodoView = ({ message, loading }: ITodoViewProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const raw = message.props || ({} as any)
	const props = raw.execute && typeof raw.execute === 'object' ? { ...raw.execute } : raw
	const status = props.status || 'running'
	const isStreaming = !!loading && status === 'running'

	const todos = extractTodos(props)
	const completedCount = todos.filter((t) => t.status === 'completed').length
	const label = is_cn
		? `Todo (${completedCount}/${todos.length})`
		: `Todo (${completedCount}/${todos.length})`

	const hasDetail = todos.length > 0 && !isStreaming
	const [showDetail, setShowDetail] = useState(true)

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<span className={clsx(styles.icon, isStreaming ? styles.iconMuted : styles.iconActive)}>
					<Icon name='material-checklist' size={14} />
				</span>
				<span className={isStreaming ? styles.shimmerText : styles.staticText}>{label}</span>
				{hasDetail && (
					<span
						className={clsx(styles.toggle, showDetail && styles.toggleExpanded)}
						onClick={() => setShowDetail(!showDetail)}
					>
						<Icon name='icon-chevron-right' size={11} />
					</span>
				)}
			</div>
			{showDetail && hasDetail && (
				<div className={styles.detail}>
					{todos.map((todo) => (
						<div key={todo.id} className={styles.todoItem}>
							<span className={styles.checkbox}>
								<Icon
									name={
										todo.status === 'completed'
											? 'material-check_box'
											: 'material-check_box_outline_blank'
									}
									size={14}
								/>
							</span>
							<span
								className={clsx(
									styles.todoText,
									todo.status === 'completed' && styles.todoCompleted
								)}
							>
								{todo.content}
							</span>
							{todo.status === 'in_progress' && (
								<span className={styles.statusBadge}>
									{is_cn ? '进行中' : 'In Progress'}
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}

function extractTodos(props: any): TodoItem[] {
	const input = props.input || props.output
	if (!input) return []

	let todos = input.todos || input
	if (!Array.isArray(todos)) return []

	return todos.map((t: any, i: number) => ({
		id: t.id || String(i),
		content: t.content || t.text || t.title || '',
		status: t.status || 'pending'
	}))
}

export default TodoView
