import { useEffect, useState, useRef } from 'react'
import Icon from '@/widgets/Icon'
import styles from './ProgressTimeline.less'

export interface TimelineStep {
	id: string
	title: string
	description?: string
	status: 'pending' | 'loading' | 'completed' | 'error'
	timestamp?: number
}

interface ProgressTimelineProps {
	steps: TimelineStep[]
	is_cn: boolean
	hasError?: boolean
	isGenerating?: boolean
	requirement?: string
	onRetry?: () => void
	onEditPrompt?: () => void
	onStop?: () => void
}

const ProgressTimeline = ({ steps, is_cn, hasError = false, isGenerating = false, requirement, onRetry, onEditPrompt, onStop }: ProgressTimelineProps) => {
	const [visibleSteps, setVisibleSteps] = useState<string[]>([])
	const timelineStepsRef = useRef<HTMLDivElement>(null)

	// Animate steps appearing
	useEffect(() => {
		steps.forEach((step, index) => {
			setTimeout(() => {
				setVisibleSteps((prev) => [...new Set([...prev, step.id])])
			}, index * 100)
		})
	}, [steps])

	// Auto scroll to bottom when new steps are added
	useEffect(() => {
		if (timelineStepsRef.current) {
			timelineStepsRef.current.scrollTop = timelineStepsRef.current.scrollHeight
		}
	}, [steps])

	const getStepIcon = (status: TimelineStep['status']) => {
		switch (status) {
			case 'completed':
				return <Icon name='material-check_circle' size={20} />
			case 'loading':
				return (
					<div className={styles.spinner}>
						<Icon name='material-autorenew' size={20} />
					</div>
				)
			case 'error':
				return <Icon name='material-error' size={20} />
			default:
				return <div className={styles.dot} />
		}
	}

	return (
		<div className={styles.timeline}>
			<div className={`${styles.timelineHeader} ${hasError ? styles.hasError : ''}`}>
				<Icon 
					name='material-psychology' 
					size={24} 
					className={styles.headerIcon}
				/>
				<h3 className={styles.timelineTitle}>
					{hasError 
						? (is_cn ? '创建失败' : 'Creation Failed')
						: (is_cn ? 'AI 正在创建智能体...' : 'AI is creating assistant...')
					}
				</h3>
			</div>

			{requirement && (
				<div className={styles.requirementSection}>
					<div className={styles.requirementLabel}>
						<Icon name='material-description' size={16} />
						<span>{is_cn ? '需求描述' : 'Requirements'}</span>
					</div>
					<div className={styles.requirementContent}>
						{requirement}
					</div>
				</div>
			)}

			<div className={styles.timelineSteps} ref={timelineStepsRef}>
				{steps.map((step, index) => {
					const isVisible = visibleSteps.includes(step.id)
					const isLast = index === steps.length - 1

					return (
						<div
							key={step.id}
							className={`${styles.timelineStep} ${
								isVisible ? styles.visible : ''
							} ${styles[step.status]}`}
						>
							<div className={styles.stepLine}>
								<div className={styles.stepIconWrapper}>{getStepIcon(step.status)}</div>
								{!isLast && <div className={styles.connector} />}
							</div>
							<div className={styles.stepContent}>
								<div className={styles.stepTitle}>{step.title}</div>
								{step.description && (
									<div className={styles.stepDescription}>{step.description}</div>
								)}
								{step.timestamp && (
									<div className={styles.stepTime}>
										{new Date(step.timestamp).toLocaleTimeString()}
									</div>
								)}
							</div>
						</div>
					)
				})}
			</div>

			{/* Show stop button when generating */}
			{isGenerating && onStop && (
				<div className={styles.timelineFooter}>
					<button className={styles.stopButton} onClick={onStop}>
						<Icon name='material-stop' size={18} />
						<span>{is_cn ? '停止' : 'Stop'}</span>
					</button>
				</div>
			)}

			{/* Show retry and edit buttons when error */}
			{hasError && (onRetry || onEditPrompt) && (
				<div className={styles.timelineFooter}>
					{onRetry && (
						<button className={styles.retryButton} onClick={onRetry}>
							<Icon name='material-refresh' size={18} />
							<span>{is_cn ? '重试' : 'Retry'}</span>
						</button>
					)}
					{onEditPrompt && (
						<button className={styles.editButton} onClick={onEditPrompt}>
							<Icon name='material-edit' size={18} />
							<span>{is_cn ? '修改需求' : 'Edit Requirements'}</span>
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export default ProgressTimeline

