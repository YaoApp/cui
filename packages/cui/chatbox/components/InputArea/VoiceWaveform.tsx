import React, { useRef, useEffect } from 'react'
import styles from './VoiceWaveform.less'

const BAR_COUNT = 24

interface IVoiceWaveformProps {
	waveformRef: React.RefObject<number[]>
}

const VoiceWaveform: React.FC<IVoiceWaveformProps> = ({ waveformRef }) => {
	const barsRef = useRef<(HTMLDivElement | null)[]>([])
	const rafRef = useRef(0)

	useEffect(() => {
		const update = () => {
			const data = waveformRef.current
			if (data) {
				for (let i = 0; i < barsRef.current.length; i++) {
					const el = barsRef.current[i]
					if (el) el.style.height = `${Math.max(3, (data[i] || 0) * 32)}px`
				}
			}
			rafRef.current = requestAnimationFrame(update)
		}
		rafRef.current = requestAnimationFrame(update)
		return () => cancelAnimationFrame(rafRef.current)
	}, [waveformRef])

	return (
		<div className={styles.waveformContainer}>
			{Array.from({ length: BAR_COUNT }, (_, i) => (
				<div
					key={i}
					ref={(el) => { barsRef.current[i] = el }}
					className={styles.bar}
				/>
			))}
		</div>
	)
}

export default React.memo(VoiceWaveform)
