import { useState } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { ProviderConfig, ModelCapability, ModelInfo } from '../../types'
import styles from './index.less'

const PRIMARY_CAPS: ModelCapability[] = ['vision', 'tool_calls', 'reasoning', 'audio']
const CAP_LABELS: Record<string, { cn: string; en: string }> = {
	vision: { cn: '视觉', en: 'Vision' },
	tool_calls: { cn: '工具调用', en: 'Tools' },
	reasoning: { cn: '深度思考', en: 'Reasoning' },
	streaming: { cn: '流式输出', en: 'Streaming' },
	audio: { cn: '语音', en: 'Audio' },
	json: { cn: '结构化输出', en: 'JSON' },
	embedding: { cn: '嵌入', en: 'Embedding' }
}

function formatTokens(n: number): string {
	if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`
	return `${Math.round(n / 1000)}K`
}

function tokenDesc(m: ModelInfo): string {
	const parts: string[] = []
	if (m.max_input_tokens) parts.push(formatTokens(m.max_input_tokens))
	if (m.max_output_tokens) parts.push(formatTokens(m.max_output_tokens))
	return parts.length === 2 ? `${parts[0]} / ${parts[1]}` : parts.join('')
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
					{enabledModels.map((m) => {
						const tokens = tokenDesc(m)
						return (
							<div key={m.id} className={styles.modelRow}>
								<span className={styles.modelName}>
									{m.name}
									{tokens && <span className={styles.tokenSpec}>{tokens}</span>}
								</span>
								<span className={styles.modelCaps}>
								{PRIMARY_CAPS.filter((c) => m.capabilities.includes(c)).map((c) => (
									<span key={c} className={`${styles.capTagSmall} ${styles.capPrimary}`}>
										{is_cn ? CAP_LABELS[c]?.cn : CAP_LABELS[c]?.en}
									</span>
								))}
							</span>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
