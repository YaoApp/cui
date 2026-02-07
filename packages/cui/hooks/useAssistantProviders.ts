import { useState, useEffect } from 'react'
import { LLM, LLMProvider, AgentInfoResponse, ModelCapability } from '@/openapi'

interface UseAssistantProvidersOptions {
	assistant?: {
		connector?: string
		connector_options?: {
			optional?: boolean
			connectors?: string[]
			filters?: ModelCapability[]
		}
	}
}

interface UseAssistantProvidersReturn {
	providers: LLMProvider[]
	loading: boolean
	showSelector: boolean // Whether to show the model selector
	defaultProvider: string | undefined // Default provider value
}

/**
 * Hook to fetch LLM providers based on assistant configuration
 * This hook handles the logic for filtering providers based on:
 * - connector_options.optional: whether to show the selector
 * - connector_options.connectors: whitelist of allowed connectors
 * - connector_options.filters: required capabilities (streaming is always required)
 */
export function useAssistantProviders(options: UseAssistantProvidersOptions): UseAssistantProvidersReturn {
	const { assistant } = options
	const [providers, setProviders] = useState<LLMProvider[]>([])
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		// Check if openapi is ready
		if (!window.$app?.openapi) {
			console.warn('window.$app.openapi is not ready yet')
			return
		}

		// If no assistant or no connector, return empty
		if (!assistant?.connector) {
			setProviders([])
			return
		}

		const llmAPI = new LLM(window.$app.openapi)
		let ignore = false
		setLoading(true)

		const fetchProviders = async () => {
			try {
				// Build capability filters
				// streaming is always required
				const capabilities: ModelCapability[] = ['streaming']

				// Add filters from connector_options if exists
				if (assistant.connector_options?.filters) {
					assistant.connector_options.filters.forEach((filter) => {
						if (!capabilities.includes(filter)) {
							capabilities.push(filter)
						}
					})
				}

				// Fetch providers with capability filters
				const allProviders = await llmAPI.ListProviders({ capabilities })

				if (ignore) return

				// Filter by connector whitelist if specified
				let filteredProviders = allProviders
				if (
					assistant.connector_options?.connectors &&
					assistant.connector_options.connectors.length > 0
				) {
					const allowedConnectors = new Set(assistant.connector_options.connectors)
					filteredProviders = allProviders.filter((p) => allowedConnectors.has(p.value))

					// If whitelist filtering results in empty list
					// This means none of the whitelisted connectors meet the capability requirements
					// In this case, return empty array and the selector will be hidden
					if (filteredProviders.length === 0) {
						console.warn(
							'[useAssistantProviders] Whitelist filtered out all providers.',
							'None of the whitelisted connectors meet the capability requirements:',
							{
								whitelist: assistant.connector_options.connectors,
								requiredCapabilities: capabilities,
								availableProviders: allProviders.map((p) => p.value)
							}
						)
					}
				}

				setProviders(filteredProviders)
			} catch (error) {
				if (!ignore) {
					console.error('Failed to fetch LLM providers:', error)
					setProviders([])
				}
			} finally {
				if (!ignore) {
					setLoading(false)
				}
			}
		}

		fetchProviders()

		return () => {
			ignore = true
		}
	}, [assistant?.connector, assistant?.connector_options])

	// Determine if selector should be shown
	// Conditions: 1. optional !== false, 2. has providers to select from
	const showSelector = assistant?.connector_options?.optional !== false && providers.length > 0

	// Determine default provider
	const defaultProvider = assistant?.connector

	return {
		providers,
		loading,
		showSelector,
		defaultProvider
	}
}

export default useAssistantProviders
