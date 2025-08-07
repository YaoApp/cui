import React, { useMemo } from 'react'
import { SoundOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import styles from '../index.less'

interface AudioProps {
	src?: string
	file?: File
	contentType?: string
	fileName?: string
}

const AudioComponent: React.FC<AudioProps> = ({ src, file, contentType, fileName }) => {
	// 统一处理文件源
	const fileSource = useMemo(() => {
		if (src) return src
		if (file) return URL.createObjectURL(file)
		return undefined
	}, [src, file])
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	return (
		<div className={styles.audioContainer}>
			<div className={styles.audioIcon}>
				<SoundOutlined />
			</div>
			<audio src={fileSource} controls style={{ width: '100%' }} preload='metadata'>
				{is_cn ? '您的浏览器不支持音频播放' : 'Your browser does not support audio playback'}
			</audio>
		</div>
	)
}

export default AudioComponent
