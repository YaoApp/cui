import React, { useState } from 'react'
import { Input } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from '../../index.less'

const { TextArea } = Input

interface TextPreviewProps {
	data: {
		content: string
	}
}

const TextPreview: React.FC<TextPreviewProps> = ({ data }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [editableContent, setEditableContent] = useState(data.content)

	const getTextStats = (text: string) => {
		return {
			characters: text.length,
			words: text
				.trim()
				.split(/\s+/)
				.filter((word) => word.length > 0).length,
			lines: text.split('\n').length
		}
	}

	const stats = getTextStats(editableContent)

	return (
		<div className={styles.textPreview}>
			<div className={styles.textInfo}>
				<Icon name='material-text_fields' size={16} className={styles.textIcon} />
				<span className={styles.textTitle}>{is_cn ? '文本内容' : 'Text Content'}</span>
				<span className={styles.textLength}>
					{stats.characters} {is_cn ? '字符' : 'characters'} • {stats.words}{' '}
					{is_cn ? '词' : 'words'} • {stats.lines} {is_cn ? '行' : 'lines'}
				</span>
			</div>

			<div className={styles.textContent}>
				<TextArea
					value={editableContent}
					onChange={(e) => setEditableContent(e.target.value)}
					placeholder={is_cn ? '在此编辑文本内容...' : 'Edit text content here...'}
					autoSize={{ minRows: 8, maxRows: 15 }}
					showCount
					maxLength={50000}
				/>
			</div>
		</div>
	)
}

export default TextPreview
