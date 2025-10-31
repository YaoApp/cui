import { useState } from 'react'
import { customAlphabet } from 'nanoid'
import { Button, Card, message, Breadcrumb, Tooltip } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { history, getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { KB } from '@/openapi'
import type { CreateCollectionRequest, CollectionConfig } from '@/openapi/kb/types'
import ProviderSelect from '@/components/ui/Provider/Select'
import { IsTeamMember } from '@/pages/auth/auth'
import { Input, TextArea, Select, InputNumber, RadioGroup } from '@/components/ui/inputs'
import type { PropertySchema } from '@/components/ui/inputs/types'
import styles from './index.less'

interface FormValues {
	name: string
	description: string
	share: string
	distance: string
	index_type: string
	m: number
	ef_construction: number
	ef_search: number
	num_lists: number
	num_probes: number
}

const CreateCollection = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [loading, setLoading] = useState(false)
	const [selectedEmbedding, setSelectedEmbedding] = useState<string>('')
	const isTeamMember = IsTeamMember()

	// Form state
	const [formValues, setFormValues] = useState<FormValues>({
		name: '',
		description: '',
		share: 'team',
		distance: 'cosine',
		index_type: 'hnsw',
		m: 16,
		ef_construction: 200,
		ef_search: 64,
		num_lists: 100,
		num_probes: 10
	})

	// Form errors
	const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

	// Distance metrics options
	const distanceSchema: PropertySchema = {
		type: 'string',
		component: 'Select',
		enum: [
			{
				value: 'cosine',
				label: is_cn
					? '余弦距离 (推荐，适合文本向量)'
					: 'Cosine Distance (Recommended for text vectors)'
			},
			{
				value: 'euclidean',
				label: is_cn ? '欧几里得距离 (适合图像向量)' : 'Euclidean Distance (Good for image vectors)'
			},
			{ value: 'dot', label: is_cn ? '点积 (计算最快)' : 'Dot Product (Fastest computation)' }
		]
	}

	// Index type options
	const indexTypeSchema: PropertySchema = {
		type: 'string',
		component: 'Select',
		enum: [
			{ value: 'hnsw', label: is_cn ? 'HNSW (适合大多数场景)' : 'HNSW (For most cases)' },
			{ value: 'ivf', label: is_cn ? 'IVF (适合大规模数据)' : 'IVF (For large datasets)' },
			{ value: 'flat', label: is_cn ? 'Flat (适合小数据集)' : 'Flat (For small datasets)' }
		]
	}

	// Share visibility options
	const shareSchema: PropertySchema = {
		type: 'string',
		component: 'RadioGroup',
		enum: [
			{ value: 'team', label: is_cn ? '团队成员可见' : 'Visible to team members' },
			{ value: 'private', label: is_cn ? '仅自己可见' : 'Private (only me)' }
		]
	}

	const handleFieldChange = (field: keyof FormValues, value: any) => {
		setFormValues((prev) => ({ ...prev, [field]: value }))
		// Clear error when field changes
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev }
				delete newErrors[field]
				return newErrors
			})
		}
	}

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof FormValues, string>> = {}

		if (!formValues.name.trim()) {
			newErrors.name = is_cn ? '请输入集合名称' : 'Please enter collection name'
		}

		if (!selectedEmbedding) {
			message.error(is_cn ? '请选择向量化模型' : 'Please select embedding model')
			return false
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async () => {
		if (!validateForm()) {
			return
		}

		if (!window.$app?.openapi) {
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		setLoading(true)
		try {
			const kb = new KB(window.$app.openapi)

			// Generate unique ID
			const nanoid = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 16)
			const generatedId = nanoid()

			// Parse embedding provider and option from selectedEmbedding
			let embeddingProvider = selectedEmbedding
			let embeddingOption = ''

			if (selectedEmbedding.includes('|')) {
				const [providerId, optionValue] = selectedEmbedding.split('|')
				embeddingProvider = providerId
				embeddingOption = optionValue
			}

			// Prepare the request data
			const config: CollectionConfig = {
				embedding_provider_id: embeddingProvider,
				embedding_option_id: embeddingOption,
				locale: locale,
				distance: formValues.distance,
				index_type: formValues.index_type
			}

			// Add optional HNSW parameters if index type is HNSW
			if (formValues.index_type === 'hnsw') {
				if (formValues.m) config.m = formValues.m
				if (formValues.ef_construction) config.ef_construction = formValues.ef_construction
				if (formValues.ef_search) config.ef_search = formValues.ef_search
			}

			// Add optional IVF parameters if index type is IVF
			if (formValues.index_type === 'ivf') {
				if (formValues.num_lists) config.num_lists = formValues.num_lists
				if (formValues.num_probes) config.num_probes = formValues.num_probes
			}

			const request: CreateCollectionRequest = {
				id: generatedId,
				config,
				metadata: {
					name: formValues.name,
					description: formValues.description || '',
					uid: '', // Will be set by backend
					preset: false,
					public: false,
					share: (formValues.share as 'private' | 'team') || 'team', // Default to team if not specified
					sort: 0,
					cover: '',
					document_count: 0,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}
			}

			const response = await kb.CreateCollection(request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to create collection')
			}

			message.success(is_cn ? '集合创建成功' : 'Collection created successfully')
			history.push('/kb')
		} catch (error) {
			console.error('Create collection failed:', error)
			const errorMsg = error instanceof Error ? error.message : is_cn ? '创建失败' : 'Create failed'
			message.error(errorMsg)
		} finally {
			setLoading(false)
		}
	}

	const handleBack = () => {
		history.push('/kb')
	}

	return (
		<div className={styles.container}>
			<div className={styles.breadcrumbContainer}>
				<Breadcrumb>
					<Breadcrumb.Item>
						<a
							href='/kb'
							onClick={(e) => {
								e.preventDefault()
								handleBack()
							}}
						>
							{is_cn ? '集合' : 'Collections'}
						</a>
					</Breadcrumb.Item>
					<Breadcrumb.Item>{is_cn ? '创建集合' : 'Create Collection'}</Breadcrumb.Item>
				</Breadcrumb>
				<Button
					className={styles.backButton}
					icon={<ArrowLeftOutlined style={{ fontSize: '12px' }} />}
					type='text'
					onClick={handleBack}
					title={is_cn ? '返回' : 'Back'}
				>
					{is_cn ? '返回' : 'Back'}
				</Button>
			</div>

			<div className={styles.content}>
				<Card className={styles.formCard}>
					<div className={styles.formHeader}>
						<h2 className={styles.formTitle}>{is_cn ? '新建集合' : 'New Collection'}</h2>
						<Button type='primary' onClick={handleSubmit} loading={loading}>
							{is_cn ? '创建' : 'Create'} <ArrowRightOutlined />
						</Button>
					</div>

					<div className={styles.form}>
						{/* Basic Information */}
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>
								<Icon name='material-info' size={18} />
								{is_cn ? '基本信息' : 'Basic Information'}
							</h3>

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
								<label className={styles.formLabel}>
									{is_cn ? '描述' : 'Description'}
								</label>
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
												style={{
													marginLeft: 4,
													color: 'var(--color_text_grey)'
												}}
											/>
										</Tooltip>
									</label>
									<RadioGroup
										schema={shareSchema}
										value={formValues.share}
										onChange={(value) => handleFieldChange('share', value)}
									/>
								</div>
							)}
						</div>

						{/* Vector Configuration */}
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>
								<Icon name='material-settings' size={18} />
								{is_cn ? '向量配置' : 'Vector Configuration'}
							</h3>

							<div className={styles.formItem}>
								<label className={styles.formLabel}>
									{is_cn ? '向量化模型' : 'Embedding Model'}
									<span className={styles.required}>*</span>
									<Tooltip
										title={
											is_cn
												? '选择用于文本向量化的模型，不同模型有不同的维度和性能特点'
												: 'Choose the model for text vectorization. Different models have different dimensions and performance characteristics'
										}
									>
										<InfoCircleOutlined
											style={{
												marginLeft: 4,
												color: 'var(--color_text_grey)'
											}}
										/>
									</Tooltip>
								</label>
								<ProviderSelect
									type='embedding'
									value={selectedEmbedding}
									onChange={(value) => setSelectedEmbedding(value)}
									placeholder={is_cn ? '选择向量化模型' : 'Select embedding model'}
								/>
							</div>

							<div className={styles.formRow}>
								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										{is_cn ? '距离度量' : 'Distance Metric'}
										<span className={styles.required}>*</span>
										<Tooltip
											title={
												is_cn
													? '选择向量间相似度的计算方法，影响搜索结果的准确性'
													: 'Choose how to calculate similarity between vectors, affects search accuracy'
											}
										>
											<InfoCircleOutlined
												style={{
													marginLeft: 4,
													color: 'var(--color_text_grey)'
												}}
											/>
										</Tooltip>
									</label>
									<Select
										schema={distanceSchema}
										value={formValues.distance}
										onChange={(value) => handleFieldChange('distance', value)}
									/>
								</div>

								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										{is_cn ? '索引类型' : 'Index Type'}
										<span className={styles.required}>*</span>
										<Tooltip
											title={
												is_cn
													? '选择向量索引算法，平衡搜索速度和精度，不同类型适合不同规模的数据'
													: 'Choose vector index algorithm to balance search speed and accuracy for different data scales'
											}
										>
											<InfoCircleOutlined
												style={{
													marginLeft: 4,
													color: 'var(--color_text_grey)'
												}}
											/>
										</Tooltip>
									</label>
									<Select
										schema={indexTypeSchema}
										value={formValues.index_type}
										onChange={(value) => handleFieldChange('index_type', value)}
									/>
								</div>
							</div>
						</div>

						{/* Advanced Configuration - HNSW */}
						{formValues.index_type === 'hnsw' && (
							<div className={styles.section}>
								<h3 className={styles.sectionTitle}>
									<Icon name='material-tune' size={18} />
									{is_cn ? 'HNSW 参数' : 'HNSW Parameters'}
								</h3>

								<div className={styles.formRow}>
									<div className={styles.formItem}>
										<label className={styles.formLabel}>
											M {is_cn ? '参数' : 'Parameter'}
											<Tooltip
												title={
													is_cn
														? '每个节点的双向链接数量，建议16'
														: 'Number of bidirectional links for each node, recommended 16'
												}
											>
												<InfoCircleOutlined
													style={{
														marginLeft: 4,
														color: 'var(--color_text_grey)'
													}}
												/>
											</Tooltip>
										</label>
										<InputNumber
											schema={{
												type: 'integer',
												minimum: 4,
												maximum: 64,
												placeholder: '16'
											}}
											value={formValues.m}
											onChange={(value) => handleFieldChange('m', value)}
										/>
									</div>

									<div className={styles.formItem}>
										<label className={styles.formLabel}>
											EF Construction
											<Tooltip
												title={
													is_cn
														? '构建时动态候选列表大小，建议200'
														: 'Size of dynamic candidate list during construction, recommended 200'
												}
											>
												<InfoCircleOutlined
													style={{
														marginLeft: 4,
														color: 'var(--color_text_grey)'
													}}
												/>
											</Tooltip>
										</label>
										<InputNumber
											schema={{
												type: 'integer',
												minimum: 16,
												maximum: 512,
												placeholder: '200'
											}}
											value={formValues.ef_construction}
											onChange={(value) =>
												handleFieldChange('ef_construction', value)
											}
										/>
									</div>
								</div>

								<div className={styles.formItem}>
									<label className={styles.formLabel}>
										EF Search
										<Tooltip
											title={
												is_cn
													? '搜索时动态候选列表大小，建议64'
													: 'Size of dynamic candidate list during search, recommended 64'
											}
										>
											<InfoCircleOutlined
												style={{
													marginLeft: 4,
													color: 'var(--color_text_grey)'
												}}
											/>
										</Tooltip>
									</label>
									<InputNumber
										schema={{
											type: 'integer',
											minimum: 16,
											maximum: 512,
											placeholder: '64'
										}}
										value={formValues.ef_search}
										onChange={(value) => handleFieldChange('ef_search', value)}
									/>
								</div>
							</div>
						)}

						{/* Advanced Configuration - IVF */}
						{formValues.index_type === 'ivf' && (
							<div className={styles.section}>
								<h3 className={styles.sectionTitle}>
									<Icon name='material-tune' size={18} />
									{is_cn ? 'IVF 参数' : 'IVF Parameters'}
								</h3>

								<div className={styles.formRow}>
									<div className={styles.formItem}>
										<label className={styles.formLabel}>
											{is_cn ? '聚类数量' : 'Number of Lists'}
											<Tooltip
												title={
													is_cn
														? '聚类的数量，建议100'
														: 'Number of clusters, recommended 100'
												}
											>
												<InfoCircleOutlined
													style={{
														marginLeft: 4,
														color: 'var(--color_text_grey)'
													}}
												/>
											</Tooltip>
										</label>
										<InputNumber
											schema={{
												type: 'integer',
												minimum: 1,
												maximum: 1000,
												placeholder: '100'
											}}
											value={formValues.num_lists}
											onChange={(value) =>
												handleFieldChange('num_lists', value)
											}
										/>
									</div>

									<div className={styles.formItem}>
										<label className={styles.formLabel}>
											{is_cn ? '搜索聚类数' : 'Number of Probes'}
											<Tooltip
												title={
													is_cn
														? '搜索时要探索的聚类数量，建议10'
														: 'Number of clusters to search, recommended 10'
												}
											>
												<InfoCircleOutlined
													style={{
														marginLeft: 4,
														color: 'var(--color_text_grey)'
													}}
												/>
											</Tooltip>
										</label>
										<InputNumber
											schema={{
												type: 'integer',
												minimum: 1,
												maximum: 100,
												placeholder: '10'
											}}
											value={formValues.num_probes}
											onChange={(value) =>
												handleFieldChange('num_probes', value)
											}
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				</Card>
			</div>
		</div>
	)
}

export default CreateCollection
