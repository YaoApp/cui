import React, { useState, useEffect } from 'react'
import { Input, Spin } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from '../../index.less'

interface UrlPreviewProps {
	data: {
		url: string
		title?: string
	}
}

const UrlPreview: React.FC<UrlPreviewProps> = ({ data }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [editableUrl, setEditableUrl] = useState(data.url)
	const [loading, setLoading] = useState(false)
	const [isValidUrl, setIsValidUrl] = useState(true)

	useEffect(() => {
		// 简单的URL验证
		try {
			new URL(editableUrl)
			setIsValidUrl(true)
		} catch {
			setIsValidUrl(false)
		}
	}, [editableUrl])

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditableUrl(e.target.value)
	}

	const getUrlStatus = () => {
		if (!editableUrl) {
			return is_cn ? '请输入URL' : 'Please enter URL'
		}
		if (!isValidUrl) {
			return is_cn ? 'URL格式无效' : 'Invalid URL format'
		}
		return is_cn ? 'URL有效，准备抓取内容' : 'Valid URL, ready to fetch content'
	}

	return (
		<div className={styles.urlPreview}>
			<div className={styles.urlInfo}>
				<div className={styles.urlHeader}>
					<Icon name='material-link' size={16} className={styles.urlIcon} />
					<span className={styles.urlTitle}>{is_cn ? '网页地址' : 'Web URL'}</span>
				</div>

				<Input
					value={editableUrl}
					onChange={handleUrlChange}
					placeholder={is_cn ? '输入网页URL地址...' : 'Enter web URL address...'}
					className={styles.urlInput}
					status={!isValidUrl && editableUrl ? 'error' : undefined}
				/>

				<div className={styles.urlStatus}>{getUrlStatus()}</div>
			</div>

			{isValidUrl && editableUrl && (
				<div className={styles.urlFrameContainer}>
					{loading && (
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								height: '300px'
							}}
						>
							<Spin size='large' />
						</div>
					)}
					<iframe
						src={editableUrl}
						className={styles.urlFrame}
						onLoad={() => setLoading(false)}
						onError={() => setLoading(false)}
						title='URL Preview'
						sandbox='allow-same-origin'
					/>
				</div>
			)}
		</div>
	)
}

export default UrlPreview
