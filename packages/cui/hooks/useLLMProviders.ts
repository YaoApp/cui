import { useState, useEffect } from 'react'
import { LLM, LLMProvider } from '@/openapi'

/**
 * Hook to fetch and manage LLM providers
 * Replaces the deprecated global.connectors
 */
export function useLLMProviders() {
	const [providers, setProviders] = useState<LLMProvider[]>([])
	const [loading, setLoading] = useState(false)
	const [mapping, setMapping] = useState<Record<string, string>>({})

	useEffect(() => {
		// Check if openapi is ready
		if (!window.$app?.openapi) {
			console.warn('window.$app.openapi is not ready yet')
			return
		}

		const llmAPI = new LLM(window.$app.openapi)
		let ignore = false
		setLoading(true)

		llmAPI
			.ListProviders()
			.then((providers) => {
				if (ignore || !providers) return

				setProviders(providers)

				// Create mapping: value -> label
				const newMapping = providers.reduce((acc: Record<string, string>, provider) => {
					acc[provider.value] = provider.label
					return acc
				}, {})
				setMapping(newMapping)
			})
			.catch((error) => {
				if (!ignore) {
					console.error('Failed to fetch LLM providers:', error)
				}
			})
			.finally(() => !ignore && setLoading(false))

		return () => {
			ignore = true
		}
	}, [])

	return {
		providers,
		mapping,
		loading
	}
}

export default useLLMProviders

