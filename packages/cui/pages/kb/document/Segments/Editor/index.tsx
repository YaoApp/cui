import React, { useState } from 'react'
import { Tag, Typography, message, Popconfirm } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import CustomTextArea from './CustomTextArea'
import WeightEditor from './WeightEditor'
import { Button } from '../../../components'
import { KB, UpdateSegmentsRequest, UpdateWeightRequest, UpdateWeightsRequest, CollectionInfo } from '@/openapi'
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
	collectionInfo: CollectionInfo
	docID: string // 文档ID，用于API调用
	onSave: (updatedData: Partial<ChunkData>) => void
	onDelete?: () => void // 删除回调
	onSavingStateChange?: (isSaving: boolean) => void // 保存状态变化回调
}

const ChunkEditor: React.FC<ChunkEditorProps> = ({
	chunkData,
	collectionInfo,
	docID,
	onSave,
	onDelete,
	onSavingStateChange
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [isEditing, setIsEditing] = useState(false)
	const [editedText, setEditedText] = useState(chunkData.text?.trim() || '')
	const [editedWeight, setEditedWeight] = useState(chunkData.weight)
	const [isSaving, setIsSaving] = useState(false)

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

	const handleSave = async (e?: React.MouseEvent) => {
		if (!window.$app?.openapi) {
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		const trimmedText = editedText.trim()
		if (!trimmedText) {
			message.error(is_cn ? '文本内容不能为空' : 'Text content cannot be empty')
			return
		}

		setIsSaving(true)
		onSavingStateChange?.(true) // 通知父组件保存开始
		try {
			const kb = new KB(window.$app.openapi)

			// 构建简化的 UpdateSegmentsRequest，只传递 segment_texts
			const updateTextRequest: UpdateSegmentsRequest = {
				segment_texts: [
					{
						id: chunkData.id,
						text: trimmedText
					}
				]
			}

			const response = await kb.UpdateSegments(docID, updateTextRequest)
			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to update text')
			}

			// 更新本地状态（权重由 handleWeightChange 单独处理）
			const updatedData: Partial<ChunkData> = {
				text: trimmedText,
				text_length: trimmedText.length
			}

			onSave(updatedData)
			setIsEditing(false)
			message.success(is_cn ? '保存成功' : 'Saved successfully')

			// 移除按钮焦点，防止卡在hover状态
			if (e?.currentTarget) {
				;(e.currentTarget as HTMLElement).blur()
			}
		} catch (error) {
			console.error('Save failed:', error)
			const errorMsg = error instanceof Error ? error.message : is_cn ? '保存失败' : 'Save failed'
			message.error(errorMsg)
		} finally {
			setIsSaving(false)
			onSavingStateChange?.(false) // 通知父组件保存结束
		}
	}

	const handleCancel = () => {
		setEditedText(chunkData.text?.trim() || '')
		setEditedWeight(chunkData.weight)
		setIsEditing(false)
	}

	// 权重变化处理 - 立即调用API更新
	const handleWeightChange = async (newWeight: number) => {
		if (!window.$app?.openapi) {
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		try {
			const kb = new KB(window.$app.openapi)
			const updateWeightsRequest: UpdateWeightsRequest = {
				weights: [
					{
						id: chunkData.id,
						weight: newWeight
					}
				]
			}

			const response = await kb.UpdateWeights(docID, updateWeightsRequest)
			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to update weight')
			}

			// 更新本地状态
			setEditedWeight(newWeight)

			// 通知父组件
			onSave({ weight: newWeight })
		} catch (error) {
			console.error('Weight update failed:', error)
			const errorMsg =
				error instanceof Error ? error.message : is_cn ? '权重更新失败' : 'Weight update failed'
			message.error(errorMsg)
		}
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
						<WeightEditor value={editedWeight} onChange={handleWeightChange} disabled={false} />
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
					{/* 编辑状态下的悬浮按钮 */}
					{isEditing && (
						<div className={localStyles.floatingLeftButtons}>
							<Button
								size='small'
								className={localStyles.cancelActionButton}
								onClick={handleCancel}
								disabled={isSaving}
								icon={<Icon name='material-close' size={12} />}
							>
								{is_cn ? '取消' : 'Cancel'}
							</Button>
							<Popconfirm
								title={
									is_cn
										? '确定要删除这个片段吗？删除后将无法恢复！'
										: 'Are you sure to delete this segment? This action cannot be undone!'
								}
								open={isSaving ? false : undefined}
								onConfirm={async () => {
									if (!window.$app?.openapi) {
										message.error(is_cn ? '系统未就绪' : 'System not ready')
										return
									}

									try {
										const kb = new KB(window.$app.openapi)
										const response = await kb.RemoveSegments(docID, [
											chunkData.id
										])

										if (window.$app.openapi.IsError(response)) {
											throw new Error(
												response.error?.error_description ||
													'Failed to delete segment'
											)
										}

										message.success(is_cn ? '删除成功' : 'Deleted successfully')

										// 调用删除回调
										if (onDelete) {
											onDelete()
										}
									} catch (error) {
										console.error('Delete failed:', error)
										const errorMsg =
											error instanceof Error
												? error.message
												: is_cn
												? '删除失败'
												: 'Delete failed'
										message.error(errorMsg)
									}
								}}
								okText={is_cn ? '确认' : 'Confirm'}
								cancelText={is_cn ? '取消' : 'Cancel'}
							>
								<Button
									type='danger'
									size='small'
									className={localStyles.deleteButton}
									disabled={isSaving}
									icon={<Icon name='material-delete' size={12} />}
								>
									{is_cn ? '删除' : 'Delete'}
								</Button>
							</Popconfirm>
							<Button
								type='primary'
								size='small'
								className={localStyles.saveButton}
								onClick={handleSave}
								disabled={isSaving}
								loading={isSaving}
								loadingIcon='material-refresh'
								icon={!isSaving ? <Icon name='material-save' size={12} /> : undefined}
							>
								{is_cn ? '保存' : 'Save'}
							</Button>
						</div>
					)}

					{/* 主按钮 - 只在非编辑状态显示 Edit 按钮 */}
					{!isEditing && (
						<Button
							type='primary'
							size='small'
							className={localStyles.editButton}
							onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
								setIsEditing(true)
								// 移除按钮焦点，防止卡在hover状态
								e.currentTarget.blur()
							}}
							icon={<Icon name='material-edit' size={12} />}
						>
							{is_cn ? '编辑' : 'Edit'}
						</Button>
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
