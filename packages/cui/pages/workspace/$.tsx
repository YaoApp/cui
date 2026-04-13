import { useState, useEffect, useCallback } from 'react'
import { getLocale, useParams, useNavigate } from '@umijs/max'
import { message } from 'antd'
import WorkspaceList from './components/WorkspaceList'
import WorkspaceDetail from './components/WorkspaceDetail'
import CreateModal from './components/CreateModal'
import { WorkspaceAPI } from '@/openapi/workspace'
import { NodesAPI } from '@/openapi/nodes'
import type { Workspace, NodeInfo } from './types'
import styles from './index.less'

const WorkspacePage = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const params = useParams()
	const navigate = useNavigate()

	const [workspaces, setWorkspaces] = useState<Workspace[]>([])
	const [nodeMap, setNodeMap] = useState<Record<string, NodeInfo>>({})
	const [loading, setLoading] = useState(true)
	const [showCreate, setShowCreate] = useState(false)

	const currentPath = params['*'] || 'list'
	const isDetail = currentPath.startsWith('detail/')
	const detailId = isDetail ? currentPath.replace('detail/', '') : null

	const selectedWorkspace = workspaces.find((w) => w.id === detailId) || null

	const getApi = useCallback((): WorkspaceAPI | null => {
		if (!window.$app?.openapi) return null
		return new WorkspaceAPI(window.$app.openapi)
	}, [])

	const loadWorkspaces = useCallback(async () => {
		try {
			setLoading(true)
			const api = getApi()
			if (!api) return
			const resp = await api.List()
			if (window.$app.openapi.IsError(resp)) {
				throw new Error(resp.error?.error_description || 'Unknown error')
			}
			setWorkspaces(window.$app.openapi.GetData(resp) || [])
		} catch (error) {
			console.error('Failed to load workspaces:', error)
			message.error(is_cn ? '加载工作空间失败' : 'Failed to load workspaces')
		} finally {
			setLoading(false)
		}
	}, [is_cn, getApi])

	const loadNodes = useCallback(async () => {
		try {
			if (!window.$app?.openapi) return
			const api = new NodesAPI(window.$app.openapi)
			const resp = await api.List()
			if (window.$app.openapi.IsError(resp)) return
			const nodes: NodeInfo[] = window.$app.openapi.GetData(resp) || []
			const map: Record<string, NodeInfo> = {}
			for (const n of nodes) map[n.tai_id] = n
			setNodeMap(map)
		} catch { /* silent */ }
	}, [])

	useEffect(() => {
		loadWorkspaces()
		loadNodes()
	}, [loadWorkspaces, loadNodes])

	const handleWorkspaceClick = (ws: Workspace) => {
		navigate(`/workspace/detail/${ws.id}`)
	}

	const handleDelete = async (ws: Workspace) => {
		try {
			const api = getApi()
			if (!api) return
			const resp = await api.Delete(ws.id)
			if (window.$app.openapi.IsError(resp)) {
				throw new Error(resp.error?.error_description)
			}
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
			setWorkspaces((prev) => prev.filter((w) => w.id !== ws.id))
			if (detailId === ws.id) {
				navigate('/workspace/list')
			}
		} catch {
			message.error(is_cn ? '删除失败' : 'Delete failed')
		}
	}

	const handleCreate = async (opts: { name: string; node: string; labels?: Record<string, string> }) => {
		try {
			const api = getApi()
			if (!api) return
			const resp = await api.Create(opts)
			if (window.$app.openapi.IsError(resp)) {
				throw new Error(resp.error?.error_description)
			}
			const ws = window.$app.openapi.GetData(resp)
			message.success(is_cn ? '创建成功' : 'Created successfully')
			if (ws) {
				setWorkspaces((prev) => [ws, ...prev])
				setShowCreate(false)
				navigate(`/workspace/detail/${ws.id}`)
			}
		} catch {
			message.error(is_cn ? '创建失败' : 'Create failed')
		}
	}

	const handleBack = () => {
		navigate('/workspace/list')
	}

	if (isDetail && selectedWorkspace) {
		return (
			<div className={styles.container}>
		<WorkspaceDetail
			workspace={selectedWorkspace}
			nodeMap={nodeMap}
			onBack={handleBack}
			onDelete={() => handleDelete(selectedWorkspace)}
			onRefresh={loadWorkspaces}
		/>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<WorkspaceList
				workspaces={workspaces}
				nodeMap={nodeMap}
				loading={loading}
				onSelect={handleWorkspaceClick}
				onDelete={handleDelete}
				onCreate={() => setShowCreate(true)}
			/>
			<CreateModal
				open={showCreate}
				onSubmit={handleCreate}
				onCancel={() => setShowCreate(false)}
			/>
		</div>
	)
}

export default WorkspacePage
