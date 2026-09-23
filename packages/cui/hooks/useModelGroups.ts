import { useState, useEffect, useMemo } from 'react'
import { LLM, ModelGroupsResponse, ModelGroup, ModelCapability } from '@/openapi'

interface UseModelGroupsOptions {
	assistant?: {
		connector?: string
		connector_options?: {
			optional?: boolean
			connectors?: string[]
			filters?: ModelCapability[]
		}
	}
}

/** Reverse-lookup entry: connector ID → model group + effort level. */
export interface ConnectorEntry {
	group: ModelGroup
	effort: string
	providerName: string
}

interface UseModelGroupsReturn {
	/** Grouped models response (null while loading or on error) */
	groups: ModelGroupsResponse | null
	/** Reverse index: connector ID → { group, effort, providerName } */
	connectorIndex: Record<string, ConnectorEntry>
	/** All model groups flattened with provider name attached */
	allModels: (ModelGroup & { providerName: string })[]
	loading: boolean
	/** Whether the model selector should be visible */
	showSelector: boolean
}

/**
 * Hook to fetch model groups from GET /llm/model-groups.
 * Applies capability filters and connector whitelist from assistant configuration.
 */
export function useModelGroups(options: UseModelGroupsOptions): UseModelGroupsReturn {
	const { assistant } = options
	const [groups, setGroups] = useState<ModelGroupsResponse | null>(null)
	const [loading, setLoading] = useState(false)
	const [refreshKey, setRefreshKey] = useState(0)

	useEffect(() => {
		const handler = () => setRefreshKey((k) => k + 1)
		window.$app?.Event?.on('models/changed', handler)
		return () => {
			window.$app?.Event?.off('models/changed', handler)
		}
	}, [])

	useEffect(() => {
		if (!window.$app?.openapi) return
		if (!assistant?.connector) {
			setGroups(null)
			return
		}

		const llmAPI = new LLM(window.$app.openapi)
		let ignore = false
		setLoading(true)

		const fetchGroups = async () => {
			try {
				const capabilities: ModelCapability[] = ['streaming']
				if (assistant.connector_options?.filters) {
					assistant.connector_options.filters.forEach((f) => {
						if (!capabilities.includes(f)) capabilities.push(f)
					})
				}

				const resp = await llmAPI.ListModelGroups({ capabilities })
				if (ignore) return

				let filtered = resp
				if (
					assistant.connector_options?.connectors &&
					assistant.connector_options.connectors.length > 0
				) {
					const allowed = new Set(assistant.connector_options.connectors)
					filtered = {
						...resp,
						groups: resp.groups
							.map((pg) => ({
								...pg,
								models: pg.models
									.map((mg) => {
										const kept: Record<string, string> = {}
										for (const [effort, cid] of Object.entries(mg.connectors)) {
											if (allowed.has(cid)) kept[effort] = cid
										}
										return { ...mg, connectors: kept, levels: mg.levels.filter((l) => kept[l] !== undefined) }
									})
									.filter((mg) => Object.keys(mg.connectors).length > 0)
							}))
							.filter((pg) => pg.models.length > 0)
					}
				}

				setGroups(filtered)
			} catch {
				if (!ignore) setGroups(null)
			} finally {
				if (!ignore) setLoading(false)
			}
		}

		fetchGroups()
		return () => {
			ignore = true
		}
	}, [assistant?.connector, assistant?.connector_options, refreshKey])

	const connectorIndex = useMemo(() => {
		const index: Record<string, ConnectorEntry> = {}
		if (!groups) return index
		for (const pg of groups.groups) {
			for (const mg of pg.models) {
				for (const [effort, cid] of Object.entries(mg.connectors)) {
					index[cid] = { group: mg, effort, providerName: pg.name }
				}
			}
		}
		return index
	}, [groups])

	const allModels = useMemo(() => {
		if (!groups) return []
		return groups.groups.flatMap((pg) => pg.models.map((mg) => ({ ...mg, providerName: pg.name })))
	}, [groups])

	const showSelector = assistant?.connector_options?.optional !== false && allModels.length > 0

	return { groups, connectorIndex, allModels, loading, showSelector }
}

export default useModelGroups
