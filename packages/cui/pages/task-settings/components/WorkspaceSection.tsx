import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

const WorkspaceSection = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'
	const ws = task.workspace

	return (
		<div className={viewStyles.sectionContent}>
			<div className={viewStyles.card}>
				<div className={viewStyles.sectionTitle}>
					{is_cn ? '工作区' : 'Workspace'}
				</div>

				{ws ? (
					<div className={viewStyles.kvTable}>
						<div className={viewStyles.kvRow}>
							<div className={viewStyles.kvLabel}>{is_cn ? '名称' : 'Name'}</div>
							<div className={viewStyles.kvValue}>{ws.name}</div>
						</div>
						{ws.path && (
							<div className={viewStyles.kvRow}>
								<div className={viewStyles.kvLabel}>{is_cn ? '路径' : 'Path'}</div>
								<div className={viewStyles.kvValue}>{ws.path}</div>
							</div>
						)}
						{ws.node_name && (
							<div className={viewStyles.kvRow}>
								<div className={viewStyles.kvLabel}>{is_cn ? '节点' : 'Node'}</div>
								<div className={viewStyles.kvValue}>{ws.node_name}</div>
							</div>
						)}
						<div className={viewStyles.kvRow}>
							<div className={viewStyles.kvLabel}>{is_cn ? '状态' : 'Status'}</div>
							<div className={viewStyles.kvValue}>
								<span className={viewStyles.statusBadge}>
									<Icon
										name={ws.status === 'online' ? 'material-check_circle' : 'material-cancel'}
										size={14}
									/>
									{ws.status === 'online'
										? (is_cn ? '在线' : 'Online')
										: (is_cn ? '离线' : 'Offline')}
								</span>
							</div>
						</div>
					</div>
				) : (
					<div className={viewStyles.emptyState}>
						<Icon name='material-workspaces' size={32} />
						<span style={{ marginTop: 8 }}>{is_cn ? '未绑定工作区' : 'No workspace bound'}</span>
					</div>
				)}

				<div className={viewStyles.noticeCard}>
					<Icon name='material-info' size={14} className={viewStyles.noticeIcon} />
					<span>
						{is_cn
							? '工作区在创建任务时绑定，不可修改。'
							: 'Workspace is bound at task creation and cannot be changed.'}
					</span>
				</div>
			</div>
		</div>
	)
}

export default WorkspaceSection
