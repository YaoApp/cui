import React, { useMemo } from 'react'
import { getLocale } from '@umijs/max'

interface VideoProps {
	src?: string
	file?: File
	contentType?: string
	fileName?: string
}

const VideoComponent: React.FC<VideoProps> = ({ src, file, contentType, fileName }) => {
	// 统一处理文件源
	const fileSource = useMemo(() => {
		if (src) return src
		if (file) return URL.createObjectURL(file)
		return undefined
	}, [src, file])
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	return (
		<video
			src={fileSource}
			controls
			style={{
				width: '100%',
				height: '100%',
				objectFit: 'contain'
			}}
			preload='metadata'
		>
			{is_cn ? '您的浏览器不支持视频播放' : 'Your browser does not support video playback'}
		</video>
	)
}

export default VideoComponent
