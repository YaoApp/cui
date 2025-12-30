import { memo, useState } from 'react'
import Icon from '@/widgets/Icon'
import JsonViewer from '../JsonViewer'
import FullscreenModal from '../FullscreenModal'
import styles from './AgentOutput.less'

interface AgentOutputProps {
	output?: Record<string, any> | string
	status: 'pending' | 'running' | 'success' | 'error'
	error?: string
	is_cn?: boolean
}

const AgentOutput: React.FC<AgentOutputProps> = ({ output, status, error, is_cn = false }) => {
	const [fullscreenOpen, setFullscreenOpen] = useState(false)

	const texts = {
		output: is_cn ? 'Agent 输出' : 'Agent Output',
		noOutput: is_cn ? '无输出' : 'No output',
		processing: is_cn ? '处理中...' : 'Processing...',
		actions: is_cn ? '动作' : 'Actions',
		fullscreen: is_cn ? '全屏' : 'Fullscreen'
	}

	// 解析 Agent 输出
	const parseOutput = () => {
		if (!output) return null
		if (typeof output === 'string') {
			return { text: output }
		}
		return output
	}

	const data = parseOutput()

	const handleFullscreen = (e: React.MouseEvent) => {
		e.stopPropagation()
		setFullscreenOpen(true)
	}

	return (
		<>
			<div className={styles.agentOutput}>
				<div className={styles.panelHeader}>
					<Icon name='material-logout' size={12} />
					<span className={styles.headerTitle}>{texts.output}</span>
					{status === 'running' && <span className={styles.streaming}>●</span>}
					{output && (
						<button className={styles.fullscreenBtn} onClick={handleFullscreen} title={texts.fullscreen}>
							<Icon name='material-fullscreen' size={12} />
						</button>
					)}
				</div>
				<div className={styles.panelBody}>
					{error ? (
						<div className={styles.errorContent}>
							<Icon name='material-error' size={12} />
							<span>{error}</span>
						</div>
					) : data ? (
						<>
							{data.text && (
								<div className={styles.textBlock}>{data.text}</div>
							)}
							{data.actions && Array.isArray(data.actions) && data.actions.length > 0 && (
								<div className={styles.actionsBlock}>
									<div className={styles.blockLabel}>{texts.actions}</div>
									{data.actions.map((action: any, idx: number) => (
										<div key={idx} className={styles.actionItem}>
											<Icon name='material-play_arrow' size={10} />
											<span>{action.name || action.type || JSON.stringify(action)}</span>
										</div>
									))}
								</div>
							)}
							{!data.text && !data.actions && (
								<div className={styles.rawOutput}>
									<JsonViewer data={output} />
								</div>
							)}
						</>
					) : (
						<span className={styles.empty}>
							{status === 'running' ? texts.processing : texts.noOutput}
						</span>
					)}
				</div>
			</div>

			<FullscreenModal
				open={fullscreenOpen}
				onClose={() => setFullscreenOpen(false)}
				title={texts.output}
				data={output}
				type="output"
			/>
		</>
	)
}

export default memo(AgentOutput)
