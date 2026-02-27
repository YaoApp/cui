import React from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { InteractDoneData } from '@/openapi/agent/robot/types'
import styles from './index.less'

interface InteractResultCardProps {
	data: InteractDoneData
}

const statusConfig: Record<
	string,
	{ icon: string; colorClass: string; label: { cn: string; en: string }; hint?: { cn: string; en: string } }
> = {
	confirmed: {
		icon: 'material-check_circle',
		colorClass: 'resultConfirmed',
		label: { cn: '任务已确认', en: 'Task Confirmed' },
		hint: { cn: '正在启动执行...', en: 'Starting execution...' }
	},
	adjusted: {
		icon: 'material-tune',
		colorClass: 'resultAdjusted',
		label: { cn: '方案已调整', en: 'Plan Adjusted' },
		hint: { cn: '执行计划已更新', en: 'Execution plan updated' }
	},
	task_added: {
		icon: 'material-add_task',
		colorClass: 'resultAdjusted',
		label: { cn: '任务已添加', en: 'Task Added' },
		hint: { cn: '新任务已注入执行队列', en: 'New task injected into queue' }
	},
	task_skipped: {
		icon: 'material-skip_next',
		colorClass: 'resultAdjusted',
		label: { cn: '任务已跳过', en: 'Task Skipped' },
		hint: { cn: '当前等待的任务已跳过', en: 'Waiting task has been skipped' }
	},
	resumed: {
		icon: 'material-play_circle',
		colorClass: 'resultConfirmed',
		label: { cn: '执行已恢复', en: 'Execution Resumed' }
	},
	cancelled: {
		icon: 'material-cancel',
		colorClass: 'resultError',
		label: { cn: '执行已取消', en: 'Execution Cancelled' }
	},
	error: {
		icon: 'material-error',
		colorClass: 'resultError',
		label: { cn: '操作失败', en: 'Operation Failed' }
	}
}

const InteractResultCard: React.FC<InteractResultCardProps> = ({ data }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const status = data.status || 'error'

	if (status === 'waiting_for_more') return null

	const config = statusConfig[status] || statusConfig.error

	return (
		<div className={`${styles.resultCard} ${styles[config.colorClass] || ''}`}>
			<div className={styles.resultIcon}>
				<Icon name={config.icon} size={18} />
			</div>
			<div className={styles.resultBody}>
				<div className={styles.resultLabel}>{is_cn ? config.label.cn : config.label.en}</div>
				{data.error ? (
					<div className={styles.resultHint}>{data.error}</div>
				) : data.message ? (
					<div className={styles.resultHint}>{data.message}</div>
				) : config.hint ? (
					<div className={styles.resultHint}>{is_cn ? config.hint.cn : config.hint.en}</div>
				) : null}
			</div>
		</div>
	)
}

export default InteractResultCard
