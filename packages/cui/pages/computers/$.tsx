import { useState, useEffect, useCallback } from 'react'
import { getLocale, useParams, useNavigate } from '@umijs/max'
import { message } from 'antd'
import ComputerList from './components/ComputerList'
import ComputerDetail from './components/ComputerDetail'
import { Sandbox } from '@/openapi/sandbox'
import { ComputerAPI } from '@/openapi/computer'
import type { BoxInfo } from './types'
import styles from './index.less'

const ComputersPage = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const params = useParams()
	const navigate = useNavigate()

	const [boxes, setBoxes] = useState<BoxInfo[]>([])
	const [loading, setLoading] = useState(true)

	const currentPath = params['*'] || 'list'
	const isDetail = currentPath.startsWith('detail/')
	const detailId = isDetail ? currentPath.replace('detail/', '') : null

	const selectedBox = boxes.find((b) => b.id === detailId) || null

	const getApi = useCallback((): Sandbox | null => {
		if (!window.$app?.openapi) return null
		return new Sandbox(window.$app.openapi)
	}, [])

	const loadBoxes = useCallback(async () => {
		try {
			setLoading(true)
			const api = getApi()
			if (!api) return
			const resp = await api.ListBoxes()
			if (window.$app.openapi.IsError(resp)) {
				throw new Error(resp.error?.error_description || 'Unknown error')
			}
			setBoxes(window.$app.openapi.GetData(resp) || [])
		} catch (error: any) {
			console.error('Failed to load computers:', error)
			message.error(is_cn ? '加载电脑列表失败' : 'Failed to load computers')
		} finally {
			setLoading(false)
		}
	}, [is_cn, getApi])

	useEffect(() => {
		loadBoxes()
	}, [loadBoxes])

	const handleSelect = (box: BoxInfo) => {
		navigate(`/computers/detail/${box.id}`)
	}

	const handleRemove = async (box: BoxInfo) => {
		try {
			const api = getApi()
			if (!api) return
			const resp = await api.RemoveBox(box.id)
			if (window.$app.openapi.IsError(resp)) {
				throw new Error(resp.error?.error_description)
			}
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
		if (!window.$app?.openapi) return
		let url: string
		if (box.kind === 'host') {
			const api = new ComputerAPI(window.$app.openapi)
			url = api.GetViewerURL(box.id)
		} else {
			const api = getApi()
			if (!api) return
			url = api.GetViewerURL(box.id)
		}
		navigate(url)
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
				onRemove={handleRemove}
				onVNC={handleVNC}
			/>
		</div>
	)
}

export default ComputersPage
