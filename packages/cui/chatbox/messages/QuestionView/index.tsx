import React, { useState, useMemo } from 'react'
import clsx from 'clsx'
import { getLocale } from '@umijs/max'
import type { QuestionMessage, QuestionItem } from '../../../openapi'
import { Icon } from '@/widgets'
import { useChatContext } from '../../context'
import styles from './index.less'

interface IQuestionViewProps {
	message: QuestionMessage
	loading?: boolean
}

const QuestionView = ({ message }: IQuestionViewProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const chatContext = useChatContext()

	const streaming = chatContext?.streaming ?? false
	const sendMessage = chatContext?.sendMessage
	const allMessages = chatContext?.messages ?? []

	const raw = message.props || ({} as any)
	const props = raw.execute && typeof raw.execute === 'object' ? { ...raw.execute } : raw

	const questions = useMemo<QuestionItem[]>(() => extractQuestions(props), [props])

	const [answers, setAnswers] = useState<Record<string, string>>({})
	const [submitted, setSubmitted] = useState(false)

	const hasFollowUp = useMemo(() => {
		const myIdx = allMessages.findIndex(
			(m) =>
				(m.message_id && m.message_id === message.message_id) ||
				(m.chunk_id && m.chunk_id === message.chunk_id)
		)
		return myIdx >= 0 && allMessages.slice(myIdx + 1).some((m) => m.type === 'user_input')
	}, [allMessages, message.message_id, message.chunk_id])

	const isInteractive = !streaming && !submitted && !hasFollowUp && questions.length > 0
	const answeredCount = Object.keys(answers).length
	const totalCount = questions.length
	const showSubmit = isInteractive && answeredCount > 0

	const handleSelect = (questionText: string, label: string, multiSelect?: boolean) => {
		if (!isInteractive) return
		if (multiSelect) {
			const current = answers[questionText] || ''
			const selected = current ? current.split(', ') : []
			const idx = selected.indexOf(label)
			if (idx >= 0) {
				selected.splice(idx, 1)
				if (selected.length === 0) {
					setAnswers((prev) => {
						const next = { ...prev }
						delete next[questionText]
						return next
					})
				} else {
					setAnswers((prev) => ({ ...prev, [questionText]: selected.join(', ') }))
				}
			} else {
				selected.push(label)
				setAnswers((prev) => ({ ...prev, [questionText]: selected.join(', ') }))
			}
		} else {
			if (answers[questionText] === label) {
				setAnswers((prev) => {
					const next = { ...prev }
					delete next[questionText]
					return next
				})
			} else {
				setAnswers((prev) => ({ ...prev, [questionText]: label }))
			}
		}
	}

	const handleSubmit = () => {
		if (!sendMessage) return
		const answerTags = Object.entries(answers)
			.map(([q, a]) => `<Answer question="${q}" value="${a}">${a}</Answer>`)
			.join('\n')
		const text = `User has answered your questions:\n${answerTags}\nYou can now continue with the user's answers in mind.`

		const workspaceId = chatContext?.activeTab?.lastWorkspace || undefined

		setSubmitted(true)
		sendMessage({
			messages: [{ role: 'user', content: text }],
			locale,
			metadata: {
				mode: 'task',
				workspace_id: workspaceId
			}
		})
	}

	const isOptionSelected = (questionText: string, label: string, multiSelect?: boolean): boolean => {
		const answer = answers[questionText]
		if (!answer) return false
		if (multiSelect) {
			return answer.split(', ').includes(label)
		}
		return answer === label
	}

	if (questions.length === 0) {
		return (
			<div className={styles.container}>
				<div className={styles.header}>
					<span className={clsx(styles.icon, styles.iconMuted)}>
						<Icon name='material-help_outline' size={14} />
					</span>
					<span className={styles.shimmerText}>
						{is_cn ? '加载问题...' : 'Loading questions...'}
					</span>
				</div>
			</div>
		)
	}

	const answered = submitted || hasFollowUp

	return (
		<div className={styles.container}>
			{questions.map((q, i) => {
				const selectedAnswer = answers[q.question]

				return (
					<div key={i} className={clsx(styles.questionCard, answered && styles.answered)}>
						<div className={styles.header}>
							<span className={clsx(styles.icon, answered ? styles.iconAnswered : styles.iconActive)}>
								<Icon name='material-help_outline' size={14} />
							</span>
							<span className={styles.headerLabel}>{q.header}</span>
						</div>

						<div className={styles.questionText}>{q.question}</div>

						<div className={styles.options}>
							{q.options.map((opt) => {
								const selected = isOptionSelected(q.question, opt.label, q.multiSelect)
								return (
									<div
										key={opt.label}
										className={clsx(
											styles.optionPill,
											selected && styles.optionSelected,
											!isInteractive && styles.optionDisabled,
											answered && selectedAnswer?.includes(opt.label) && styles.optionAnswered
										)}
										onClick={() => handleSelect(q.question, opt.label, q.multiSelect)}
									>
										<span className={styles.optionLabel}>{opt.label}</span>
										{opt.description && (
											<span className={styles.optionDesc}>{opt.description}</span>
										)}
									</div>
								)
							})}
						</div>
					</div>
				)
			})}

			{showSubmit && (
				<button className={styles.submitBtn} onClick={handleSubmit}>
					{is_cn
						? `提交回答 (${answeredCount}/${totalCount})`
						: `Submit Answers (${answeredCount}/${totalCount})`}
				</button>
			)}
		</div>
	)
}

function extractQuestions(props: any): QuestionItem[] {
	const input = props.input
	if (!input) return []

	let parsed = input
	if (typeof input === 'string') {
		try {
			parsed = JSON.parse(input)
		} catch {
			return []
		}
	}

	const questions = parsed?.questions
	if (!Array.isArray(questions)) return []

	return questions
		.filter((q: any) => q.question && Array.isArray(q.options) && q.options.length > 0)
		.map((q: any) => ({
			question: q.question,
			header: q.header || (q.question.length > 12 ? q.question.slice(0, 12) + '...' : q.question),
			options: q.options,
			multiSelect: q.allow_multiple ?? q.multiSelect ?? false
		}))
}

export default QuestionView
