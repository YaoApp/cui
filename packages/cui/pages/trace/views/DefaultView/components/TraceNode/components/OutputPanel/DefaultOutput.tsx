import { memo, useState } from 'react'
import Icon from '@/widgets/Icon'
import JsonViewer from '../JsonViewer'
import FullscreenModal from '../FullscreenModal'
import styles from './DefaultOutput.less'

interface DefaultOutputProps {
	output?: Record<string, any> | string
	status: 'pending' | 'running' | 'success' | 'error'
	error?: string
	is_cn?: boolean
}

const DefaultOutput: React.FC<DefaultOutputProps> = ({ output, status, error, is_cn = false }) => {
	const [fullscreenOpen, setFullscreenOpen] = useState(false)

	const texts = {
		output: is_cn ? '输出' : 'Output',
		noOutput: is_cn ? '无输出' : 'No output',
		processing: is_cn ? '处理中...' : 'Processing...',
		fullscreen: is_cn ? '全屏' : 'Fullscreen'
	}

	// 格式化输出内容
	const formatOutput = () => {
		if (!output) return null
		if (typeof output === 'string') {
			// 尝试解析为 JSON
			try {
				const parsed = JSON.parse(output)
				return <JsonViewer data={parsed} />
			} catch {
				return <div className={styles.textContent}>{output}</div>
			}
		}
		// 对象类型，使用 JsonViewer
		return <JsonViewer data={output} />
	}

	const handleFullscreen = (e: React.MouseEvent) => {
		e.stopPropagation()
		setFullscreenOpen(true)
	}

	return (
		<>
			<div className={styles.defaultOutput}>
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
					) : output ? (
						formatOutput()
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

export default memo(DefaultOutput)
