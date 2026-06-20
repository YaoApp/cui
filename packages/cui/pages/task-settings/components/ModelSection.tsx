import { getLocale } from '@umijs/max'
import { Button } from '@/components/ui'
import Icon from '@/widgets/Icon'
import type { KanbanTask } from '../../kanban/types'
import viewStyles from '@/pages/assistants/detail/components/View/index.less'

const ModelSection = ({ task }: { task: KanbanTask }) => {
	const is_cn = getLocale() === 'zh-CN'

	const handleSwitch = () => {
		window.$app?.Event?.emit('app/toast', {
			type: 'info',
			message: is_cn ? '切换模型 - 即将上线' : 'Switch model - Coming soon'
		})
	}

	return (
		<div className={viewStyles.sectionContent}>
			<div className={viewStyles.card}>
				<div className={viewStyles.sectionTitle}>
					{is_cn ? 'AI 模型' : 'AI Model'}
				</div>

				<div className={viewStyles.kvTable}>
					<div className={viewStyles.kvRow}>
						<div className={viewStyles.kvLabel}>{is_cn ? '模型提供商' : 'Provider'}</div>
						<div className={viewStyles.kvValue}>
							{task.connector_name || (is_cn ? '默认连接器' : 'Default Provider')}
						</div>
					</div>
				</div>

				<div className={viewStyles.actionBar}>
					<Button size='small' icon={<Icon name='material-swap_horiz' size={14} />} onClick={handleSwitch}>
						{is_cn ? '切换' : 'Switch'}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default ModelSection
