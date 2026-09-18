import { getLocale } from '@umijs/max'
import styles from '../index.less'

interface StepItem {
	label: string
}

interface StepIndicatorProps {
	steps: StepItem[]
	current: number
}

const StepIndicator = ({ steps, current }: StepIndicatorProps) => {
	const is_cn = getLocale() === 'zh-CN'
	const total = steps.length
	const isSingleStep = total === 1

	return (
		<div className={styles.stepIndicator}>
			<span className={styles.stepText}>
				{is_cn ? '步骤' : 'Step'} {current + 1}/{total}
			</span>
			<span className={styles.stepDots}>
				{steps.map((step, i) => (
					<span
						key={i}
						className={
							i < current
								? `${styles.stepDot} ${styles.stepDotDone}`
								: i === current
									? `${styles.stepDot} ${styles.stepDotActive}`
									: `${styles.stepDot} ${styles.stepDotPending}`
						}
					/>
				))}
			</span>
			{isSingleStep && steps[current] && (
				<span className={styles.stepLabel}>{steps[current].label}</span>
			)}
		</div>
	)
}

export default StepIndicator
