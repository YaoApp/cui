import React, { useState, useEffect } from 'react'
import { Button, Input } from 'antd'
import clsx from 'clsx'
import type { IInputAreaProps } from '../../types'
import type { ChatMessage } from '../../../openapi'
import styles from './index.less'

const { TextArea } = Input

const InputArea = (props: IInputAreaProps) => {
	const { mode, onSend, loading, disabled, className, style } = props
	const [inputValue, setInputValue] = useState('')
	const [isAnimating, setIsAnimating] = useState(false)

	// Reset animating state after transition
	useEffect(() => {
		if (mode === 'normal' && isAnimating) {
			const timer = setTimeout(() => setIsAnimating(false), 350) // Slightly longer than CSS transition
			return () => clearTimeout(timer)
		}
	}, [mode, isAnimating])

	const handleSend = () => {
		if (!inputValue.trim()) return

		const message: ChatMessage = {
			role: 'user',
			content: inputValue
		}

		// Enable animation only if sending from placeholder mode
		if (mode === 'placeholder') {
			setIsAnimating(true)
		}

		onSend(message).then(() => {
			setInputValue('')
		})
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	return (
		<div
			className={clsx(styles.container, styles[mode], isAnimating && styles.animating, className)}
			style={style}
		>
			<div className={styles.content}>
				{/* Placeholder Mode Content */}
				{mode === 'placeholder' && (
					<div className={styles.placeholderHint}>
						<h3>How can I help you today?</h3>
					</div>
				)}

				{/* Input Box */}
				<div className={styles.inputWrapper}>
					<TextArea
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder='Type a message...'
						autoSize={{ minRows: 1, maxRows: 6 }}
						disabled={disabled || loading}
						className={styles.textarea}
					/>
					<Button
						type='primary'
						onClick={handleSend}
						loading={loading}
						disabled={!inputValue.trim() || disabled}
						className={styles.sendBtn}
					>
						Send
					</Button>
				</div>
			</div>
		</div>
	)
}

export default InputArea
