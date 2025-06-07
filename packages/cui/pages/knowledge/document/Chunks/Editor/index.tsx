import React, { useState } from 'react'
import { Button, Input, InputNumber, Tag, Typography, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from '../detail.less'
import localStyles from './index.less'

const { TextArea } = Input
const { Text } = Typography

interface ChunkData {
	id: string
	text: string
	weight: number
	recall_count: number
	upvotes: number
	downvotes: number
	text_length: number
	max_length: number
}

interface ChunkEditorProps {
	chunkData: ChunkData
	onSave: (updatedData: Partial<ChunkData>) => void
}

const ChunkEditor: React.FC<ChunkEditorProps> = ({ chunkData, onSave }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [isEditing, setIsEditing] = useState(false)
	const [editedText, setEditedText] = useState(chunkData.text)
	const [editedWeight, setEditedWeight] = useState(chunkData.weight)

	const netVotes = chunkData.upvotes - chunkData.downvotes

	const handleSave = () => {
		const updatedData: Partial<ChunkData> = {
			text: editedText,
			weight: editedWeight,
			text_length: editedText.length
		}

		onSave(updatedData)
		setIsEditing(false)
		message.success(is_cn ? '保存成功' : 'Saved successfully')
	}

	const handleCancel = () => {
		setEditedText(chunkData.text)
		setEditedWeight(chunkData.weight)
		setIsEditing(false)
	}

	return (
		<div className={styles.tabContent}>
			{/* Head */}
			<div className={styles.tabHeader}>
				<div className={styles.tabTitle}>
					<Icon name='material-edit_note' size={16} />
					<span>{is_cn ? '内容编辑' : 'Content Editor'}</span>
				</div>
				<div className={localStyles.actionSection}>
					{!isEditing ? (
						<Button
							type='primary'
							size='small'
							icon={<Icon name='material-edit' size={14} />}
							onClick={() => setIsEditing(true)}
						>
							{is_cn ? '编辑' : 'Edit'}
						</Button>
					) : (
						<div className={localStyles.editActions}>
							<Button size='small' onClick={handleCancel}>
								{is_cn ? '取消' : 'Cancel'}
							</Button>
							<Button
								type='primary'
								size='small'
								icon={<Icon name='material-check' size={14} />}
								onClick={handleSave}
							>
								{is_cn ? '保存' : 'Save'}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Body */}
			<div className={localStyles.editorBody}>
				{/* 基本信息标签 */}
				<div className={localStyles.metaSection}>
					<Tag color='blue'>ID: {chunkData.id}</Tag>
					<Tag color='orange'>
						{is_cn ? '召回次数' : 'Recall Count'}: {chunkData.recall_count}
					</Tag>
					<Tag color={netVotes > 0 ? 'success' : netVotes < 0 ? 'error' : 'default'}>
						{is_cn ? '净票数' : 'Net Votes'}: {netVotes}
					</Tag>
				</div>

				{/* 权重编辑 */}
				<div className={localStyles.weightSection}>
					<div className={localStyles.fieldLabel}>
						<Icon name='material-balance' size={14} />
						<span>{is_cn ? '权重' : 'Weight'}</span>
					</div>
					{isEditing ? (
						<InputNumber
							value={editedWeight}
							onChange={(value) => setEditedWeight(value || 0)}
							min={0}
							max={1}
							step={0.01}
							precision={2}
							size='small'
							style={{ width: 120 }}
						/>
					) : (
						<Tag color='green'>{chunkData.weight.toFixed(2)}</Tag>
					)}
				</div>

				{/* 文本内容编辑 */}
				<div className={localStyles.textSection}>
					<div className={localStyles.fieldLabel}>
						<Icon name='material-text_fields' size={14} />
						<span>{is_cn ? '文本内容' : 'Text Content'}</span>
						<Text type='secondary' style={{ fontSize: 12, marginLeft: 8 }}>
							({isEditing ? editedText.length : chunkData.text_length}/
							{chunkData.max_length})
						</Text>
					</div>

					{isEditing ? (
						<TextArea
							value={editedText}
							onChange={(e) => setEditedText(e.target.value)}
							rows={12}
							maxLength={chunkData.max_length}
							showCount
							placeholder={is_cn ? '请输入文本内容...' : 'Enter text content...'}
							className={localStyles.textEditor}
						/>
					) : (
						<div className={localStyles.textDisplay}>
							<Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
								{chunkData.text}
							</Text>
						</div>
					)}
				</div>

				{/* 投票信息（只读） */}
				<div className={localStyles.voteSection}>
					<div className={localStyles.fieldLabel}>
						<Icon name='material-how_to_vote' size={14} />
						<span>{is_cn ? '投票信息' : 'Voting Information'}</span>
					</div>
					<div className={localStyles.voteStats}>
						<div className={localStyles.voteItem}>
							<Icon name='material-thumb_up' size={14} className={localStyles.upvoteIcon} />
							<Text>
								{is_cn ? '赞同' : 'Upvotes'}: {chunkData.upvotes}
							</Text>
						</div>
						<div className={localStyles.voteItem}>
							<Icon
								name='material-thumb_down'
								size={14}
								className={localStyles.downvoteIcon}
							/>
							<Text>
								{is_cn ? '反对' : 'Downvotes'}: {chunkData.downvotes}
							</Text>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ChunkEditor
