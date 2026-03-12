import { useState, useEffect, useCallback } from 'react'
import type { ComputerFilter } from '@/openapi'
import { ComputerAPI, type ComputerOption } from '@/openapi/computer'
import { WorkspaceAPI } from '@/openapi/workspace'

interface UseComputerWorkspaceOptions {
	sandbox?: boolean
	computerFilter?: ComputerFilter
	selectedComputer: string
}

interface WorkspaceOption {
	id: string
	name: string
	owner: string
	node: string
	node_name?: string
	labels?: Record<string, string>
	created_at: string
	updated_at: string
}

interface UseComputerWorkspaceReturn {
	computers: ComputerOption[]
	workspaces: WorkspaceOption[]
	loadingComputers: boolean
	loadingWorkspaces: boolean
	nodesAvailable: boolean
	showComputerSelector: boolean
	refreshComputers: () => void
	refreshWorkspaces: () => void
}

/**
 * Hook to fetch Computer and Workspace options for the InputArea.
 * Pattern mirrors useAssistantProviders: backend provides filter, frontend passes through.
 */
export function useComputerWorkspace(options: UseComputerWorkspaceOptions): UseComputerWorkspaceReturn {
	const { sandbox, computerFilter, selectedComputer } = options
	const [computers, setComputers] = useState<ComputerOption[]>([])
	const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([])
	const [loadingComputers, setLoadingComputers] = useState(false)
	const [loadingWorkspaces, setLoadingWorkspaces] = useState(false)
	const [computerVersion, setComputerVersion] = useState(0)
	const [workspaceVersion, setWorkspaceVersion] = useState(0)

	const showComputerSelector = !!computerFilter

	// Fetch computers when computerFilter changes
	useEffect(() => {
		if (!window.$app?.openapi || !computerFilter) {
			setComputers([])
			return
		}

		const api = new ComputerAPI(window.$app.openapi)
		let ignore = false
		setLoadingComputers(true)

		const fetch = async () => {
			try {
				const res = await api.Options(computerFilter)
				if (ignore) return
				setComputers(res.data ?? [])
			} catch (error) {
				if (!ignore) {
					console.error('Failed to fetch computer options:', error)
					setComputers([])
				}
			} finally {
				if (!ignore) setLoadingComputers(false)
			}
		}

		fetch()
		return () => {
			ignore = true
		}
	}, [computerFilter, computerVersion])

	// Fetch workspaces; re-fetch when selectedComputer changes
	useEffect(() => {
		if (!window.$app?.openapi) {
			setWorkspaces([])
			return
		}

		const api = new WorkspaceAPI(window.$app.openapi)
		let ignore = false
		setLoadingWorkspaces(true)

		const nodeParam = selectedComputer !== 'auto' ? selectedComputer : undefined

		const fetch = async () => {
			try {
				const res = await api.Options(nodeParam)
				if (ignore) return
				setWorkspaces(res.data ?? [])
			} catch (error) {
				if (!ignore) {
					console.error('Failed to fetch workspace options:', error)
					setWorkspaces([])
				}
			} finally {
				if (!ignore) setLoadingWorkspaces(false)
			}
		}

		fetch()
		return () => {
			ignore = true
		}
	}, [selectedComputer, workspaceVersion])

	const refreshComputers = useCallback(() => setComputerVersion((v) => v + 1), [])
	const refreshWorkspaces = useCallback(() => setWorkspaceVersion((v) => v + 1), [])

	return {
		computers,
		workspaces,
		loadingComputers,
		loadingWorkspaces,
		nodesAvailable: computers.length > 0,
		showComputerSelector,
		refreshComputers,
		refreshWorkspaces
	}
}

export default useComputerWorkspace
