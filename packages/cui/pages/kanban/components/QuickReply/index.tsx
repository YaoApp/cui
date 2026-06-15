import { useState, useCallback } from 'react'
import { PaperPlaneTilt } from 'phosphor-react'
import styles from './index.less'

interface QuickReplyProps {
	placeholder?: string
	onSend: (content: string) => void
}

const QuickReply = ({ placeholder, onSend }: QuickReplyProps) => {
	const [value, setValue] = useState('')

	const handleSend = useCallback(() => {
		const trimmed = value.trim()
		if (!trimmed) return
		onSend(trimmed)
		setValue('')
	}, [value, onSend])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault()
				e.stopPropagation()
				handleSend()
			}
		},
		[handleSend]
	)

	return (
		<div className={styles.quickReply} onClick={(e) => e.stopPropagation()}>
			<input
				type='text'
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
			/>
			<button className={styles.sendBtn} onClick={handleSend} disabled={!value.trim()}>
				<PaperPlaneTilt size={12} weight='fill' />
			</button>
		</div>
	)
}

export default window.$app.memo(QuickReply)
