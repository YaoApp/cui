import React, { useEffect, useState } from 'react'
import { Modal, Button, message, Space, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { KB, Collection } from '@/openapi'
import Tag from '@/chatbox/components/AIChat/Tag'
import { useProviderInfo } from '@/components/ui/Provider/hooks/useProviderInfo'
import { IsTeamMember } from '@/pages/auth/auth'
import { Input, TextArea, RadioGroup } from '@/components/ui/inputs'
import type { PropertySchema } from '@/components/ui/inputs/types'
import styles from './index.less'

interface CollectionConfigModalProps {
	visible: boolean
	onClose: () => void
	collection: Collection | null
	onUpdate?: (updatedCollection: Collection) => void
}

const CollectionConfigModal: React.FC<CollectionConfigModalProps> = ({ visible, onClose, collection, onUpdate }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [loading, setLoading] = useState(false)
	const [selectedEmbedding, setSelectedEmbedding] = useState<string>('')
	const isTeamMember = IsTeamMember()

	// Form state
	const [formValues, setFormValues] = useState({
		name: '',
		description: '',
		share: 'team' as 'private' | 'team'
	})
	const [errors, setErrors] = useState<{ name?: string; description?: string }>({})

	// 使用provider信息hook
	const { getProviderInfo, loading: providerLoading } = useProviderInfo('embedding')

	// Share visibility options
	const shareSchema: PropertySchema = {
		type: 'string',
		component: 'RadioGroup',
		enum: [
			{ value: 'team', label: is_cn ? '团队成员可见' : 'Visible to team members' },
			{ value: 'private', label: is_cn ? '仅自己可见' : 'Private (only me)' }
		]
	}

	// 初始化表单数据
	useEffect(() => {
		if (visible && collection) {
			// 从metadata中读取原始的embedding provider信息
			const embeddingProvider = (collection.metadata.__embedding_provider as string) || ''
			const embeddingOption = (collection.metadata.__embedding_option as string) || ''
			const embeddingValue =
				embeddingProvider && embeddingOption ? `${embeddingProvider}|${embeddingOption}` : ''

			setSelectedEmbedding(embeddingValue)

			setFormValues({
				name: collection.metadata.name || '',
				description: collection.metadata.description || '',
				share: collection.metadata.share || 'team'
			})
			setErrors({})
		}
	}, [visible, collection])

	const handleFieldChange = (field: keyof typeof formValues, value: any) => {
		setFormValues((prev) => ({ ...prev, [field]: value }))
		// Clear error when field changes
		if (errors[field as keyof typeof errors]) {
			setErrors((prev) => {
				const newErrors = { ...prev }
				delete newErrors[field as keyof typeof errors]
				return newErrors
			})
		}
	}

	const validateForm = (): boolean => {
		const newErrors: { name?: string; description?: string } = {}

		if (!formValues.name.trim()) {
			newErrors.name = is_cn ? '请输入集合名称' : 'Please enter collection name'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	// 处理表单提交
	const handleSubmit = async () => {
		if (!validateForm()) {
			return
		}

		if (!collection || !window.$app?.openapi) {
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		setLoading(true)
		try {
			const kb = new KB(window.$app.openapi)

			// 更新集合元数据
			const updatedMetadata = {
				...collection.metadata,
				name: formValues.name,
				description: formValues.description || '',
				share: formValues.share,
				updated_at: new Date().toISOString()
			}

			// 调用实际的更新API
			const response = await kb.UpdateCollectionMetadata(collection.id, {
				metadata: updatedMetadata
			})

			if (response.error) {
				throw new Error(response.error.error_description || (is_cn ? '更新失败' : 'Update failed'))
			}

			// API调用成功，更新本地状态
			const updatedCollection: Collection = {
				...collection,
				metadata: updatedMetadata
			}

			message.success(is_cn ? '配置更新成功' : 'Configuration updated successfully')
			onUpdate?.(updatedCollection)
			onClose()
		} catch (error) {
			console.error('Update collection failed:', error)
			const errorMsg = error instanceof Error ? error.message : is_cn ? '更新失败' : 'Update failed'
			message.error(errorMsg)
		} finally {
			setLoading(false)
		}
	}

	const handleCancel = () => {
		setFormValues({ name: '', description: '', share: 'team' })
		setErrors({})
		onClose()
	}

	if (!collection) {
		return null
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.titleSection}>
						<Icon name='material-settings' size={18} className={styles.titleIcon} />
						<span className={styles.modalTitle}>
							{is_cn ? '集合配置' : 'Collection Settings'}
						</span>
					</div>
					<div className={styles.modalActions}>
						<Button onClick={handleCancel}>{is_cn ? '取消' : 'Cancel'}</Button>
						<Button type='primary' onClick={handleSubmit} loading={loading}>
							{is_cn ? '更新' : 'Update'}
						</Button>
					</div>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			width={700}
			footer={null}
			closable={false}
			className={styles.configModal}
		>
			<div className={styles.modalContent}>
				{/* 基本信息表单 */}
				<div className={styles.editableSection}>
					<div className={styles.sectionHeader}>
						<Icon name='material-info' size={16} />
						<h5>{is_cn ? '基本信息' : 'Basic Information'}</h5>
					</div>

					<div className={styles.formItem}>
						<label className={styles.formLabel}>
							{is_cn ? '集合名称' : 'Collection Name'}
							<span className={styles.required}>*</span>
						</label>
						<Input
							schema={{
								type: 'string',
								placeholder: is_cn
									? '输入集合显示名称'
									: 'Enter collection display name'
							}}
							value={formValues.name}
							onChange={(value) => handleFieldChange('name', value)}
							error={errors.name}
							hasError={!!errors.name}
						/>
					</div>

					<div className={styles.formItem}>
						<label className={styles.formLabel}>{is_cn ? '描述' : 'Description'}</label>
						<TextArea
							schema={{
								type: 'string',
								placeholder: is_cn
									? '输入集合描述（可选）'
									: 'Enter collection description (optional)',
								rows: 3
							}}
							value={formValues.description}
							onChange={(value) => handleFieldChange('description', value)}
						/>
					</div>

					{/* Share Visibility - Only show for team members */}
					{isTeamMember && (
						<div className={styles.formItem}>
							<label className={styles.formLabel}>
								{is_cn ? '可见范围' : 'Visibility'}
								<Tooltip
									title={
										is_cn
											? '选择集合的可见范围：私有（仅自己可见）或团队（团队成员可见）'
											: 'Choose collection visibility: Private (only you) or Team (all team members)'
									}
								>
									<InfoCircleOutlined
										style={{ marginLeft: 4, color: 'var(--color_text_grey)' }}
									/>
								</Tooltip>
							</label>
							<RadioGroup
								schema={shareSchema}
								value={formValues.share}
								onChange={(value) =>
									handleFieldChange('share', value as 'private' | 'team')
								}
							/>
						</div>
					)}
				</div>

				{/* 只读信息展示 */}
				<div className={styles.readonlySection}>
					<div className={styles.sectionHeader}>
						<Icon name='material-info' size={16} />
						<h5>{is_cn ? '集合信息' : 'Collection Information'}</h5>
					</div>

					<div className={styles.infoGrid}>
						<div className={styles.infoItem}>
							<span className={styles.infoLabel}>
								{is_cn ? '集合ID' : 'Collection ID'}:
							</span>
							<span className={styles.infoValue}>{collection.id}</span>
						</div>

						<div className={styles.infoItem}>
							<span className={styles.infoLabel}>
								{is_cn ? '文档数量' : 'Document Count'}:
							</span>
							<span className={styles.infoValue}>
								{collection.metadata.document_count || 0}
							</span>
						</div>

						<div className={styles.infoItem}>
							<span className={styles.infoLabel}>{is_cn ? '创建时间' : 'Created At'}:</span>
							<span className={styles.infoValue}>
								{new Date(collection.metadata.created_at).toLocaleString()}
							</span>
						</div>

						<div className={styles.infoItem}>
							<span className={styles.infoLabel}>{is_cn ? '更新时间' : 'Updated At'}:</span>
							<span className={styles.infoValue}>
								{new Date(collection.metadata.updated_at).toLocaleString()}
							</span>
						</div>

						<div className={styles.infoItem}>
							<span className={styles.infoLabel}>{is_cn ? '状态' : 'Status'}:</span>
							<span className={styles.infoValue}>
								<Space>
									{collection.metadata.readonly && (
										<Tag variant='warning'>{is_cn ? '只读' : 'Readonly'}</Tag>
									)}
									{collection.metadata.system && (
										<Tag variant='auto'>{is_cn ? '系统内建' : 'System'}</Tag>
									)}
									{collection.metadata.__yao_public_read && (
										<Tag variant='success'>{is_cn ? '公开' : 'Public'}</Tag>
									)}
									{!collection.metadata.readonly && !collection.metadata.system && (
										<Tag variant='primary'>{is_cn ? '正常' : 'Normal'}</Tag>
									)}
								</Space>
							</span>
						</div>
					</div>
				</div>

				{/* 配置参数 */}
				{collection.config && (
					<div className={styles.vectorConfigSection}>
						<div className={styles.sectionHeader}>
							<Icon name='material-tune' size={16} />
							<h5>{is_cn ? '向量配置' : 'Vector Configuration'}</h5>
						</div>

						<div className={styles.infoGrid}>
							{/* Embedding Provider 显示 */}
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>
									{is_cn ? '向量化模型' : 'Embedding Model'}:
								</span>
								<span className={styles.infoValue}>
									{(() => {
										if (providerLoading) {
											return is_cn ? '加载中...' : 'Loading...'
										}

										if (!selectedEmbedding) {
											return is_cn
												? '未配置向量化模型'
												: 'No embedding model configured'
										}

										const providerInfo = getProviderInfo(selectedEmbedding)
										if (providerInfo) {
											return providerInfo.title
										}

										return is_cn ? '未知模型' : 'Unknown model'
									})()}
								</span>
							</div>
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>
									{is_cn ? '距离算法' : 'Distance'}:
								</span>
								<span className={styles.infoValue}>{collection.config.distance}</span>
							</div>
							<div className={styles.infoItem}>
								<span className={styles.infoLabel}>
									{is_cn ? '索引类型' : 'Index Type'}:
								</span>
								<span className={styles.infoValue}>{collection.config.index_type}</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</Modal>
	)
}

export default CollectionConfigModal
