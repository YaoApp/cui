import React, { useState, useEffect } from 'react'
import { Button, Tooltip, Input, message, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { mockChunksData } from '../mockData'
import ChunkDetail from './detail'
import styles from '../Layout/index.less'

interface ChunkData {
	id: string
	text: string
	weight: number
	recall_count: number
	upvotes: number
	downvotes: number
	source_page?: number
	source_line?: number
	text_length: number
	max_length: number
	metadata?: Record<string, any>
}

interface ChunksProps {
	viewMode: 'dual' | 'left' | 'right'
	onHideLeftPanel: () => void
	onRestoreDualPanels: () => void
	docid: string
	collectionId: string
}

const Chunks: React.FC<ChunksProps> = ({ viewMode, onHideLeftPanel, onRestoreDualPanels, docid, collectionId }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [data, setData] = useState<ChunkData[]>([])
	const [search, setSearch] = useState('')
	const [searchText, setSearchText] = useState('')
	const [loading, setLoading] = useState(true)
	const [sortBy, setSortBy] = useState<string>('default')
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(12)
	const [detailVisible, setDetailVisible] = useState(false)
	const [selectedChunk, setSelectedChunk] = useState<any>(null)

	// 根据文档ID加载切片数据
	useEffect(() => {
		const loadChunks = async () => {
			try {
				setLoading(true)
				// 模拟加载时间
				await new Promise((resolve) => setTimeout(resolve, 800))

				// 模拟切片数据 - 更多丰富内容
				const chunkTexts = [
					'这是文档中的第1个文本切片。本段落详细介绍了系统的核心功能和主要特性。系统采用了先进的架构设计，确保高可用性和良好的扩展性。通过模块化的设计理念，各个组件之间保持松耦合的关系，便于后续的维护和升级。系统支持多种数据格式的处理，包括JSON、XML、CSV等常见格式，同时提供了灵活的数据转换和映射功能。',
					'第2个切片包含了用户界面设计的相关内容。界面设计遵循现代化的用户体验原则，采用响应式布局确保在不同设备上都能提供良好的用户体验。色彩搭配和字体选择都经过精心设计，符合无障碍访问标准。界面组件采用组件化开发模式，提高了代码的复用性和维护性。导航设计直观清晰，用户可以快速找到所需功能。',
					'第3个切片描述了数据处理流程和算法实现。系统使用了多种先进的数据处理技术，包括实时数据流处理、批量数据分析和机器学习算法。这些技术的结合使得系统能够快速准确地处理大量数据并提供有价值的洞察。数据处理管道支持并行计算，大大提高了处理效率。同时集成了数据质量监控机制，确保数据的准确性和完整性。',
					'第4个切片涵盖了安全性和权限管理方面的内容。系统实现了多层次的安全防护机制，包括身份认证、访问控制、数据加密和审计日志。通过细粒度的权限管理，确保用户只能访问其被授权的资源和功能。采用了OAuth2.0和JWT令牌机制，提供了安全可靠的身份验证服务。所有敏感数据都经过加密存储，传输过程中使用HTTPS协议保护。',
					'第5个切片介绍了API接口的设计和使用方法。API采用RESTful设计风格，提供了完整的CRUD操作接口。所有接口都支持JSON格式的数据交换，并提供了详细的错误码和错误信息。开发者可以通过这些接口轻松集成系统功能。API支持版本管理，确保向后兼容性。提供了完整的API文档和SDK，降低了开发者的集成成本。同时支持GraphQL查询语言，满足复杂数据查询需求。',
					'第6个切片讲述了系统的部署和运维相关内容。系统支持容器化部署，可以在Docker环境中快速启动。同时提供了完整的监控和日志系统，帮助运维人员及时发现和解决问题。支持水平扩展以应对业务增长的需求。集成了CI/CD流水线，实现了自动化部署和测试。支持多云部署，可以在AWS、Azure、阿里云等主流云平台上运行。',
					'第7个切片描述了数据库设计和优化策略。系统采用了关系型数据库和非关系型数据库的混合架构，针对不同类型的数据选择最适合的存储方案。通过索引优化、查询优化和缓存机制，确保系统的高性能表现。数据库支持主从复制和读写分离，提高了系统的可用性和性能。实现了数据库连接池管理，优化了连接资源的使用。支持数据库迁移和备份恢复功能。',
					'第8个切片介绍了系统的集成能力和扩展性。系统提供了丰富的集成接口，可以与第三方系统无缝对接。支持插件化架构，允许开发者根据业务需求开发和部署自定义功能模块。这种设计保证了系统的灵活性和可扩展性。支持事件驱动架构，实现了系统间的松耦合集成。提供了消息队列机制，支持异步处理和负载均衡。集成了主流的企业级应用，如ERP、CRM、OA系统等。',
					'第9个切片涵盖了用户培训和技术支持相关内容。系统提供了完整的用户手册和在线帮助文档。同时建立了专业的技术支持团队，为用户提供及时的技术咨询和问题解决方案。定期组织用户培训活动，确保用户能够充分发挥系统的价值。提供了在线教学视频和实践案例，帮助用户快速上手。建立了用户社区，促进用户间的经验交流和分享。',
					'第10个切片描述了系统的未来发展规划和技术路线图。基于用户反馈和市场需求，系统将持续进行功能增强和技术升级。计划引入人工智能和大数据分析技术，提供更智能的决策支持。同时加强移动端的支持，满足移动办公的需求。将探索区块链技术的应用，提高数据的可信度和安全性。计划开发低代码平台，降低定制开发的门槛。',
					'第11个切片详细说明了系统的配置管理和环境设置。系统支持多环境部署，包括开发、测试和生产环境。通过配置文件的方式管理不同环境的参数设置，确保环境之间的一致性。支持热配置更新，无需重启服务即可应用新的配置。提供了配置管理界面，简化了配置操作。支持配置版本管理和回滚功能，确保配置变更的安全性。集成了配置中心，实现了配置的集中管理和分发。',
					'第12个切片介绍了系统的性能监控和调优方法。内置了全面的性能监控工具，可以实时监控系统的运行状态和性能指标。提供了性能分析报告和优化建议，帮助运维人员持续改善系统性能。支持分布式链路追踪，便于定位性能瓶颈。集成了APM工具，提供了详细的应用性能监控。支持自定义监控指标和告警规则，满足不同场景的监控需求。提供了性能压测工具，帮助评估系统的承载能力。',
					'第13个切片描述了系统的多语言支持和国际化功能。系统内置了完整的国际化框架，支持多种语言的动态切换。提供了完善的翻译管理工具，可以方便地进行多语言内容的管理和维护。支持从右到左的文字布局，适配阿拉伯语等特殊语言需求。',
					'第14个切片介绍了系统的报表和数据分析功能。提供了丰富的报表模板和自定义报表生成工具。支持多种图表类型，包括柱状图、折线图、饼图、散点图等。集成了数据挖掘算法，可以自动发现数据中的规律和趋势。支持报表的定时生成和自动推送功能。',
					'第15个切片描述了系统的工作流引擎和业务流程管理。内置了强大的工作流引擎，支持复杂业务流程的建模和执行。提供了可视化的流程设计器，业务人员可以直观地设计和修改业务流程。支持条件分支、并行处理、循环等复杂的流程控制结构。',
					'第16个切片介绍了系统的消息中心和通知功能。支持多种消息类型，包括系统通知、业务提醒、告警信息等。集成了邮件、短信、微信等多种消息推送渠道。提供了消息模板管理功能，可以快速配置各种消息格式。支持消息的批量发送和定时推送。',
					'第17个切片描述了系统的文件管理和存储功能。支持多种文件格式的上传、下载和在线预览。提供了版本控制功能，可以追踪文件的修改历史。集成了文件压缩和解压功能，节省存储空间。支持文件的加密存储，确保敏感数据的安全性。',
					'第18个切片介绍了系统的定时任务和调度功能。内置了强大的任务调度引擎，支持cron表达式和可视化的时间配置。提供了任务执行历史的查询和统计功能。支持任务的依赖关系配置，可以实现复杂的任务编排。集成了任务监控和告警功能，及时发现任务执行异常。'
				]

				const mockChunks: ChunkData[] = chunkTexts.map((text, index) => {
					const maxLength = 2000
					return {
						id: `chunk_${index + 1}`,
						text: text,
						weight: Math.random() * 100,
						recall_count: Math.floor(Math.random() * 50) + 1,
						upvotes: Math.floor(Math.random() * 20),
						downvotes: Math.floor(Math.random() * 5),
						source_page: Math.floor(Math.random() * 50) + 1,
						source_line: Math.floor(Math.random() * 100) + 1,
						text_length: text.length,
						max_length: maxLength,
						metadata: {
							category: [
								'技术文档',
								'用户手册',
								'API说明',
								'产品介绍',
								'系统设计',
								'运维指南'
							][Math.floor(Math.random() * 6)]
						}
					}
				})

				setData(mockChunks)
			} catch (error) {
				message.error(is_cn ? '加载切片数据失败' : 'Failed to load chunks')
			} finally {
				setLoading(false)
			}
		}

		loadChunks()
	}, [docid, collectionId, is_cn])

	// 搜索处理
	const handleSearch = () => {
		setSearchText(search)
		setCurrentPage(1) // 搜索时重置到第一页
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	// 投票处理
	const handleVote = (chunkId: string, type: 'up' | 'down') => {
		setData((prevData) =>
			prevData.map((chunk) =>
				chunk.id === chunkId
					? {
							...chunk,
							upvotes: type === 'up' ? chunk.upvotes + 1 : chunk.upvotes,
							downvotes: type === 'down' ? chunk.downvotes + 1 : chunk.downvotes
					  }
					: chunk
			)
		)
		message.success(is_cn ? '投票成功' : 'Vote submitted')
	}

	// 打开详情模态窗口
	const handleOpenDetail = (chunk: ChunkData) => {
		setSelectedChunk(chunk)
		setDetailVisible(true)
	}

	// 关闭详情模态窗口
	const handleCloseDetail = () => {
		setDetailVisible(false)
		setSelectedChunk(null)
	}

	// 过滤和排序切片
	const getFilteredAndSortedChunks = () => {
		// 先过滤
		let filtered = data.filter((chunk) => {
			if (searchText.trim()) {
				const keyword = searchText.toLowerCase()
				return (
					chunk.text.toLowerCase().includes(keyword) ||
					chunk.metadata?.category?.toLowerCase().includes(keyword)
				)
			}
			return true
		})

		// 再排序
		switch (sortBy) {
			case 'recall':
				return filtered.sort((a, b) => b.recall_count - a.recall_count)
			case 'weight':
				return filtered.sort((a, b) => b.weight - a.weight)
			case 'votes':
				return filtered.sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes))
			case 'default':
			default:
				return filtered
		}
	}

	const allFilteredChunks = getFilteredAndSortedChunks()

	// 分页数据
	const startIndex = (currentPage - 1) * pageSize
	const endIndex = startIndex + pageSize
	const paginatedChunks = allFilteredChunks.slice(startIndex, endIndex)

	// 处理分页变化
	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}

	const handlePageSizeChange = (size: number) => {
		setPageSize(size)
		setCurrentPage(1) // 改变每页条数时重置到第一页
	}

	// 计算总页数
	const totalPages = Math.ceil(allFilteredChunks.length / pageSize)

	// 生成页码数组
	const getPageNumbers = () => {
		const pages: number[] = []
		const maxPagesToShow = 5

		if (totalPages <= maxPagesToShow) {
			// 总页数不超过5页，显示所有页码
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i)
			}
		} else {
			// 总页数超过5页，智能显示页码
			if (currentPage <= 3) {
				// 当前页在前3页，显示 1,2,3,4,5
				for (let i = 1; i <= 5; i++) {
					pages.push(i)
				}
			} else if (currentPage >= totalPages - 2) {
				// 当前页在后3页，显示后5页
				for (let i = totalPages - 4; i <= totalPages; i++) {
					pages.push(i)
				}
			} else {
				// 当前页在中间，显示当前页前后2页
				for (let i = currentPage - 2; i <= currentPage + 2; i++) {
					pages.push(i)
				}
			}
		}

		return pages
	}

	// 截取文本显示
	const truncateText = (text: string, maxLength: number = 150) => {
		if (text.length <= maxLength) return text
		return text.substring(0, maxLength) + '...'
	}

	// 渲染切片卡片
	const renderChunkCard = (chunk: ChunkData) => {
		return (
			<div key={chunk.id} className={styles.chunkCard} onClick={() => handleOpenDetail(chunk)}>
				<div className={styles.cardHeader}>
					<div className={styles.chunkMeta}>
						<span className={styles.chunkNumber}>#{chunk.id.replace('chunk_', '')}</span>
						<span className={styles.textLength}>
							{chunk.text_length}/{chunk.max_length}
						</span>
					</div>
					<div className={styles.weightRecall}>
						<span className={styles.weight}>
							{is_cn ? '权重' : 'Weight'}: {chunk.weight.toFixed(1)}
						</span>
						<span className={styles.recall}>
							{is_cn ? '召回' : 'Recall'}: {chunk.recall_count}
						</span>
					</div>
				</div>

				<div className={styles.cardContent}>
					<p className={styles.chunkText}>{truncateText(chunk.text)}</p>
				</div>

				<div className={styles.cardFooter}>
					<div className={styles.chunkInfo}>
						<div className={styles.infoItem}>
							<Icon name='material-location_on' size={12} />
							<span>
								{is_cn ? `第${chunk.source_page}页` : `Page ${chunk.source_page}`}
							</span>
						</div>
					</div>

					<div className={styles.voteActions}>
						<button
							className={styles.voteButton}
							onClick={(e) => {
								e.stopPropagation()
								handleVote(chunk.id, 'up')
							}}
						>
							<Icon name='material-thumb_up' size={14} />
							<span>{chunk.upvotes}</span>
						</button>
						<button
							className={styles.voteButton}
							onClick={(e) => {
								e.stopPropagation()
								handleVote(chunk.id, 'down')
							}}
						>
							<Icon name='material-thumb_down' size={14} />
							<span>{chunk.downvotes}</span>
						</button>
					</div>
				</div>
			</div>
		)
	}

	// 渲染内容
	const renderContent = () => {
		if (loading) {
			return (
				<div className={styles.loadingContainer}>
					<Icon name='material-hourglass_empty' size={32} />
					<p>{is_cn ? '正在加载切片数据...' : 'Loading chunks...'}</p>
				</div>
			)
		}

		if (data.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-content_cut' size={48} />
					<p>{is_cn ? '暂无切片数据' : 'No chunks available'}</p>
				</div>
			)
		}

		if (allFilteredChunks.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-search_off' size={48} />
					<p>{is_cn ? '未找到匹配的切片' : 'No matching chunks found'}</p>
				</div>
			)
		}

		return (
			<>
				<div className={styles.chunksGrid}>{paginatedChunks.map(renderChunkCard)}</div>
				{totalPages > 1 && (
					<div className={styles.paginationContainer}>
						{/* 分页控件 */}
						<div className={styles.paginationControls}>
							{/* 上一页 */}
							<Button
								size='small'
								disabled={currentPage === 1}
								onClick={() => handlePageChange(currentPage - 1)}
								className={styles.paginationButton}
							>
								<Icon name='material-chevron_left' size={14} />
							</Button>

							{/* 页码 */}
							{getPageNumbers().map((pageNum) => (
								<Button
									key={pageNum}
									size='small'
									type={currentPage === pageNum ? 'primary' : 'default'}
									onClick={() => handlePageChange(pageNum)}
									className={styles.paginationButton}
								>
									{pageNum}
								</Button>
							))}

							{/* 下一页 */}
							<Button
								size='small'
								disabled={currentPage === totalPages}
								onClick={() => handlePageChange(currentPage + 1)}
								className={styles.paginationButton}
							>
								<Icon name='material-chevron_right' size={14} />
							</Button>
						</div>
					</div>
				)}
			</>
		)
	}

	return (
		<div className={styles.panelContent}>
			<div className={styles.panelHeader}>
				<div className={styles.headerTitle}>
					<Icon name='material-list' size={14} />
					<h3>{is_cn ? '内容分段' : 'Content Chunks'}</h3>
					{data.length > 0 && (
						<span className={styles.countBadge}>
							{allFilteredChunks.length}/{data.length}
						</span>
					)}
				</div>
				<div className={styles.headerActions}>
					{viewMode === 'dual' ? (
						<Tooltip title={is_cn ? '最大化内容分段' : 'Maximize Content Chunks'}>
							<Button
								type='text'
								size='small'
								icon={<Icon name='material-fullscreen' size={14} />}
								onClick={onHideLeftPanel}
								className={styles.headerButton}
							/>
						</Tooltip>
					) : viewMode === 'right' ? (
						<Tooltip title={is_cn ? '恢复双栏显示' : 'Restore Dual Panels'}>
							<Button
								type='text'
								size='small'
								icon={<Icon name='material-vertical_split' size={14} />}
								onClick={onRestoreDualPanels}
								className={styles.headerButton}
							/>
						</Tooltip>
					) : null}
				</div>
			</div>

			{/* 搜索器 */}
			<div className={styles.searchSection}>
				<div className={styles.searchWrapper}>
					<Input
						className={styles.searchInput}
						placeholder={is_cn ? '搜索切片内容...' : 'Search chunks...'}
						prefix={<SearchOutlined />}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyPress={handleKeyPress}
						allowClear
					/>
					<Select
						value={sortBy}
						onChange={(value) => {
							setSortBy(value)
							setCurrentPage(1) // 排序时重置到第一页
						}}
						size='small'
						className={styles.sortSelect}
						style={{ width: 120 }}
					>
						<Select.Option value='default'>{is_cn ? '默认排序' : 'Default'}</Select.Option>
						<Select.Option value='recall'>{is_cn ? '召回次数' : 'Recall Count'}</Select.Option>
						<Select.Option value='weight'>{is_cn ? '权重' : 'Weight'}</Select.Option>
						<Select.Option value='votes'>{is_cn ? '投票' : 'Votes'}</Select.Option>
					</Select>
					<Button
						type='primary'
						size='small'
						onClick={handleSearch}
						className={styles.searchButton}
					>
						{is_cn ? '搜索' : 'Search'}
					</Button>
				</div>
			</div>

			<div className={styles.scrollableContent}>{renderContent()}</div>

			{/* 详情模态窗口 */}
			<ChunkDetail visible={detailVisible} onClose={handleCloseDetail} chunkData={selectedChunk} />
		</div>
	)
}

export default Chunks
