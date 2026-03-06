import { useState, useEffect, useCallback } from 'react'
import { getLocale, useParams, useNavigate } from '@umijs/max'
import { message } from 'antd'
import WorkspaceList from './components/WorkspaceList'
import WorkspaceDetail from './components/WorkspaceDetail'
import CreateWorkspace from './components/CreateWorkspace'
import { mockApi } from './mockData'
import type { Workspace } from './types'
import styles from './index.less'

const WorkspacePage = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const params = useParams()
	const navigate = useNavigate()

	const [workspaces, setWorkspaces] = useState<Workspace[]>([])
	const [loading, setLoading] = useState(true)
	const [showCreate, setShowCreate] = useState(false)

	const currentPath = params['*'] || 'list'
	const isDetail = currentPath.startsWith('detail/')
	const detailId = isDetail ? currentPath.replace('detail/', '') : null

	const selectedWorkspace = workspaces.find((w) => w.id === detailId) || null

	const loadWorkspaces = useCallback(async () => {
		try {
			setLoading(true)
			const data = await mockApi.listWorkspaces()
			setWorkspaces(data)
		} catch (error) {
			console.error('Failed to load workspaces:', error)
			message.error(is_cn ? '加载工作空间失败' : 'Failed to load workspaces')
		} finally {
			setLoading(false)
		}
	}, [is_cn])

	useEffect(() => {
		loadWorkspaces()
	}, [loadWorkspaces])

	const handleWorkspaceClick = (ws: Workspace) => {
		navigate(`/workspace/detail/${ws.id}`)
	}

	const handleDelete = async (ws: Workspace) => {
		try {
			await mockApi.deleteWorkspace(ws.id)
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
			const ws = await mockApi.createWorkspace({ ...opts, owner: 'user-001' })
			message.success(is_cn ? '创建成功' : 'Created successfully')
			setWorkspaces((prev) => [ws, ...prev])
			setShowCreate(false)
			navigate(`/workspace/detail/${ws.id}`)
		} catch {
			message.error(is_cn ? '创建失败' : 'Create failed')
		}
	}

	const handleBack = () => {
		navigate('/workspace/list')
	}

	if (showCreate) {
		return (
			<div className={styles.container}>
				<CreateWorkspace onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
			</div>
		)
	}

	if (isDetail && selectedWorkspace) {
		return (
			<div className={styles.container}>
				<WorkspaceDetail
					workspace={selectedWorkspace}
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
				loading={loading}
				onSelect={handleWorkspaceClick}
				onDelete={handleDelete}
				onCreate={() => setShowCreate(true)}
			/>
		</div>
	)
}

export default WorkspacePage
