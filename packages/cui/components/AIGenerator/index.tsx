import React, { useState, useRef, useCallback, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { parse as parsePartialJson } from 'partial-json'
import { PaperPlaneTilt } from 'phosphor-react'
import { Chat, IsEventMessage, IsStreamEndEvent } from '@/openapi'
import Icon from '@/widgets/Icon'
import type { AIGeneratorProps, AIGeneratorState } from './types'
import styles from './index.less'

const THROTTLE_MS = 150
const ALLOW_FLAGS = 0b11111 // STR | OBJ | ARR | NUM | BOOL

function stripCodeFence(text: string): string {
	let s = text.trim()
	// Opening fence: ```json or ``` (with optional language tag)
	if (s.startsWith('```')) {
		const firstNewline = s.indexOf('\n')
		s = firstNewline !== -1 ? s.slice(firstNewline + 1) : ''
	}
	// Closing fence (may be absent during streaming)
	if (s.endsWith('```')) {
		s = s.slice(0, -3)
	}
	return s.trim()
}

function extractJson(text: string): string {
	const stripped = stripCodeFence(text)
	if (stripped.startsWith('{') || stripped.startsWith('[')) return stripped
	// Fallback: find first { and last } in raw text
	const first = text.indexOf('{')
	const last = text.lastIndexOf('}')
	if (first !== -1 && last > first) return text.slice(first, last + 1)
	// Streaming: might only have opening brace so far
	if (first !== -1) return text.slice(first)
	return text
}

function tryParseJson(text: string): Record<string, any> | undefined {
	try {
		const json = extractJson(text)
		const result = parsePartialJson(json, ALLOW_FLAGS)
		if (result && typeof result === 'object' && !Array.isArray(result)) return result
		return undefined
	} catch {
		return undefined
	}
}

function finalParseJson(text: string): Record<string, any> | undefined {
	try {
		return JSON.parse(extractJson(text))
	} catch {
		return tryParseJson(text)
	}
}

function estimateTokens(text: string): number {
	const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length
	const nonCjk = text.length - cjkChars
	const words = nonCjk > 0 ? text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, '').split(/\s+/).filter(Boolean).length : 0
	return Math.round(cjkChars * 1.5 + words * 1.3)
}

