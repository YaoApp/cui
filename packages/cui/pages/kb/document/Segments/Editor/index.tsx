import React, { useState } from 'react'
import { Button, Tag, Typography, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import CustomTextArea from './CustomTextArea'
import WeightEditor from './WeightEditor'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface ChunkData {
	id: string
	text: string
	weight: number
	hit_count: number
	upvotes: number
	downvotes: number
	text_length: number
	max_length: number
	score?: number
	metadata?: {
		chunk_details?: {
			depth?: number
			index?: number
		}
		hit_count?: number
	}
}

interface ChunkEditorProps {
	chunkData: ChunkData
	onSave: (updatedData: Partial<ChunkData>) => void
}

const ChunkEditor: React.FC<ChunkEditorProps> = ({ chunkData, onSave }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [isEditing, setIsEditing] = useState(false)
	const [editedText, setEditedText] = useState(chunkData.text?.trim() || '')
	const [editedWeight, setEditedWeight] = useState(chunkData.weight)

	const netVotes = chunkData.upvotes - chunkData.downvotes

	// 投票处理
	const handleVote = (type: 'good' | 'bad') => {
		// TODO: 实现真实的投票API调用
		message.success(is_cn ? '投票成功' : 'Vote submitted')
	}

	// 渲染位置信息
	const renderPositionInfo = (chunkDetails: any) => {
		if (!chunkDetails) return null

		// 优先检查是否有 text_position，有则按 text 类型处理
		if (chunkDetails.text_position) {
			const { start_line, end_line } = chunkDetails.text_position
			return (
				<div className={localStyles.positionInfo}>
					<Icon name='material-location_on' size={10} />
					{is_cn ? '行' : 'Lines'}:{' '}
					{start_line === end_line ? start_line : `${start_line}~${end_line}`}
				</div>
			)
		}

		// 其他类型的处理
		const { type } = chunkDetails
		if (type && type !== 'text') {
			return (
				<div className={localStyles.positionInfo}>
					<Icon name='material-info' size={10} />
					{is_cn ? '类型' : 'Type'}: {type}
				</div>
			)
		}

		return null
	}

	const handleSave = () => {
		const trimmedText = editedText.trim()
		const updatedData: Partial<ChunkData> = {
			text: trimmedText,
			weight: editedWeight,
			text_length: trimmedText.length
		}

		onSave(updatedData)
		setIsEditing(false)
		message.success(is_cn ? '保存成功' : 'Saved successfully')
	}

	const handleCancel = () => {
		setEditedText(chunkData.text?.trim() || '')
		setEditedWeight(chunkData.weight)
		setIsEditing(false)
	}

	return (
		<div className={styles.tabContent}>
			{/* Header - 与列表页一致的卡片头部风格 */}
			<div className={`${styles.tabHeader} ${localStyles.cardHeader}`}>
				<div className={localStyles.chunkMeta}>
					<span className={localStyles.chunkNumber}>
						{chunkData.metadata?.chunk_details?.depth !== undefined &&
						chunkData.metadata?.chunk_details?.index !== undefined ? (
							<>
								<span className={localStyles.levelInfo}>
									<Icon name='material-account_tree' size={10} />
									{chunkData.metadata.chunk_details.depth}
								</span>
								<span>#{chunkData.metadata.chunk_details.index + 1}</span>
							</>
						) : (
							`#${chunkData.id.slice(-8)}`
						)}
					</span>
				</div>
				<div className={localStyles.metaInfo}>
					<span className={localStyles.metaItem}>
						{is_cn ? '权重' : 'Weight'}{' '}
						<WeightEditor value={editedWeight} onChange={setEditedWeight} disabled={false} />
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '评分' : 'Score'}{' '}
						<span className={localStyles.metaNumber}>
							{chunkData.score?.toFixed(2) || '0.00'}
						</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '命中' : 'Hits'}{' '}
						<span className={localStyles.metaNumber}>{chunkData.hit_count || 0}</span>
					</span>
				</div>
				<div className={localStyles.actionSection}>
					{!isEditing ? (
						<Button
							type='primary'
							size='small'
							className={localStyles.editButton}
							onClick={() => setIsEditing(true)}
						>
							<Icon name='material-edit' size={14} />
							<span>{is_cn ? '编辑' : 'Edit'}</span>
						</Button>
					) : (
						<div className={localStyles.editActions}>
							<Button
								size='small'
								className={localStyles.cancelButton}
								onClick={handleCancel}
							>
								<Icon name='material-close' size={14} />
								<span>{is_cn ? '取消' : 'Cancel'}</span>
							</Button>
							<Button
								type='primary'
								size='small'
								className={localStyles.saveButton}
								onClick={handleSave}
							>
								<Icon name='material-check' size={14} />
								<span>{is_cn ? '保存' : 'Save'}</span>
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Body */}
			<div className={localStyles.editorBody}>
				{/* 文本内容编辑 */}
				<div className={localStyles.textSection}>
					<CustomTextArea
						value={isEditing ? editedText : chunkData.text?.trim() || ''}
						onChange={isEditing ? setEditedText : undefined}
						maxLength={chunkData.max_length}
						placeholder={is_cn ? '请输入文本内容...' : 'Enter text content...'}
						readOnly={!isEditing}
						className={localStyles.textEditor}
					/>
				</div>
			</div>

			{/* Footer - 与 Header 对称的贴边设计 */}
			<div className={localStyles.textToolbar}>
				<div className={localStyles.leftToolbar}>
					<div className={localStyles.textCounter}>
						<Text style={{ fontSize: 12, color: 'var(--color_main)' }}>
							{isEditing ? editedText.length : chunkData.text_length}/{chunkData.max_length}
						</Text>
					</div>
					{/* 位置信息 */}
					{chunkData.metadata?.chunk_details &&
						renderPositionInfo(chunkData.metadata.chunk_details)}
				</div>
				<div className={localStyles.textVoteActions}>
					<button className={localStyles.voteButton} onClick={() => handleVote('good')}>
						<Icon name='material-thumb_up' size={12} />
						<span>{chunkData.upvotes}</span>
					</button>
					<button className={localStyles.voteButton} onClick={() => handleVote('bad')}>
						<Icon name='material-thumb_down' size={12} />
						<span>{chunkData.downvotes}</span>
					</button>
				</div>
			</div>
		</div>
	)
}

export default ChunkEditor
