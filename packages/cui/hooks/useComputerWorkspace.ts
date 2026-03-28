import { useState, useCallback, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { WorkspaceAPI } from '@/openapi/workspace'
import type { Workspace } from '@/pages/workspace/types'
import type { OptionGroup } from '@/components/ui/inputs/types'

interface UseWorkspaceReturn {
	workspaces: Workspace[]
	hasOnlineNodes: boolean
	loading: boolean
	fetchWorkspaces: () => void
	workspaceOptionsGrouped: OptionGroup[]
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

	const is_cn = getLocale() === 'zh-CN'

	const workspaceOptionsGrouped: OptionGroup[] = useMemo(() => {
		const nodeMap = new Map<string, { groupLabel: string; options: { label: string; value: string; icon: string }[] }>()
		for (const w of workspaces) {
			const nodeName = w.node_name || w.node || (is_cn ? '未知节点' : 'Unknown Node')
			const parts = [nodeName]
			if (w.node_os) parts.push([w.node_os, w.node_arch].filter(Boolean).join('/'))
			if (!w.node_online) parts.push(is_cn ? '离线' : 'offline')
			const groupKey = parts.join(' · ')

			if (!nodeMap.has(groupKey)) {
				nodeMap.set(groupKey, { groupLabel: groupKey, options: [] })
			}
			nodeMap.get(groupKey)!.options.push({
				label: w.name || w.id,
				value: w.id,
				icon: w.node_online === false ? 'material-cloud_off' : 'material-folder'
			})
		}
		return Array.from(nodeMap.values())
	}, [workspaces, is_cn])

	return {
		workspaces,
		hasOnlineNodes,
		loading,
		fetchWorkspaces,
		workspaceOptionsGrouped
	}
}

export default useWorkspace
