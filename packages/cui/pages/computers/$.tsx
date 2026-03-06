import { useState, useEffect, useCallback } from 'react'
import { getLocale, useParams, useNavigate } from '@umijs/max'
import { message } from 'antd'
import ComputerList from './components/ComputerList'
import ComputerDetail from './components/ComputerDetail'
import NodeConfigModal from './components/CreateModal'
import { mockApi } from './mockData'
import type { BoxInfo } from './types'
import styles from './index.less'

const ComputersPage = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const params = useParams()
	const navigate = useNavigate()

	const [boxes, setBoxes] = useState<BoxInfo[]>([])
	const [loading, setLoading] = useState(true)
	const [showNodeConfig, setShowNodeConfig] = useState(false)

	const currentPath = params['*'] || 'list'
	const isDetail = currentPath.startsWith('detail/')
	const detailId = isDetail ? currentPath.replace('detail/', '') : null

	const selectedBox = boxes.find((b) => b.id === detailId) || null

	const loadBoxes = useCallback(async () => {
		try {
			setLoading(true)
			const data = await mockApi.listBoxes()
			setBoxes(data)
		} catch (error) {
			console.error('Failed to load computers:', error)
			message.error(is_cn ? '加载电脑列表失败' : 'Failed to load computers')
		} finally {
			setLoading(false)
		}
	}, [is_cn])

	useEffect(() => {
		loadBoxes()
	}, [loadBoxes])

	const handleSelect = (box: BoxInfo) => {
		navigate(`/computers/detail/${box.id}`)
	}

	const handleStart = async (box: BoxInfo) => {
		try {
			await mockApi.startBox(box.id)
			message.success(is_cn ? '启动成功' : 'Started successfully')
			setBoxes((prev) => prev.map((b) => (b.id === box.id ? { ...b, status: 'running' as const } : b)))
		} catch {
			message.error(is_cn ? '启动失败' : 'Start failed')
		}
	}

	const handleStop = async (box: BoxInfo) => {
		try {
			await mockApi.stopBox(box.id)
			message.success(is_cn ? '停止成功' : 'Stopped successfully')
			setBoxes((prev) => prev.map((b) => (b.id === box.id ? { ...b, status: 'stopped' as const, process_count: 0 } : b)))
		} catch {
			message.error(is_cn ? '停止失败' : 'Stop failed')
		}
	}

	const handleRemove = async (box: BoxInfo) => {
		try {
			await mockApi.removeBox(box.id)
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
			setBoxes((prev) => prev.filter((b) => b.id !== box.id))
			if (detailId === box.id) {
				navigate('/computers/list')
			}
		} catch {
			message.error(is_cn ? '删除失败' : 'Delete failed')
		}
	}

	const handleVNC = async (box: BoxInfo) => {
		try {
			const url = await mockApi.getVNCUrl(box.id)
			window.open(url, '_blank')
		} catch {
			message.error(is_cn ? '获取 VNC 链接失败' : 'Failed to get VNC URL')
		}
	}

	const handleBack = () => {
		navigate('/computers/list')
	}

	if (isDetail && selectedBox) {
		return (
			<div className={styles.container}>
				<ComputerDetail
					box={selectedBox}
					onBack={handleBack}
					onRemove={() => handleRemove(selectedBox)}
					onRefresh={loadBoxes}
				/>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<ComputerList
				boxes={boxes}
				loading={loading}
				onSelect={handleSelect}
				onStart={handleStart}
				onStop={handleStop}
				onRemove={handleRemove}
				onNodeConfig={() => setShowNodeConfig(true)}
				onVNC={handleVNC}
			/>
			<NodeConfigModal
				open={showNodeConfig}
				onCancel={() => setShowNodeConfig(false)}
			/>
		</div>
	)
}

export default ComputersPage
