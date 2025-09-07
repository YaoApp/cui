import { useState } from 'react'
import { customAlphabet } from 'nanoid'
import { Button, Input, Form, Select, InputNumber, Card, message, Tooltip, Breadcrumb } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { history, getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { KB } from '@/openapi'
import type { CreateCollectionRequest, CollectionConfig } from '@/openapi/kb/types'
import ProviderSelect from '@/components/ui/Provider/Select'
import styles from './index.less'

const { TextArea } = Input
const { Option } = Select

const CreateCollection = () => {
	const [form] = Form.useForm()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [loading, setLoading] = useState(false)
	const [selectedEmbedding, setSelectedEmbedding] = useState<string>('')
	const [embeddingDimension, setEmbeddingDimension] = useState<number>(1536)

	// Distance metrics options
	const distanceOptions = [
		{
			value: 'cosine',
			label: is_cn ? '余弦距离 (推荐，适合文本向量)' : 'Cosine Distance (Recommended for text vectors)'
		},
		{
			value: 'euclidean',
			label: is_cn ? '欧几里得距离 (适合图像向量)' : 'Euclidean Distance (Good for image vectors)'
		},
		{ value: 'dot', label: is_cn ? '点积 (计算最快)' : 'Dot Product (Fastest computation)' }
	]

	// Index type options
	const indexTypeOptions = [
		{ value: 'hnsw', label: is_cn ? 'HNSW (适合大多数场景)' : 'HNSW (For most cases)' },
		{ value: 'ivf', label: is_cn ? 'IVF (适合大规模数据)' : 'IVF (For large datasets)' },
		{ value: 'flat', label: is_cn ? 'Flat (适合小数据集)' : 'Flat (For small datasets)' }
	]

	const handleSubmit = async (values: any) => {
		if (!window.$app?.openapi) {
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		setLoading(true)
		try {
			const kb = new KB(window.$app.openapi)

			// Generate unique ID based on name
			const nanoid = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 16)
			const generatedId = nanoid()

			// Parse embedding provider and option from selectedEmbedding
			// Format: "providerId|optionValue"
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
				distance: values.distance,
				index_type: values.index_type
			}

			// Add optional HNSW parameters if index type is HNSW
			if (values.index_type === 'hnsw') {
				if (values.m) config.m = values.m
				if (values.ef_construction) config.ef_construction = values.ef_construction
				if (values.ef_search) config.ef_search = values.ef_search
			}

			// Add optional IVF parameters if index type is IVF
			if (values.index_type === 'ivf') {
				if (values.num_lists) config.num_lists = values.num_lists
				if (values.num_probes) config.num_probes = values.num_probes
			}

			const request: CreateCollectionRequest = {
				id: generatedId,
				config,
				metadata: {
					name: values.name,
					description: values.description || '',
					uid: '', // Will be set by backend
					readonly: false,
					system: false,
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
						<Button
							type='primary'
							onClick={() => form.submit()}
							htmlType='submit'
							loading={loading}
						>
							{is_cn ? '创建' : 'Create'} <ArrowRightOutlined />
						</Button>
					</div>
					<Form
						form={form}
						layout='vertical'
						onFinish={handleSubmit}
						className={styles.form}
						initialValues={{
							distance: 'cosine',
							index_type: 'hnsw',
							m: 16,
							ef_construction: 200,
							ef_search: 64,
							num_lists: 100,
							num_probes: 10
						}}
					>
						{/* Basic Information */}
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>
								<Icon name='material-info' size={18} />
								{is_cn ? '基本信息' : 'Basic Information'}
							</h3>

							<Form.Item
								name='name'
								label={is_cn ? '集合名称' : 'Collection Name'}
								rules={[
									{
										required: true,
										message: is_cn
											? '请输入集合名称'
											: 'Please enter collection name'
									}
								]}
							>
								<Input
									placeholder={
										is_cn ? '输入集合显示名称' : 'Enter collection display name'
									}
								/>
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
						</div>

						{/* Vector Configuration */}
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>
								<Icon name='material-settings' size={18} />
								{is_cn ? '向量配置' : 'Vector Configuration'}
							</h3>

							<Form.Item
								name='embedding_provider'
								label={
									<span>
										{is_cn ? '向量化模型' : 'Embedding Model'}
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
									</span>
								}
								rules={[
									{
										required: true,
										message: is_cn
											? '请选择向量化模型'
											: 'Please select embedding model'
									}
								]}
							>
								<ProviderSelect
									type='embedding'
									value={selectedEmbedding}
									onChange={(value) => {
										setSelectedEmbedding(value)
										form.setFieldsValue({ embedding_provider: value })
									}}
									placeholder={is_cn ? '选择向量化模型' : 'Select embedding model'}
								/>
							</Form.Item>

							<Form.Item
								name='distance'
								label={
									<span>
										{is_cn ? '距离度量' : 'Distance Metric'}
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
									</span>
								}
								rules={[
									{
										required: true,
										message: is_cn
											? '请选择距离度量'
											: 'Please select distance metric'
									}
								]}
							>
								<Select
									placeholder={
										is_cn ? '选择距离度量方法' : 'Select distance metric'
									}
								>
									{distanceOptions.map((option) => (
										<Option key={option.value} value={option.value}>
											{option.label}
										</Option>
									))}
								</Select>
							</Form.Item>

							<Form.Item
								name='index_type'
								label={
									<span>
										{is_cn ? '索引类型' : 'Index Type'}
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
									</span>
								}
								rules={[
									{
										required: true,
										message: is_cn
											? '请选择索引类型'
											: 'Please select index type'
									}
								]}
							>
								<Select placeholder={is_cn ? '选择索引类型' : 'Select index type'}>
									{indexTypeOptions.map((option) => (
										<Option key={option.value} value={option.value}>
											{option.label}
										</Option>
									))}
								</Select>
							</Form.Item>
						</div>

						{/* Advanced Configuration */}
						<Form.Item
							noStyle
							shouldUpdate={(prevValues, currentValues) =>
								prevValues.index_type !== currentValues.index_type
							}
						>
							{({ getFieldValue }) => {
								const indexType = getFieldValue('index_type')

								if (indexType === 'hnsw') {
									return (
										<div className={styles.section}>
											<h3 className={styles.sectionTitle}>
												<Icon name='material-tune' size={18} />
												{is_cn ? 'HNSW 参数' : 'HNSW Parameters'}
											</h3>

											<Form.Item
												name='m'
												label={
													<span>
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
													</span>
												}
											>
												<InputNumber
													style={{ width: '100%' }}
													min={4}
													max={64}
													placeholder='16'
												/>
											</Form.Item>

											<Form.Item
												name='ef_construction'
												label={
													<span>
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
													</span>
												}
											>
												<InputNumber
													style={{ width: '100%' }}
													min={16}
													max={512}
													placeholder='200'
												/>
											</Form.Item>

											<Form.Item
												name='ef_search'
												label={
													<span>
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
													</span>
												}
											>
												<InputNumber
													style={{ width: '100%' }}
													min={16}
													max={512}
													placeholder='64'
												/>
											</Form.Item>
										</div>
									)
								}

								if (indexType === 'ivf') {
									return (
										<div className={styles.section}>
											<h3 className={styles.sectionTitle}>
												<Icon name='material-tune' size={18} />
												{is_cn ? 'IVF 参数' : 'IVF Parameters'}
											</h3>

											<Form.Item
												name='num_lists'
												label={
													<span>
														{is_cn
															? '聚类数量'
															: 'Number of Lists'}
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
													</span>
												}
											>
												<InputNumber
													style={{ width: '100%' }}
													min={1}
													max={1000}
													placeholder='100'
												/>
											</Form.Item>

											<Form.Item
												name='num_probes'
												label={
													<span>
														{is_cn
															? '搜索聚类数'
															: 'Number of Probes'}
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
													</span>
												}
											>
												<InputNumber
													style={{ width: '100%' }}
													min={1}
													max={100}
													placeholder='10'
												/>
											</Form.Item>
										</div>
									)
								}

								return null
							}}
						</Form.Item>
					</Form>
				</Card>
			</div>
		</div>
	)
}

export default CreateCollection
