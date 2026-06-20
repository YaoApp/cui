import { getLocale } from '@umijs/max'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

const ComputerSection = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'
	const computer = task.computer
	const isHost = computer?.mode === 'host'

	const handleRebuild = () => {
		if (isHost) return
		window.$app?.Event?.emit('app/toast', {
			type: 'info',
			message: is_cn ? '删除重建 - 即将上线' : 'Rebuild - Coming soon'
		})
	}

	return (
		<div className={viewStyles.sectionContent}>
			<div className={viewStyles.card}>
				<div className={viewStyles.sectionTitle}>{is_cn ? '电脑' : 'Computer'}</div>

				{computer ? (
					<>
						<div className={viewStyles.kvTable}>
							<div className={viewStyles.kvRow}>
								<div className={viewStyles.kvLabel}>ID</div>
								<div className={viewStyles.kvValue}>{computer.id}</div>
							</div>
							<div className={viewStyles.kvRow}>
								<div className={viewStyles.kvLabel}>{is_cn ? '状态' : 'Status'}</div>
								<div className={viewStyles.kvValue}>
									<span className={viewStyles.statusBadge}>
										<Icon
											name={computer.status === 'running' ? 'material-check_circle' : 'material-cancel'}
											size={14}
										/>
										{computer.status === 'running'
											? (is_cn ? '运行中' : 'Running')
											: (is_cn ? '已停止' : 'Stopped')}
									</span>
								</div>
							</div>
							<div className={viewStyles.kvRow}>
								<div className={viewStyles.kvLabel}>{is_cn ? '模式' : 'Mode'}</div>
								<div className={viewStyles.kvValue}>
									<span className={viewStyles.tag}>{computer.mode}</span>
								</div>
							</div>
						</div>

						<div className={viewStyles.actionBar}>
							<Button
								size='small'
								danger
								disabled={isHost}
								icon={<Icon name='material-delete_outline' size={14} />}
								onClick={handleRebuild}
								title={isHost ? (is_cn ? 'Host 模式不可删除' : 'Cannot delete in host mode') : undefined}
							>
								{is_cn ? '删除重建' : 'Rebuild'}
							</Button>
						</div>

						{isHost && (
							<div className={viewStyles.noticeCard}>
								<Icon name='material-info' size={14} className={viewStyles.noticeIcon} />
								<span>
									{is_cn
										? 'Host 模式下电脑不可删除，因为没有独立沙箱。'
										: 'Host mode computers cannot be deleted as they have no isolated sandbox.'}
								</span>
							</div>
						)}
					</>
				) : (
					<div className={viewStyles.emptyState}>
						<Icon name='material-computer' size={32} />
						<span style={{ marginTop: 8 }}>{is_cn ? '未分配电脑' : 'No computer assigned'}</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default ComputerSection
