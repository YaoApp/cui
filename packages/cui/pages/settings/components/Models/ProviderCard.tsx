import { useState } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { ProviderConfig, ModelCapability } from '../../types'
import styles from './index.less'

const PRIMARY_CAPS: ModelCapability[] = ['vision', 'audio', 'reasoning', 'tool_calls']
const CAP_LABELS: Record<string, { cn: string; en: string }> = {
	vision: { cn: '看图', en: 'Vision' },
	audio: { cn: '语音', en: 'Audio' },
	reasoning: { cn: '思考', en: 'Reasoning' },
	tool_calls: { cn: '工具调用', en: 'Tools' },
	streaming: { cn: '逐字输出', en: 'Streaming' },
	json: { cn: '结构化输出', en: 'JSON' },
	embedding: { cn: '嵌入', en: 'Embedding' }
}

interface ProviderCardProps {
	provider: ProviderConfig
	onEdit: (provider: ProviderConfig) => void
	onDelete: (key: string) => void
}

export default function ProviderCard({ provider, onEdit, onDelete }: ProviderCardProps) {
	const is_cn = getLocale() === 'zh-CN'
	const [expanded, setExpanded] = useState(false)

	const enabledModels = provider.models.filter((m) => m.enabled)
	const allCaps = new Set<ModelCapability>()
	enabledModels.forEach((m) => m.capabilities.forEach((c) => allCaps.add(c)))

	const statusMap: Record<string, { text: string; cls: string } | null> = {
		connected: { text: is_cn ? '已连接' : 'Connected', cls: styles.status_connected },
		disconnected: { text: is_cn ? '连接失败' : 'Disconnected', cls: styles.status_disconnected },
		unconfigured: null
	}
	const st = statusMap[provider.status] || null

	const handleEdit = () => {
		onEdit(provider)
	}

	return (
		<div className={styles.providerCard}>
			<div className={styles.providerHeader} onClick={() => setExpanded(!expanded)}>
				<div className={styles.providerName}>
					<span className={styles.providerTitle}>{provider.name}</span>
					{!provider.is_custom && (
						<span className={styles.presetTag}>{is_cn ? '预设' : 'Preset'}</span>
					)}
					{st && <span className={`${styles.providerStatus} ${st.cls}`}>{st.text}</span>}
					<span className={styles.modelCount}>
						{enabledModels.length} {is_cn ? '个模型' : 'models'}
					</span>
				</div>
				<div className={styles.providerActions} onClick={(e) => e.stopPropagation()}>
					<button className={styles.editBtn} onClick={handleEdit} title={is_cn ? '编辑' : 'Edit'}>
						<Icon name='material-edit' size={15} />
					</button>
				<button className={styles.deleteBtn} onClick={() => onDelete(provider.key)} title={is_cn ? '删除' : 'Delete'}>
					<Icon name='material-delete_outline' size={15} />
				</button>
					<span className={`${styles.expandIcon} ${expanded ? styles.expandIconOpen : ''}`}>
						<Icon name='material-expand_more' size={18} />
					</span>
				</div>
			</div>

			{/* Capability overview */}
			<div className={styles.capOverview}>
				{PRIMARY_CAPS.filter((c) => allCaps.has(c)).map((cap) => (
					<span key={cap} className={`${styles.capTag} ${styles.capPrimary}`}>
						{is_cn ? CAP_LABELS[cap]?.cn : CAP_LABELS[cap]?.en}
					</span>
				))}
				{['streaming', 'json', 'embedding'].filter((c) => allCaps.has(c as ModelCapability)).map((cap) => (
					<span key={cap} className={`${styles.capTag} ${styles.capSecondary}`}>
						{is_cn ? CAP_LABELS[cap]?.cn : CAP_LABELS[cap]?.en}
					</span>
				))}
			</div>

			{/* Expanded: model list */}
			{expanded && (
				<div className={styles.modelListExpanded}>
					{enabledModels.map((m) => (
						<div key={m.id} className={styles.modelRow}>
							<span className={styles.modelName}>{m.name}</span>
							<span className={styles.modelCaps}>
								{m.capabilities.filter((c) => PRIMARY_CAPS.includes(c)).map((c) => (
									<span key={c} className={`${styles.capTagSmall} ${styles.capPrimary}`}>
										{is_cn ? CAP_LABELS[c]?.cn : CAP_LABELS[c]?.en}
									</span>
								))}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
