import { useEffect, useRef, useState } from 'react'
import { Button, Input, Spin, Tabs, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { history, getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Card from '@/neo/components/AIChat/Card'
import { Agent } from '@/openapi/agent'
import type { AgentFilter } from '@/openapi/agent'
import { App } from '@/types'
import styles from './index.less'

// Helper function to generate default placeholder data
const generateDefaultPlaceholder = (assistant: App.Assistant, is_cn: boolean): App.ChatPlaceholder => {
	if (assistant.placeholder && Object.keys(assistant.placeholder).length > 0) {
		return assistant.placeholder
	}

	const name = assistant.name || ''
	const description = assistant.description || ''

	return {
		title: is_cn ? '新对话' : 'New Chat',
		description: description
			? is_cn
				? `你好，我是${name}，${description}`
				: `Hello, I'm ${name}, ${description}`
			: '',
		prompts: []
	}
}

const Index = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(false)
	const [search, setSearch] = useState('')
	const [searchText, setSearchText] = useState('')
	const [activeType, setActiveType] = useState('all')
	const [currentPage, setCurrentPage] = useState(1)
	const [totalAssistants, setTotalAssistants] = useState(0)
	const [pageSize] = useState(12)
	const [data, setData] = useState<App.Assistant[]>([])
	const containerRef = useRef<HTMLDivElement>(null)
	const [hasMore, setHasMore] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [tags, setTags] = useState<{ key: string; label: string }[]>([
		{ key: 'all', label: is_cn ? '全部' : 'All' }
	])
	const [tagsLoading, setTagsLoading] = useState(true)

	// Load tags
	useEffect(() => {
		const loadTags = async () => {
			if (!window.$app?.openapi) {
				console.error('OpenAPI not available')
				return
			}

			try {
				const agent = new Agent(window.$app.openapi)
				const response = await agent.tags.List({
					locale: is_cn ? 'zh-cn' : 'en-us',
					type: 'assistant'
				})

				if (window.$app.openapi.IsError(response)) {
					throw new Error(response.error?.error_description || 'Failed to load tags')
				}

			// Transform the response into the required format
			let formattedTags: { key: string; value: string; label: string }[] = [
				{ key: 'all', value: 'all', label: is_cn ? '全部' : 'All' }
			]

			const tagsData = window.$app.openapi.GetData(response)
			if (Array.isArray(tagsData)) {
				// If response is an array of strings, transform each string into an object
				if (typeof tagsData[0] === 'string') {
					const tagObjects = tagsData.map((tag: string) => ({
						key: tag,
						value: tag,
						label: tag
					}))
					formattedTags = [
						{ key: 'all', value: 'all', label: is_cn ? '全部' : 'All' },
						...tagObjects
					]
				}
				// If response is already an array of objects with key and label, use it directly
				else if (tagsData[0] && typeof tagsData[0] === 'object' && 'value' in tagsData[0]) {
					formattedTags = [{ key: 'all', value: 'all', label: is_cn ? '全部' : 'All' }]
					tagsData.forEach((tag: any) => {
						formattedTags.push({
							key: tag.value,
							value: tag.value,
							label: tag.label
						})
					})
				}
			}

				setTags(formattedTags)
			} catch (error) {
				console.error(is_cn ? '加载智能体标签失败:' : 'Failed to load assistant tags:', error)
				message.error(is_cn ? '加载智能体标签失败' : 'Failed to load assistant tags')
			} finally {
				setTagsLoading(false)
			}
		}

		loadTags()
	}, [is_cn])

	// Load data - initial load
	const loadData = async () => {
		if (!window.$app?.openapi) {
			console.error('OpenAPI not available')
			return
		}

		try {
			setLoading(true)
			const agent = new Agent(window.$app.openapi)

			const filter: AgentFilter = {
				locale: is_cn ? 'zh-cn' : 'en-us',
				type: 'assistant',
				page: 1,
				pagesize: pageSize,
				select: [
					'assistant_id',
					'built_in',
					'automated',
					'avatar',
					'connector',
					'description',
					'mentionable',
					'placeholder',
					'name',
					'readonly',
					'sort',
					'tags',
					'created_at'
				]
			}

			if (searchText) {
				filter.keywords = searchText
			}

			if (activeType !== 'all') {
				filter.tags = [activeType]
			}

			const response = await agent.assistants.List(filter)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load assistants')
			}

			const listResponse = window.$app.openapi.GetData(response)
			let newData = Array.isArray(listResponse?.data) ? listResponse.data : []
			const total = typeof listResponse?.total === 'number' ? listResponse.total : 0

			// Add default placeholder for assistants that don't have one
			newData = newData.map((assistant: App.Assistant) => {
				if (!assistant.placeholder || Object.keys(assistant.placeholder).length === 0) {
					return {
						...assistant,
						placeholder: generateDefaultPlaceholder(assistant, is_cn)
					}
				}
				return assistant
			})

			// Reset mode: replace data
			setData(newData)
			setCurrentPage(1)
			setTotalAssistants(total)

			// Check if there's more data
			setHasMore(newData.length < total)
		} catch (error) {
			console.error(is_cn ? '加载智能体失败:' : 'Failed to load assistants:', error)
			message.error(is_cn ? '加载智能体失败' : 'Failed to load assistants')
		} finally {
			setLoading(false)
		}
	}

	// Load more data
	const loadMoreData = async () => {
		if (!hasMore || loadingMore) return

		const nextPage = currentPage + 1
		setCurrentPage(nextPage)

		if (!window.$app?.openapi) {
			console.error('OpenAPI not available')
			return
		}

		try {
			setLoadingMore(true)
			const agent = new Agent(window.$app.openapi)

			const filter: AgentFilter = {
				locale: is_cn ? 'zh-cn' : 'en-us',
				type: 'assistant',
				page: nextPage,
				pagesize: pageSize,
				select: [
					'assistant_id',
					'built_in',
					'automated',
					'avatar',
					'connector',
					'description',
					'mentionable',
					'placeholder',
					'name',
					'readonly',
					'sort',
					'tags',
					'created_at'
				]
			}

			if (searchText) {
				filter.keywords = searchText
			}

			if (activeType !== 'all') {
				filter.tags = [activeType]
			}

			const response = await agent.assistants.List(filter)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load assistants')
			}

			const listResponse = window.$app.openapi.GetData(response)
			let newData = Array.isArray(listResponse?.data) ? listResponse.data : []
			const total = typeof listResponse?.total === 'number' ? listResponse.total : 0

			// Add default placeholder for assistants that don't have one
			newData = newData.map((assistant: App.Assistant) => {
				if (!assistant.placeholder || Object.keys(assistant.placeholder).length === 0) {
					return {
						...assistant,
						placeholder: generateDefaultPlaceholder(assistant, is_cn)
					}
				}
				return assistant
			})

			// Append data
			setData((prev) => (Array.isArray(prev) ? [...prev, ...newData] : newData))
			setTotalAssistants(total)

			// Check if there's more data
			setHasMore(data.length + newData.length < total)
		} catch (error) {
			console.error(is_cn ? '加载更多智能体失败:' : 'Failed to load more assistants:', error)
			message.error(is_cn ? '加载更多智能体失败' : 'Failed to load more assistants')
		} finally {
			setLoadingMore(false)
		}
	}

	// Handle scroll for infinite loading
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container
			if (scrollHeight - scrollTop - clientHeight < 50 && !loadingMore && hasMore) {
				loadMoreData()
			}
		}

		container.addEventListener('scroll', handleScroll)
		return () => container.removeEventListener('scroll', handleScroll)
	}, [loadingMore, hasMore, data])

	// Initial load and reload on filter change
	useEffect(() => {
		setData([])
		setCurrentPage(1)
		setHasMore(true)
		loadData()
	}, [searchText, activeType])

	const handleSearch = () => {
		setSearchText(search)
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	const handleCardClick = (assistant: App.Assistant) => {
		// Ensure assistant has placeholder data before redirecting
		if (!assistant.placeholder || Object.keys(assistant.placeholder).length === 0) {
			assistant.placeholder = generateDefaultPlaceholder(assistant, is_cn)
		}
		history.push(`/assistants/detail/${assistant.assistant_id}`)
	}

	const handleCreate = () => {
		history.push('/assistants/create')
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.titleContainer}>
					<div className={styles.titleWithIcon}>
						<Icon
							name='material-assistant'
							size={24}
							style={{ color: 'var(--color_page_title)' }}
						/>
						<h1 className={styles.title}>{is_cn ? 'AI 智能体' : 'AI Assistants'}</h1>
					</div>
					<div className={styles.createIcon} onClick={handleCreate}>
						<Icon name='material-add' size={24} />
						<span className={styles.createText}>{is_cn ? '创建' : 'Create'}</span>
					</div>
				</div>
				<div className={styles.searchWrapper}>
					<Input
						size='large'
						prefix={<SearchOutlined />}
						placeholder={is_cn ? '搜索 AI 智能体...' : 'Search AI assistants...'}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyPress={handleKeyPress}
						className={styles.search}
					/>
					<Button type='primary' size='large' onClick={handleSearch}>
						{is_cn ? '搜索' : 'Search'}
					</Button>
				</div>
				<div className={styles.tabsWrapper}>
					{tagsLoading ? (
						<Spin size='small' />
					) : (
						<Tabs
							activeKey={activeType}
							onChange={setActiveType}
							items={tags.map((type) => ({ key: type.key, label: type.label }))}
						/>
					)}
				</div>
			</div>

			<div className={styles.content} ref={containerRef}>
				{loading && data.length === 0 ? (
					<div className={styles.loading}>
						<Spin size='large' />
					</div>
				) : (
					<>
						{data.length > 0 && (
							<div className={styles.grid}>
								{data.map((item) => (
									<div key={item.assistant_id} className={styles.gridItem}>
										<Card
											data={{
												...item,
												id: item.assistant_id,
												description: item.description || '',
												avatar:
													item.avatar ||
													`https://api.dicebear.com/7.x/bottts/svg?seed=${item.assistant_id}`,
												created_at:
													item.created_at ||
													new Date().toISOString(),
												readonly: item.readonly || false,
												automated: item.automated || false,
												mentionable: item.mentionable || false,
												connector:
													item.connector ||
													(is_cn ? '未知' : 'Unknown'),
												type: item.type || 'assistant'
											}}
											onClick={handleCardClick}
										/>
									</div>
								))}
							</div>
						)}

						{loadingMore && data.length > 0 && (
							<div className={styles.loading}>
								<Spin />
							</div>
						)}

						{!loading && data.length === 0 && (
							<div className={styles.empty}>
								{is_cn ? '未找到结果' : 'No results found'}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}

export default Index
