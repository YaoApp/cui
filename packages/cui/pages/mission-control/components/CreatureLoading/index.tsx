import React from 'react'
import { getLocale } from '@umijs/max'
import styles from './index.less'

export type CreatureLoadingSize = 'small' | 'medium' | 'large'

interface CreatureLoadingProps {
	/** Size of the loading creature */
	size?: CreatureLoadingSize
	/** Optional loading text, if not provided will use default */
	text?: string
	/** Hide text completely */
	hideText?: boolean
	/** Custom className for container */
	className?: string
}

/**
 * Mission Control branded loading component
 * Features an animated "creature" with organic, breathing animations
 */
const CreatureLoading: React.FC<CreatureLoadingProps> = ({
	size = 'medium',
	text,
	hideText = false,
	className = ''
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	
	const defaultText = is_cn ? '加载中...' : 'Loading...'
	const displayText = text ?? defaultText

	return (
		<div className={`${styles.creatureLoading} ${styles[size]} ${className}`}>
			{/* Creature Container */}
			<div className={styles.creatureContainer}>
				{/* Aura - breathing glow effect */}
				<div className={styles.aura} />
				
				{/* Orbit ring with particle */}
				<div className={styles.orbitRing} />
				
				{/* The creature body */}
				<div className={styles.creature}>
					<div className={styles.creatureBody}>
						{/* Eyes */}
						<div className={styles.eyes}>
							<div className={styles.eye}>
								<div className={styles.pupil} />
							</div>
							<div className={styles.eye}>
								<div className={styles.pupil} />
							</div>
						</div>
					</div>
				</div>
				
				{/* Floating particles */}
				<div className={styles.particles}>
					<div className={styles.particle} style={{ '--delay': '0s' } as React.CSSProperties} />
					<div className={styles.particle} style={{ '--delay': '0.5s' } as React.CSSProperties} />
					<div className={styles.particle} style={{ '--delay': '1s' } as React.CSSProperties} />
					<div className={styles.particle} style={{ '--delay': '1.5s' } as React.CSSProperties} />
				</div>
			</div>
			
			{/* Loading text */}
			{!hideText && (
				<span className={styles.loadingText}>{displayText}</span>
			)}
		</div>
	)
}

export default CreatureLoading
