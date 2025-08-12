import React, { useEffect, useState } from 'react'
import { Modal, Button, Form, Input, message, Card, Space } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { KB, Collection } from '@/openapi'
import Tag from '@/neo/components/AIChat/Tag'
import { useProviderInfo } from '../components/Provider/hooks/useProviderInfo'
import styles from './index.less'

const { TextArea } = Input

interface CollectionConfigModalProps {
	visible: boolean
	onClose: () => void
	collection: Collection | null
	onUpdate?: (updatedCollection: Collection) => void
}

const CollectionConfigModal: React.FC<CollectionConfigModalProps> = ({ visible, onClose, collection, onUpdate }) => {
	const [form] = Form.useForm()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [loading, setLoading] = useState(false)
	const [selectedEmbedding, setSelectedEmbedding] = useState<string>('')

	// 使用provider信息hook
	const { getProviderInfo, loading: providerLoading } = useProviderInfo('embedding')

	// 初始化表单数据
	useEffect(() => {
		if (visible && collection) {
			// 从metadata中读取原始的embedding provider信息
			const embeddingProvider = (collection.metadata.__embedding_provider as string) || ''
			const embeddingOption = (collection.metadata.__embedding_option as string) || ''
			const embeddingValue =
				embeddingProvider && embeddingOption ? `${embeddingProvider}|${embeddingOption}` : ''

			setSelectedEmbedding(embeddingValue)

			form.setFieldsValue({
				name: collection.metadata.name,
				description: collection.metadata.description
			})
		}
	}, [visible, collection, form])

	// 处理表单提交
	const handleSubmit = async (values: any) => {
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
				name: values.name,
				description: values.description || '',
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
		form.resetFields()
		onClose()
	}

	if (!collection) {
		return null
	}

	return (
		<Modal
			title={
				<div className={styles.modalHeader}>
					<div className={styles.modalTitle}>
						<Icon name='material-settings' size={20} />
						<span>{is_cn ? '集合配置' : 'Collection Settings'}</span>
					</div>
					<div className={styles.modalActions}>
						<Button onClick={handleCancel}>{is_cn ? '取消' : 'Cancel'}</Button>
						<Button type='primary' onClick={() => form.submit()} loading={loading}>
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
			<Form form={form} layout='vertical' onFinish={handleSubmit} className={styles.configForm}>
				{/* 基本信息表单 */}
				<Card size='small' className={styles.editableSection}>
					<div className={styles.sectionHeader}>
						<Icon name='material-info' size={16} />
						<span className={styles.sectionTitle}>
							{is_cn ? '基本信息' : 'Basic Information'}
						</span>
					</div>

					<Form.Item
						name='name'
						label={is_cn ? '集合名称' : 'Collection Name'}
						rules={[
							{
								required: true,
								message: is_cn ? '请输入集合名称' : 'Please enter collection name'
							}
						]}
					>
						<Input placeholder={is_cn ? '输入集合显示名称' : 'Enter collection display name'} />
					</Form.Item>

					<Form.Item name='description' label={is_cn ? '描述' : 'Description'}>
						<TextArea
							rows={3}
							placeholder={
								is_cn
									? '输入集合描述（可选）'
									: 'Enter collection description (optional)'
							}
						/>
					</Form.Item>
				</Card>

				{/* 只读信息展示 */}
				<Card size='small' className={styles.readonlySection}>
					<div className={styles.sectionHeader}>
						<Icon name='material-info' size={16} />
						<span className={styles.sectionTitle}>
							{is_cn ? '集合信息' : 'Collection Information'}
						</span>
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
				</Card>

				{/* 配置参数 */}
				{collection.config && (
					<Card size='small' className={styles.vectorConfigSection}>
						<div className={styles.sectionHeader}>
							<Icon name='material-tune' size={16} />
							<span className={styles.sectionTitle}>
								{is_cn ? '向量配置' : 'Vector Configuration'}
							</span>
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
					</Card>
				)}
			</Form>
		</Modal>
	)
}

export default CollectionConfigModal
