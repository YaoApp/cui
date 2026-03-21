import { useState, useCallback } from 'react'
import { WorkspaceAPI } from '@/openapi/workspace'
import type { Workspace } from '@/pages/workspace/types'

interface UseWorkspaceReturn {
	workspaces: Workspace[]
	hasOnlineNodes: boolean
	loading: boolean
	fetchWorkspaces: () => void
}

export function useWorkspace(): UseWorkspaceReturn {
	const [workspaces, setWorkspaces] = useState<Workspace[]>([])
	const [hasOnlineNodes, setHasOnlineNodes] = useState(false)
	const [loading, setLoading] = useState(false)

	const fetchWorkspaces = useCallback(() => {
		if (!window.$app?.openapi) {
			setWorkspaces([])
			setHasOnlineNodes(false)
			return
		}

		const api = new WorkspaceAPI(window.$app.openapi)
		setLoading(true)

		api.Options()
			.then((res) => {
				const body = res.data
				if (body) {
					setWorkspaces(body.data ?? [])
					setHasOnlineNodes(body.has_online_nodes ?? false)
				} else {
					setWorkspaces([])
					setHasOnlineNodes(false)
				}
			})
			.catch((error) => {
				console.error('Failed to fetch workspace options:', error)
				setWorkspaces([])
				setHasOnlineNodes(false)
			})
			.finally(() => {
				setLoading(false)
			})
	}, [])

	return {
		workspaces,
		hasOnlineNodes,
		loading,
		fetchWorkspaces
	}
}

export default useWorkspace
