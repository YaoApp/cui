import { getLocale } from '@umijs/max'
import { Input, Spin, Tooltip } from 'antd'
import { useState, useEffect, useMemo } from 'react'
import { useMemoizedFn } from 'ahooks'
import Icon from '@/widgets/Icon'
import { ResourceChildProps } from '../index'
import { Collection, Item, Field } from './types'
import { mockFetchCollections, mockFetchDataModels } from './mockData'
import DataModelDetailModal from './DetailModal'
import styles from './index.less'

const DataModel = (props: ResourceChildProps) => {
	const { onItemSelect, selectedItems } = props
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 状态管理
	const [collections, setCollections] = useState<Collection[]>([])
	const [models, setModels] = useState<Item[]>([])
	const [activeCollection, setActiveCollection] = useState<string>('')
	const [searchKeyword, setSearchKeyword] = useState('')
	const [loadingCollections, setLoadingCollections] = useState(true)
	const [loadingModels, setLoadingModels] = useState(false)

	// 详情模态窗状态
	const [detailModalVisible, setDetailModalVisible] = useState(false)
	const [selectedModel, setSelectedModel] = useState<Item | null>(null)

	// 整体加载状态：集合加载中 OR 初次模型加载中
	const isInitialLoading = loadingCollections || (activeCollection && loadingModels && models.length === 0)

	// 字段类型图标映射
	const getFieldTypeIcon = (type: string): string => {
		const iconMap: Record<string, string> = {
			ID: 'material-key',
			string: 'material-text_fields',
			integer: 'material-numbers',
			float: 'material-decimal_increase',
			decimal: 'material-monetization_on',
			datetime: 'material-schedule',
			date: 'material-calendar_today',
			time: 'material-access_time',
			boolean: 'material-toggle_on',
			json: 'material-data_object',
			text: 'material-notes',
			longtext: 'material-description',
			binary: 'material-attachment',
			enum: 'material-list'
		}
		return iconMap[type] || 'material-help_outline'
	}

	// 加载集合数据
	useEffect(() => {
		const loadCollections = async () => {
			try {
				setLoadingCollections(true)
				const data = await mockFetchCollections()
				setCollections(data)
				if (data.length > 0) {
					setActiveCollection(data[0].id)
				}
			} catch (error) {
				console.error('Failed to load collections:', error)
			} finally {
				setLoadingCollections(false)
			}
		}

		loadCollections()
	}, [])

	// 加载数据模型
	useEffect(() => {
		if (!activeCollection) return

		const loadModels = async () => {
			try {
				setLoadingModels(true)
				const data = await mockFetchDataModels(activeCollection)
				setModels(data)
			} catch (error) {
				console.error('Failed to load models:', error)
			} finally {
				setLoadingModels(false)
			}
		}

		loadModels()
	}, [activeCollection])

	// 过滤后的模型列表
	const filteredModels = useMemo(() => {
		if (!searchKeyword.trim()) return models

		const keyword = searchKeyword.toLowerCase()
		return models.filter(
			(model) =>
				model.name.toLowerCase().includes(keyword) ||
				model.description.toLowerCase().includes(keyword) ||
				model.fields.some(
					(field) =>
						field.name.toLowerCase().includes(keyword) ||
						field.label.toLowerCase().includes(keyword)
				)
		)
	}, [models, searchKeyword])

	// 获取选中的模型ID集合
	const selectedModelIds = useMemo(() => {
		return new Set(selectedItems.filter((item) => item.type === 'dataModel').map((item) => item.value))
	}, [selectedItems])

	// 处理集合切换
	const handleCollectionChange = useMemoizedFn((collectionId: string) => {
		setActiveCollection(collectionId)
		setSearchKeyword('')
	})

	// 处理模型选择
	const handleModelSelect = useMemoizedFn((model: Item) => {
		const isSelected = selectedModelIds.has(model.id)

		if (isSelected) {
			// 取消选中（不处理关联）
			return
		}

		// 选中当前模型
		onItemSelect({
			value: model.id,
			label: model.name
		})

		// 自动选中关联的模型
		if (model.relations.length > 0) {
			const relatedModelIds = model.relations.map((rel) => rel.model)
			const currentCollectionModels = models.filter((m) => relatedModelIds.includes(m.id))

			currentCollectionModels.forEach((relatedModel) => {
				if (!selectedModelIds.has(relatedModel.id)) {
					onItemSelect({
						value: relatedModel.id,
						label: relatedModel.name
					})
				}
			})
		}
	})

	// 处理查看详情
	const handleViewDetail = useMemoizedFn((model: Item, e: React.MouseEvent) => {
		e.stopPropagation()
		setSelectedModel(model)
		setDetailModalVisible(true)
	})

	// 关闭详情模态窗
	const handleCloseDetail = useMemoizedFn(() => {
		setDetailModalVisible(false)
		setSelectedModel(null)
	})

	// 渲染集合列表
	const renderCollections = () => {
		if (collections.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-folder_off' size={48} />
					<div className={styles.emptyTitle}>{is_cn ? '暂无集合' : 'No Collections'}</div>
					<div className={styles.emptyDescription}>
						{is_cn ? '还没有可用的数据模型集合' : 'No data model collections available'}
					</div>
				</div>
			)
		}

		return (
			<div className={styles.collectionsList}>
				{collections.map((collection) => (
					<Tooltip key={collection.id} title={collection.description} placement='left'>
						<div
							className={`${styles.collectionItem} ${
								activeCollection === collection.id ? styles.active : ''
							}`}
							onClick={() => handleCollectionChange(collection.id)}
						>
							<Icon name={collection.icon || 'material-folder'} size={16} />
							<span className={styles.collectionName}>{collection.name}</span>
						</div>
					</Tooltip>
				))}
			</div>
		)
	}

	// 渲染模型卡片
	const renderModelCard = (model: Item) => {
		const isSelected = selectedModelIds.has(model.id)
		// 只显示前3个字段，不需要展开功能
		const previewFields = model.fields.slice(0, 3)

		return (
			<div
				key={model.id}
				className={`${styles.modelCard} ${isSelected ? styles.selected : ''}`}
				onClick={() => handleModelSelect(model)}
				onDoubleClick={(e) => handleViewDetail(model, e)}
				title={is_cn ? '点击选择，双击查看详情' : 'Click to select, double click for details'}
			>
				{/* 模型头部 */}
				<div className={styles.modelHeader}>
					<Icon
						name={model.icon || 'material-table_chart'}
						size={20}
						className={styles.modelIcon}
					/>
					<div className={styles.modelInfo}>
						<h5 className={styles.modelName}>{model.name}</h5>
						<p className={styles.modelDescription}>{model.description}</p>
					</div>
					<Icon name='material-check_circle' size={16} className={styles.checkIcon} />
				</div>

				{/* 字段预览 - 只显示前3个 */}
				<div className={styles.fieldsPreview}>
					<div className={styles.fieldsList}>
						{previewFields.map((field) => (
							<div key={field.name} className={styles.fieldItem}>
								<Icon name={getFieldTypeIcon(field.type)} size={12} />
								<span className={styles.fieldName}>{field.label}</span>
							</div>
						))}
						{model.fields.length > 3 && (
							<div className={styles.fieldItem}>
								<Icon name='material-more_horiz' size={12} />
								<span>+{model.fields.length - 3}</span>
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	// 渲染模型列表
	const renderModels = () => {
		// 只在切换集合时显示模型区域loading（非初始加载）
		if (loadingModels && !isInitialLoading) {
			return (
				<div className={styles.modelsLoadingState}>
					<Spin />
					<div className={styles.loadingText}>
						{is_cn ? '加载数据模型中...' : 'Loading models...'}
					</div>
				</div>
			)
		}

		if (models.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-table_chart' size={48} />
					<div className={styles.emptyTitle}>{is_cn ? '暂无数据模型' : 'No Data Models'}</div>
					<div className={styles.emptyDescription}>
						{is_cn
							? '当前集合中没有可用的数据模型'
							: 'No data models available in current collection'}
					</div>
				</div>
			)
		}

		if (filteredModels.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-search_off' size={48} />
					<div className={styles.emptyTitle}>{is_cn ? '未找到匹配项' : 'No Results'}</div>
					<div className={styles.emptyDescription}>
						{is_cn
							? '没有找到与搜索条件匹配的数据模型'
							: 'No data models match your search criteria'}
					</div>
				</div>
			)
		}

		return <div className={styles.modelsList}>{filteredModels.map(renderModelCard)}</div>
	}

	// 获取当前集合信息
	const currentCollection = collections.find((c) => c.id === activeCollection)

	// 初始加载状态：等集合和第一个集合的模型都加载完成
	if (isInitialLoading) {
		return (
			<div className={styles.dataModelContent}>
				<div className={styles.loadingState}>
					<Spin />
					<div className={styles.loadingText}>
						{loadingCollections
							? is_cn
								? '正在加载数据集合...'
								: 'Loading collections...'
							: is_cn
							? '正在加载数据模型...'
							: 'Loading models...'}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.dataModelContent}>
			{/* 左侧集合列表 */}
			<div className={styles.collectionsPanel}>
				<div className={styles.collectionsHeader}>
					<h4>{is_cn ? '数据集合' : 'Collections'}</h4>
				</div>
				{renderCollections()}
			</div>

			{/* 右侧数据模型列表 */}
			<div className={styles.modelsPanel}>
				<div className={styles.modelsHeader}>
					<div className={styles.headerLeft}>
						<h4>{currentCollection?.name || (is_cn ? '数据模型' : 'Data Models')}</h4>
						{filteredModels.length > 0 && (
							<span className={styles.modelCount}>{filteredModels.length}</span>
						)}
					</div>
					<div className={styles.searchBox}>
						<Input
							placeholder={is_cn ? '搜索数据模型...' : 'Search models...'}
							value={searchKeyword}
							onChange={(e) => setSearchKeyword(e.target.value)}
							prefix={<Icon name='material-search' size={14} />}
							allowClear
						/>
					</div>
				</div>
				<div className={styles.modelsContent}>{renderModels()}</div>
			</div>

			{/* 数据模型详情模态窗 */}
			<DataModelDetailModal
				visible={detailModalVisible}
				onClose={handleCloseDetail}
				model={selectedModel}
			/>
		</div>
	)
}

export default window.$app.memo(DataModel)