const AIGenerator: React.FC<AIGeneratorProps> = ({
	assistantId,
	context,
	outputFormat = 'text',
	onStart,
	onStream,
	onComplete,
	onCancel,
	onError,
	placeholder,
	label,
	buttonClassName,
	buttonStyle,
	size = 'default',
	children
}) => {
	const is_cn = getLocale() === 'zh-CN'

	const [state, setState] = useState<AIGeneratorState>('idle')
	const [userInput, setUserInput] = useState('')
	const [tokenCount, setTokenCount] = useState(0)

	const fullTextRef = useRef('')
	const abortRef = useRef<(() => void) | null>(null)
	const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const handleOpenInput = useCallback(() => {
		if (state !== 'idle') return
		setState('input')
		setUserInput('')
		setTimeout(() => textareaRef.current?.focus(), 50)
	}, [state])

	const handleCloseInput = useCallback(() => {
		setState('idle')
		setUserInput('')
	}, [])

	const handleCancel = useCallback(() => {
		abortRef.current?.()
		abortRef.current = null
		if (throttleTimerRef.current) {
			clearTimeout(throttleTimerRef.current)
			throttleTimerRef.current = null
		}
		const text = fullTextRef.current
		const parsed = outputFormat === 'json' ? tryParseJson(text) : undefined
		onCancel?.(text, parsed)
		setState('idle')
		setTokenCount(0)
	}, [outputFormat, onCancel])

	const handleSubmit = useCallback(async () => {
		const input = userInput.trim()
		if (!input) return

		if (!window.$app?.openapi) {
			onError?.(new Error(is_cn ? 'API 未初始化' : 'API not initialized'))
			return
		}

		if (!assistantId) {
			onError?.(new Error(is_cn ? '未配置助手 ID' : 'Assistant ID not configured'))
			return
		}

		setState('generating')
		fullTextRef.current = ''
		setTokenCount(0)
		onStart?.(input)

		try {
			const chatClient = new Chat(window.$app.openapi)

			const contextMessages = typeof context === 'function' ? context() : context || []
			const messages = [
				...contextMessages,
				{ role: 'user' as const, content: input }
			]

			const locale = getLocale()

			const abort = chatClient.StreamCompletion(
				{
					assistant_id: assistantId,
					messages,
					locale,
					skip: { history: true, trace: true }
				},
				(chunk) => {
					if (IsEventMessage(chunk) && IsStreamEndEvent(chunk)) {
						if (throttleTimerRef.current) {
							clearTimeout(throttleTimerRef.current)
							throttleTimerRef.current = null
						}
						const text = fullTextRef.current
						const parsed = outputFormat === 'json' ? finalParseJson(text) : undefined
						onComplete(text, parsed)
						setState('idle')
						setTokenCount(0)
						abortRef.current = null
						return
					}

					if (chunk.type === 'text' && chunk.props?.content) {
						if (chunk.delta) {
							fullTextRef.current += chunk.props.content
						} else {
							fullTextRef.current = chunk.props.content
						}

						const currentText = fullTextRef.current
						setTokenCount(estimateTokens(currentText))

						if (outputFormat === 'json') {
							if (!throttleTimerRef.current) {
								throttleTimerRef.current = setTimeout(() => {
									throttleTimerRef.current = null
									const parsed = tryParseJson(fullTextRef.current)
									onStream?.(fullTextRef.current, parsed)
								}, THROTTLE_MS)
							}
						} else {
							onStream?.(currentText)
						}
					}
				},
				(error) => {
					onError?.(error)
					setState('idle')
					setTokenCount(0)
					abortRef.current = null
				}
			)

			abortRef.current = abort
		} catch (error) {
			onError?.(error instanceof Error ? error : new Error(String(error)))
			setState('idle')
			setTokenCount(0)
		}
	}, [userInput, assistantId, context, outputFormat, is_cn, onStart, onStream, onComplete, onError])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (state === 'generating') {
					handleCancel()
				} else if (state === 'input') {
					handleCloseInput()
				}
			}
		}

		const handleClickOutside = (e: MouseEvent) => {
			if (
				state === 'input' &&
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				handleCloseInput()
			}
		}

		if (state === 'input' || state === 'generating') {
			document.addEventListener('keydown', handleKeyDown)
		}
		if (state === 'input') {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [state, handleCancel, handleCloseInput])

	useEffect(() => {
		return () => {
			abortRef.current?.()
			if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current)
		}
	}, [])

	const handleInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				handleSubmit()
			}
		},
		[handleSubmit]
	)

	// Render: children (custom button)
	if (children) {
		return (
			<div className={styles.aiGenerator} ref={containerRef}>
				{children({
					onClick: state === 'idle' ? handleOpenInput : () => {},
					generating: state === 'generating',
					tokenCount,
					cancel: handleCancel
				})}
				{state === 'input' && renderDropdown()}
			</div>
		)
	}

	function renderTrigger() {
		if (state === 'generating') {
			return (
				<div
					className={`${styles.generatingBtn} ${size === 'small' ? styles.small : ''}`}
					style={buttonStyle}
				>
					<div className={styles.shimmer} />
					<span className={styles.genContent}>
						<span className={styles.sparkle}>✦</span>
						<span className={styles.tokenCount}>
							{tokenCount > 0 ? `~${tokenCount} tokens` : (is_cn ? '思考中' : 'Thinking')}
						</span>
					</span>
					<button
						className={styles.cancelBtn}
						onClick={handleCancel}
						title={is_cn ? '停止' : 'Stop'}
					>
						<Icon name='material-close' size={10} />
					</button>
				</div>
			)
		}

		return (
			<div
				className={`${styles.triggerBtn} ${size === 'small' ? styles.small : ''} ${buttonClassName || ''}`}
				style={buttonStyle}
				onClick={handleOpenInput}
			>
				<Icon name='material-auto_awesome' size={size === 'small' ? 11 : 12} />
				<span>{label || (is_cn ? '生成' : 'Generate')}</span>
			</div>
		)
	}

	function renderDropdown() {
		return (
			<div className={styles.dropdown} ref={dropdownRef}>
				<div className={styles.dropdownBody}>
					<textarea
						ref={textareaRef}
						className={styles.inputArea}
						value={userInput}
						onChange={(e) => setUserInput(e.target.value)}
						onKeyDown={handleInputKeyDown}
						placeholder={
							placeholder ||
							(is_cn
								? '描述你的需求...'
								: 'Describe your requirements...')
						}
					/>
				</div>
				<div className={styles.dropdownFooter}>
					<span className={styles.hintText}>
						{is_cn ? '⌘+Enter 发送' : '⌘+Enter to send'}
					</span>
					<button
						className={styles.submitBtn}
						onClick={handleSubmit}
						disabled={!userInput.trim()}
					>
						<PaperPlaneTilt size={14} />
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.aiGenerator} ref={containerRef}>
			{renderTrigger()}
			{state === 'input' && renderDropdown()}
		</div>
	)
}

export default AIGenerator
