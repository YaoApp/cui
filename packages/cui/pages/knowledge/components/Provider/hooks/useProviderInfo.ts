import React, { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { KB } from '@/openapi'
import type { Provider, ProviderSchemaSummary } from '../types'

// Utility function to group providers by category (reused from Select component)
interface GroupedProvider {
	id: string
	title: string
	description: string
	group?: string
	providerId?: string // Original provider ID
	optionValue?: string // Option value if this represents an option
	properties?: any // Option properties
	options?: Array<{ label: string; value: string; description: string }>
}

interface ProviderGroup {
	groupLabel: string
	providers: GroupedProvider[]
}

function groupProviders(
	summaries: ProviderSchemaSummary[],
	providers: Provider[] = []
): ProviderGroup[] | GroupedProvider[] {
	// Create a map for quick provider lookup
	const providerMap = new Map<string, Provider>()
	providers.forEach((p) => providerMap.set(p.id, p))

	// Create groups based on provider configurations
	const groups = new Map<string, GroupedProvider[]>()

	summaries.forEach((summary) => {
		const provider = providerMap.get(summary.id)
		const groupName = summary.title || summary.id // Use summary title as group name

		if (provider?.options && Array.isArray(provider.options)) {
			// Each option becomes a separate provider choice
			const optionProviders: GroupedProvider[] = provider.options.map((opt: any) => ({
				id: `${summary.id}|${opt.value}`, // Unique ID combining provider ID and option value using | separator
				title: opt.label,
				description: opt.description,
				group: groupName,
				// Store the original provider ID and option value for later use
				providerId: summary.id,
				optionValue: opt.value,
				properties: opt.properties || {}
			}))

			groups.set(groupName, optionProviders)
		} else {
			// Fallback for providers without options
			const singleProvider: GroupedProvider = {
				id: summary.id,
				title: summary.title || summary.id,
				description: summary.description || '',
				group: groupName,
				providerId: summary.id
			}

			if (!groups.has(groupName)) {
				groups.set(groupName, [])
			}
			groups.get(groupName)!.push(singleProvider)
		}
	})

	// If only one group, return flat array
	if (groups.size <= 1) {
		const allProviders = Array.from(groups.values()).flat()
		return allProviders
	}

	// Return grouped array
	return Array.from(groups.entries()).map(([groupLabel, providers]) => ({
		groupLabel,
		providers
	}))
}

// Hook to get provider information
export function useProviderInfo(type: string = 'embedding') {
	const [providers, setProviders] = useState<Provider[]>([])
	const [groupedProviders, setGroupedProviders] = useState<ProviderGroup[] | GroupedProvider[]>([])
	const [loading, setLoading] = useState(false)

	const locale = getLocale()

	// Fetch providers
	useEffect(() => {
		// Check if openapi is ready
		if (!window.$app?.openapi) {
			console.warn('window.$app.openapi is not ready yet')
			return
		}

		const kb = new KB(window.$app.openapi)
		let ignore = false
		setLoading(true)

		// Get providers using real API
		kb.GetProviders({ providerType: type, locale })
			.then((response) => {
				if (ignore || !response.data) return

				// Store full provider data
				setProviders(response.data)

				// Convert providers to summaries format
				const list = response.data.map((provider) => ({
					id: provider.id,
					title: provider.label,
					description: provider.description
				}))

				// Create grouped providers
				const grouped = groupProviders(list, response.data)
				setGroupedProviders(grouped)
			})
			.catch((error) => {
				if (!ignore) {
					console.error('Failed to fetch providers:', error)
				}
			})
			.finally(() => !ignore && setLoading(false))

		return () => {
			ignore = true
		}
	}, [type, locale])

	// Get flat options for easier access
	const flatOptions: GroupedProvider[] = React.useMemo(() => {
		const options: GroupedProvider[] = []
		if (Array.isArray(groupedProviders)) {
			groupedProviders.forEach((item) => {
				if ('groupLabel' in item) {
					options.push(...item.providers)
				} else {
					options.push(item)
				}
			})
		}
		return options
	}, [groupedProviders])

	// Function to get provider info by value
	const getProviderInfo = (value: string) => {
		return flatOptions.find((opt) => opt.id === value) || null
	}

	return {
		providers,
		groupedProviders,
		flatOptions,
		loading,
		getProviderInfo
	}
}

export default useProviderInfo
