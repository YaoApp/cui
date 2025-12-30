import { memo, useState } from 'react'
import Icon from '@/widgets/Icon'
import JsonViewer from '../JsonViewer'
import FullscreenModal from '../FullscreenModal'
import styles from './index.less'

interface InputPanelProps {
	input?: Record<string, any> | string
	is_cn?: boolean
}

const InputPanel: React.FC<InputPanelProps> = ({ input, is_cn = false }) => {
	const [fullscreenOpen, setFullscreenOpen] = useState(false)

	const texts = {
		input: is_cn ? '输入' : 'Input',
		noInput: is_cn ? '无输入' : 'No input',
		fullscreen: is_cn ? '全屏' : 'Fullscreen'
	}

	// 格式化输入内容
	const formatInput = () => {
		if (!input) return null
		if (typeof input === 'string') {
			// 尝试解析为 JSON
			try {
				const parsed = JSON.parse(input)
				return <JsonViewer data={parsed} />
			} catch {
				return <div className={styles.textContent}>{input}</div>
			}
		}
		// 对象类型，使用 JsonViewer
		return <JsonViewer data={input} />
	}

	const handleFullscreen = (e: React.MouseEvent) => {
		e.stopPropagation()
		setFullscreenOpen(true)
	}

	return (
		<>
			<div className={styles.inputPanel}>
				<div className={styles.panelHeader}>
					<Icon name='material-login' size={12} />
					<span>{texts.input}</span>
					{input && (
						<button className={styles.fullscreenBtn} onClick={handleFullscreen} title={texts.fullscreen}>
							<Icon name='material-fullscreen' size={12} />
						</button>
					)}
				</div>
				<div className={styles.panelBody}>
					{input ? formatInput() : <span className={styles.empty}>{texts.noInput}</span>}
				</div>
			</div>

			<FullscreenModal
				open={fullscreenOpen}
				onClose={() => setFullscreenOpen(false)}
				title={texts.input}
				data={input}
				type="input"
			/>
		</>
	)
}

export default memo(InputPanel)
