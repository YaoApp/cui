import { useState, useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { SidebarTab } from '@/layouts/wrappers/Chatbox/Container/types'

export type { SidebarTab }

export interface UseSidebarTabsOptions {
	onNavigate?: (url: string) => void
}

export interface UseSidebarTabsReturn {
	tabs: SidebarTab[]
	activeTabId: string | null
	activeTabUrl: string | null
	addTab: (url: string, title: string, icon?: string, newWindowUrl?: string) => void
	removeTab: (tabId: string) => void
	activateTab: (tabId: string) => void
	updateTabTitle: (url: string, title: string) => void
	closeOtherTabs: () => void
	closeAllTabs: () => void
}

const getBaseUrl = (url: string): string => {
	try {
		const urlObj = new URL(url, window.location.origin)
		if (urlObj.origin !== window.location.origin) {
			return urlObj.origin + urlObj.pathname
		}
		return urlObj.pathname
	} catch {
		return url.split('?')[0]
	}
}

export const useSidebarTabs = (options?: UseSidebarTabsOptions): UseSidebarTabsReturn => {
	const [tabs, setTabs] = useState<SidebarTab[]>([])
	const [activeTabId, setActiveTabId] = useState<string | null>(null)

	const activeTab = tabs.find((t) => t.id === activeTabId)
	const activeTabUrl = activeTab?.url || null

	const addTab = useCallback(
		(url: string, title: string, icon?: string, newWindowUrl?: string) => {
			const baseUrl = getBaseUrl(url)

			setTabs((prev) => {
				const existing = prev.find((tab) => getBaseUrl(tab.url) === baseUrl)
				if (existing) {
					setActiveTabId(existing.id)
					options?.onNavigate?.(url)
					return prev.map((tab) =>
						tab.id === existing.id
							? { ...tab, url, title: title || tab.title, timestamp: Date.now(), newWindowUrl }
							: tab
					)
				}

				const newTab: SidebarTab = { id: nanoid(), url, title, icon, timestamp: Date.now(), newWindowUrl }
				setActiveTabId(newTab.id)
				options?.onNavigate?.(url)
				return [...prev, newTab]
			})
		},
		[options?.onNavigate]
	)

	const removeTab = useCallback(
		(tabId: string) => {
			setTabs((prev) => {
				const index = prev.findIndex((t) => t.id === tabId)
				const newTabs = prev.filter((t) => t.id !== tabId)

				setActiveTabId((currentActive) => {
					if (currentActive !== tabId) return currentActive
					if (newTabs.length === 0) return null
					const newIndex = index > 0 ? index - 1 : 0
					const nextTab = newTabs[newIndex]
					options?.onNavigate?.(nextTab.url)
					return nextTab.id
				})

				return newTabs
			})
		},
		[options?.onNavigate]
	)

	const activateTab = useCallback(
		(tabId: string) => {
			setActiveTabId(tabId)
			setTabs((prev) => {
				const tab = prev.find((t) => t.id === tabId)
				if (tab) options?.onNavigate?.(tab.url)
				return prev
			})
		},
		[options?.onNavigate]
	)

	const updateTabTitle = useCallback((url: string, title: string) => {
		const baseUrl = getBaseUrl(url)
		setTabs((prev) =>
			prev.map((tab) =>
				getBaseUrl(tab.url) === baseUrl ? { ...tab, title } : tab
			)
		)
	}, [])

	const closeOtherTabs = useCallback(() => {
		setTabs((prev) => {
			const active = prev.find((t) => t.id === activeTabId)
			return active ? [active] : []
		})
	}, [activeTabId])

	const closeAllTabs = useCallback(() => {
		setTabs([])
		setActiveTabId(null)
	}, [])

	return {
		tabs,
		activeTabId,
		activeTabUrl,
		addTab,
		removeTab,
		activateTab,
		updateTabTitle,
		closeOtherTabs,
		closeAllTabs
	}
}
