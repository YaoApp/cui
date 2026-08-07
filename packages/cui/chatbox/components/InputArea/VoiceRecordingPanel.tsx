import React from 'react'
import { getLocale } from '@umijs/max'
import VoiceWaveform from './VoiceWaveform'
import styles from './VoiceRecordingPanel.less'

interface IVoiceRecordingPanelProps {
	duration: number
	waveformRef: React.RefObject<number[]>
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${m}:${s.toString().padStart(2, '0')}`
}

const VoiceRecordingPanel: React.FC<IVoiceRecordingPanelProps> = ({ duration, waveformRef }) => {
	return (
		<div className={styles.recordingPanel}>
			<VoiceWaveform waveformRef={waveformRef} />
			<div className={styles.indicator}>
				<span className={styles.recDot} />
				<span className={styles.timer}>{formatTime(duration)}</span>
			</div>
		</div>
	)
}

export default React.memo(VoiceRecordingPanel)
