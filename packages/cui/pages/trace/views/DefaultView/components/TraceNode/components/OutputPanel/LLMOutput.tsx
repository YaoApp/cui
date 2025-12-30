import { memo, useState } from 'react'
import Icon from '@/widgets/Icon'
import JsonViewer from '../JsonViewer'
import FullscreenModal from '../FullscreenModal'
import styles from './LLMOutput.less'

interface LLMOutputProps {
	output?: Record<string, any> | string
	status: 'pending' | 'running' | 'success' | 'error'
	error?: string
	is_cn?: boolean
}

const LLMOutput: React.FC<LLMOutputProps> = ({ output, status, error, is_cn = false }) => {
	const [fullscreenOpen, setFullscreenOpen] = useState(false)

	const texts = {
		output: is_cn ? 'LLM 输出' : 'LLM Output',
		noOutput: is_cn ? '无输出' : 'No output',
		generating: is_cn ? '生成中...' : 'Generating...',
		model: is_cn ? '模型' : 'Model',
		tokens: 'Tokens',
		fullscreen: is_cn ? '全屏' : 'Fullscreen'
	}

	// 解析 LLM 输出 - 主要是文本内容
	const parseOutput = () => {
		if (!output) return null
		if (typeof output === 'string') {
			return { content: output }
		}
		// 尝试提取常见的 LLM 输出字段
		return {
			content: output.content || output.text || output.message || output.response,
			model: output.model,
			tokens: output.tokens || output.usage,
			raw: output
		}
	}

	const data = parseOutput()

	const handleFullscreen = (e: React.MouseEvent) => {
		e.stopPropagation()
		setFullscreenOpen(true)
	}

	return (
		<>
			<div className={styles.llmOutput}>
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
							{data.content ? (
								<div className={styles.contentBlock}>
									<span>{data.content}</span>
									{status === 'running' && <span className={styles.cursor}>▌</span>}
								</div>
							) : (
								<div className={styles.rawOutput}>
									<JsonViewer data={output} />
								</div>
							)}
							{(data.model || data.tokens) && (
								<div className={styles.metaSection}>
									{data.model && (
										<div className={styles.metaItem}>
											<span className={styles.metaLabel}>{texts.model}</span>
											<span className={styles.metaValue}>{data.model}</span>
										</div>
									)}
									{data.tokens && (
										<div className={styles.metaItem}>
											<span className={styles.metaLabel}>{texts.tokens}</span>
											<span className={styles.metaValue}>
												{typeof data.tokens === 'object' 
													? JSON.stringify(data.tokens) 
													: data.tokens}
											</span>
										</div>
									)}
								</div>
							)}
						</>
					) : (
						<span className={styles.empty}>
							{status === 'running' ? (
								<>
									<span className={styles.cursor}>▌</span>
									<span>{texts.generating}</span>
								</>
							) : texts.noOutput}
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

export default memo(LLMOutput)
