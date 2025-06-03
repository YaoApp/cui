import { getLocale } from '@umijs/max'
import { Input, Spin } from 'antd'
import { useState, useEffect, useMemo } from 'react'
import { useMemoizedFn } from 'ahooks'
import Icon from '@/widgets/Icon'
import { ResourceChildProps } from '../index'
import { Collections, Files } from './types'
import { mockFetchCollections, mockFetchFiles } from './mockData'
import styles from './index.less'

const KnowledgeBase = (props: ResourceChildProps) => {
	const { onItemSelect, onItemDeselect, selectedItems } = props
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 状态管理
	const [collections, setCollections] = useState<Collections[]>([])
	const [files, setFiles] = useState<Files[]>([])
	const [activeCollection, setActiveCollection] = useState<string>('')
	const [selectedCollection, setSelectedCollection] = useState<Collections | null>(null)
	const [searchKeyword, setSearchKeyword] = useState('')
	const [collectionSearchKeyword, setCollectionSearchKeyword] = useState('')
	const [loadingCollections, setLoadingCollections] = useState(true)
	const [loadingFiles, setLoadingFiles] = useState(false)

	// 整体加载状态：集合加载中 OR 初次文件加载中
	const isInitialLoading = loadingCollections

	// 文件状态图标映射
	const getFileStatusIcon = (status: string): string => {
		const iconMap: Record<string, string> = {
			uploaded: 'material-cloud_upload',
			indexing: 'material-sync',
			indexed: 'material-check_circle',
			upload_failed: 'material-error',
			index_failed: 'material-warning'
		}
		return iconMap[status] || 'material-help_outline'
	}

	// 文件状态颜色映射
	const getFileStatusColor = (status: string): string => {
		const colorMap: Record<string, string> = {
			uploaded: 'var(--color_main)',
			indexing: 'var(--color_warning)',
			indexed: 'var(--color_success)',
			upload_failed: 'var(--color_error)',
			index_failed: 'var(--color_warning)'
		}
		return colorMap[status] || 'var(--color_text_grey)'
	}

	// 文件大小格式化
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	// 加载集合数据
	useEffect(() => {
		const loadCollections = async () => {
			try {
				setLoadingCollections(true)
				const data = await mockFetchCollections()
				setCollections(data)
			} catch (error) {
				console.error('Failed to load collections:', error)
			} finally {
				setLoadingCollections(false)
			}
		}

		loadCollections()
	}, [])

	// 加载文件数据
	const loadFiles = useMemoizedFn(async (collectionId: string) => {
		if (!collectionId) return

		try {
			setLoadingFiles(true)
			const data = await mockFetchFiles(collectionId)
			setFiles(data)
		} catch (error) {
			console.error('Failed to load files:', error)
		} finally {
			setLoadingFiles(false)
		}
	})

	// 过滤后的文件列表
	const filteredFiles = useMemo(() => {
		if (!searchKeyword.trim()) return files

		const keyword = searchKeyword.toLowerCase()
		return files.filter(
			(file) =>
				file.name.toLowerCase().includes(keyword) || file.content_type.toLowerCase().includes(keyword)
		)
	}, [files, searchKeyword])

	// 过滤后的集合列表
	const filteredCollections = useMemo(() => {
		if (!collectionSearchKeyword.trim()) return collections

		const keyword = collectionSearchKeyword.toLowerCase()
		return collections.filter(
			(collection) =>
				collection.name.toLowerCase().includes(keyword) ||
				collection.description.toLowerCase().includes(keyword)
		)
	}, [collections, collectionSearchKeyword])

	// 获取选中的文件ID集合
	const selectedFileIds = useMemo(() => {
		return new Set(selectedItems.filter((item) => item.type === 'knowledgeBase').map((item) => item.value))
	}, [selectedItems])

	// 获取选中的集合ID集合
	const selectedCollectionIds = useMemo(() => {
		return new Set(
			selectedItems
				.filter((item) => item.type === 'knowledgeBase')
				.map((item) => item.value)
				.filter((value) => collections.some((col) => col.id === value))
		)
	}, [selectedItems, collections])

	// 处理集合点击（展示文件）
	const handleCollectionClick = useMemoizedFn((collection: Collections) => {
		setSelectedCollection(collection)
		setActiveCollection(collection.id)
		setSearchKeyword('')
		loadFiles(collection.id)
	})

	// 处理集合选择（RadioBox点击）
	const handleCollectionSelect = useMemoizedFn((collection: Collections, e: React.MouseEvent) => {
		e.stopPropagation() // 阻止冒泡到卡片点击事件

		const isSelected = selectedCollectionIds.has(collection.id)

		if (isSelected) {
			// 已选中的集合，取消选择
			onItemDeselect(collection.id)
			return
		}

		// 选中集合
		onItemSelect({
			value: collection.id,
			label: collection.name
		})
	})

	// 处理文件选择
	const handleFileSelect = useMemoizedFn((file: Files) => {
		// 上传失败或索引失败的文件不可选择
		if (file.status === 'upload_failed' || file.status === 'index_failed') {
			return
		}

		const isSelected = selectedFileIds.has(file.file_id)

		if (isSelected) {
			// 已选中的文件，取消选择
			onItemDeselect(file.file_id)
			return
		}

		// 选中当前文件
		onItemSelect({
			value: file.file_id,
			label: file.name
		})
	})

	// 渲染集合列表
	const renderCollections = () => {
		if (collections.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-folder_off' size={48} />
					<div className={styles.emptyTitle}>{is_cn ? '暂无知识库' : 'No Knowledge Base'}</div>
					<div className={styles.emptyDescription}>
						{is_cn ? '还没有可用的知识库' : 'No knowledge base available'}
					</div>
				</div>
			)
		}

		if (filteredCollections.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-search_off' size={48} />
					<div className={styles.emptyTitle}>{is_cn ? '未找到匹配项' : 'No Results'}</div>
					<div className={styles.emptyDescription}>
						{is_cn
							? '没有找到与搜索条件匹配的知识库'
							: 'No knowledge base match your search criteria'}
					</div>
				</div>
			)
		}

		return (
			<div className={styles.collectionsList}>
				{filteredCollections.map((collection) => {
					const isSelected = selectedCollectionIds.has(collection.id)

					return (
						<div
							key={collection.id}
							className={`${styles.collectionCard} ${isSelected ? styles.selected : ''}`}
							onClick={() => handleCollectionClick(collection)}
						>
							<div className={styles.collectionCover}>
								<img src={collection.cover} alt={collection.name} />
							</div>
							<div className={styles.collectionInfo}>
								<div
									className={styles.collectionTitle}
									onClick={(e) => handleCollectionSelect(collection, e)}
								>
									<h5 className={styles.collectionName}>{collection.name}</h5>
									<Icon
										name='material-check_circle'
										size={16}
										className={styles.checkIcon}
										style={{
											color: isSelected
												? 'var(--color_main)'
												: 'var(--color_text_grey)'
										}}
									/>
								</div>
								<p className={styles.collectionDescription}>{collection.description}</p>
								<div className={styles.collectionMeta}>
									<Icon name='material-description' size={12} />
									<span>
										{collection.total} {is_cn ? '个文件' : 'files'}
									</span>
								</div>
							</div>
						</div>
					)
				})}
			</div>
		)
	}

	// 渲染文件卡片
	const renderFileCard = (file: Files) => {
		const isSelected = selectedFileIds.has(file.file_id)
		const isDisabled = file.status === 'upload_failed' || file.status === 'index_failed'

		return (
			<div
				key={file.file_id}
				className={`${styles.fileCard} ${isSelected ? styles.selected : ''} ${
					isDisabled ? styles.disabled : ''
				}`}
				onClick={() => handleFileSelect(file)}
				style={{
					cursor: isDisabled ? 'not-allowed' : 'pointer',
					opacity: isDisabled ? 0.5 : 1
				}}
			>
				{/* 文件头部 */}
				<div className={styles.fileHeader}>
					<Icon name='material-description' size={20} className={styles.fileIcon} />
					<div className={styles.fileInfo}>
						<h5 className={styles.fileName}>{file.name}</h5>
						<p className={styles.fileType}>{file.content_type}</p>
					</div>
					<Icon
						name='material-check_circle'
						size={16}
						className={styles.checkIcon}
						style={{
							opacity: isDisabled ? 0.3 : 1
						}}
					/>
				</div>

				{/* 文件详情 */}
				<div className={styles.fileDetails}>
					<div className={styles.fileMetaList}>
						<div className={styles.fileMeta}>
							<Icon name='material-data_usage' size={12} />
							<span>{formatFileSize(file.bytes)}</span>
						</div>
						<div className={styles.fileMeta}>
							<Icon
								name={getFileStatusIcon(file.status)}
								size={12}
								style={{ color: getFileStatusColor(file.status) }}
							/>
							<span style={{ color: getFileStatusColor(file.status) }}>
								{is_cn
									? file.status === 'uploaded'
										? '已上传'
										: file.status === 'indexing'
										? '索引中'
										: file.status === 'indexed'
										? '已索引'
										: file.status === 'upload_failed'
										? '上传失败'
										: '索引失败'
									: file.status.replace('_', ' ').toUpperCase()}
							</span>
						</div>
						{file.public && (
							<div className={styles.fileMeta}>
								<Icon name='material-public' size={12} />
								<span>{is_cn ? '公开' : 'Public'}</span>
							</div>
						)}
					</div>
				</div>
			</div>
		)
	}

	// 渲染文件列表
	const renderFiles = () => {
		if (loadingFiles) {
			return (
				<div className={styles.filesLoadingState}>
					<Spin />
					<div className={styles.loadingText}>{is_cn ? '加载文件中...' : 'Loading files...'}</div>
				</div>
			)
		}

		if (files.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-description' size={48} />
					<div className={styles.emptyTitle}>{is_cn ? '暂无文件' : 'No Files'}</div>
					<div className={styles.emptyDescription}>
						{is_cn ? '当前集合中没有可用的文件' : 'No files available in current collection'}
					</div>
				</div>
			)
		}

		if (filteredFiles.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-search_off' size={48} />
					<div className={styles.emptyTitle}>{is_cn ? '未找到匹配项' : 'No Results'}</div>
					<div className={styles.emptyDescription}>
						{is_cn ? '没有找到与搜索条件匹配的文件' : 'No files match your search criteria'}
					</div>
				</div>
			)
		}

		return <div className={styles.filesList}>{filteredFiles.map(renderFileCard)}</div>
	}

	// 初始加载状态
	if (isInitialLoading) {
		return (
			<div className={styles.knowledgeBaseContent}>
				<div className={styles.loadingState}>
					<Spin />
					<div className={styles.loadingText}>
						{is_cn ? '正在加载知识库...' : 'Loading knowledge base...'}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.knowledgeBaseContent}>
			{/* 知识库列表面板 */}
			<div className={styles.collectionsPanel}>
				<div className={styles.collectionsHeader}>
					<h4>{is_cn ? '知识库' : 'Knowledge Base'}</h4>
					{filteredCollections.length > 0 && (
						<span className={styles.collectionCount}>{filteredCollections.length}</span>
					)}
				</div>
				<div className={styles.collectionsSearch}>
					<Input
						placeholder={is_cn ? '搜索知识库...' : 'Search knowledge base...'}
						value={collectionSearchKeyword}
						onChange={(e) => setCollectionSearchKeyword(e.target.value)}
						prefix={<Icon name='material-search' size={14} />}
						allowClear
					/>
				</div>
				<div className={styles.collectionsContent}>{renderCollections()}</div>
			</div>

			{/* 文件列表面板 */}
			<div className={styles.filesPanel}>
				<div className={styles.filesHeader}>
					<div className={styles.headerLeft}>
						<Icon name='material-folder' size={16} />
						<h4>{selectedCollection?.name || (is_cn ? '文件列表' : 'Files')}</h4>
						{filteredFiles.length > 0 && (
							<span className={styles.fileCount}>{filteredFiles.length}</span>
						)}
					</div>
					{selectedCollection && (
						<div className={styles.searchBox}>
							<Input
								placeholder={is_cn ? '搜索文件...' : 'Search files...'}
								value={searchKeyword}
								onChange={(e) => setSearchKeyword(e.target.value)}
								prefix={<Icon name='material-search' size={14} />}
								allowClear
							/>
						</div>
					)}
				</div>
				<div className={styles.filesContent}>
					{selectedCollection ? (
						renderFiles()
					) : (
						<div className={styles.emptyState}>
							<Icon name='material-touch_app' size={48} />
							<div className={styles.emptyTitle}>
								{is_cn ? '选择知识库' : 'Select Knowledge Base'}
							</div>
							<div className={styles.emptyDescription}>
								{is_cn
									? '请从左侧选择一个知识库来查看文件'
									: 'Please select a knowledge base from the left to view files'}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default window.$app.memo(KnowledgeBase)
