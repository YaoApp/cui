import React from 'react'
import clsx from 'clsx'
import styles from './index.less'

export type CreatureStatus = 'working' | 'idle' | 'paused' | 'error' | 'maintenance'
export type CreatureSize = 'xs' | 'small' | 'medium' | 'large'

export interface CreatureProps {
	/** Status determines the color scheme */
	status?: CreatureStatus
	/** Size variant */
	size?: CreatureSize
	/** Show outer aura glow effect */
	showAura?: boolean
	/** Show orbit ring around creature */
	showRing?: boolean
	/** Show glow/shadow effect on the creature body */
	showGlow?: boolean
	/** Show progress ring (only visible when status is 'working') */
	showProgress?: boolean
	/** Progress value 0-100 (for progress ring) */
	progress?: number
	/** Enable floating/breathing animations */
	animated?: boolean
	/** Show floating particles (only when working and animated) */
	showParticles?: boolean
	/** Additional className */
	className?: string
	/** Custom style */
	style?: React.CSSProperties
}

/**
 * Creature - An animated blob-like avatar component
 * 
 * A cute, animated creature that represents an agent/robot status.
 * Features different color schemes based on status, optional animations,
 * aura effects, and progress indicators.
 * 
 * @example
 * // Basic usage
 * <Creature status="working" />
 * 
 * // Small static version for headers
 * <Creature status="idle" size="small" animated={false} showAura={false} />
 * 
 * // Full featured with progress
 * <Creature status="working" showProgress progress={65} showParticles />
 */
const Creature: React.FC<CreatureProps> = ({
	status = 'idle',
	size = 'medium',
	showAura = true,
	showRing = true,
	showGlow = true,
	showProgress = false,
	progress = 65,
	animated = true,
	showParticles = false,
	className,
	style
}) => {
	return (
		<div
			className={clsx(
				styles.creatureContainer,
				styles[size],
				styles[status],
				{ [styles.noGlow]: !showGlow },
				className
			)}
			style={style}
		>
			{/* Aura glow */}
			{showAura && <div className={styles.aura} />}

			{/* Orbit ring */}
			{showRing && <div className={styles.orbitRing} />}

			{/* Progress ring for working status */}
			{showProgress && status === 'working' && (
				<svg className={styles.progressRing} viewBox='0 0 100 100'>
					<circle className={styles.bg} cx='50' cy='50' r='45' />
					<circle
						className={styles.progress}
						cx='50'
						cy='50'
						r='45'
						strokeDasharray={`${progress * 2.83} 283`}
					/>
				</svg>
			)}

			{/* The creature */}
			<div className={clsx(styles.creature, { [styles.animated]: animated })}>
				<div className={styles.creatureBody}>
					<div className={styles.eyes}>
						<span className={styles.eye} />
						<span className={styles.eye} />
					</div>
				</div>
			</div>

			{/* Floating particles for working */}
			{showParticles && animated && status === 'working' && (
				<div className={styles.particles}>
					<span />
					<span />
					<span />
				</div>
			)}
		</div>
	)
}

export default Creature
