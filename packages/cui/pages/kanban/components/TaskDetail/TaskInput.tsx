import { useState, useRef, useCallback } from 'react'
import { PaperPlaneTilt } from 'phosphor-react'
import styles from './TaskInput.less'

interface TaskInputProps {
	disabled?: boolean
	loading?: boolean
	placeholder?: string
	onSend: (content: string) => void
}

const TaskInput = ({ disabled, loading, placeholder, onSend }: TaskInputProps) => {
	const [value, setValue] = useState('')
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const handleSend = useCallback(() => {
		const trimmed = value.trim()
		if (!trimmed || disabled || loading) return
		onSend(trimmed)
		setValue('')
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
		}
	}, [value, disabled, loading, onSend])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault()
				handleSend()
			}
		},
		[handleSend]
	)

	const handleInput = useCallback(() => {
		const el = textareaRef.current
		if (!el) return
		el.style.height = 'auto'
		el.style.height = `${Math.min(el.scrollHeight, 120)}px`
	}, [])

	const canSend = value.trim().length > 0 && !disabled && !loading

	return (
		<div className={styles.inputArea}>
			<div className={styles.textareaWrap}>
				<textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onInput={handleInput}
					placeholder={placeholder}
					disabled={disabled}
					rows={1}
				/>
			</div>
			<button className={styles.sendBtn} onClick={handleSend} disabled={!canSend}>
				<PaperPlaneTilt size={16} weight='fill' />
			</button>
		</div>
	)
}

export default window.$app.memo(TaskInput)
