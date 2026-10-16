import { useEffect, useRef, useState, type RefObject } from 'react'
import type { BrowserTab } from '../types'

export type TabOverflow = {
	/** 渲染在标签行里、看得见的那些页，按原顺序 */
	visibleKeys: string[]
	/** 放不下、进下拉菜单的那些页，按原顺序 */
	hiddenTabs: BrowserTab[]
}

export type TabOverflowResult = {
	/** 挂在裁切容器上：它的可用宽度决定可见个数，行里的标签宽度也从这里量 */
	containerRef: RefObject<HTMLDivElement | null>
	overflow: TabOverflow
}

/* 标签条的溢出测量。标签行里始终渲染全部标签：放不下的那些由 data-hidden 收成不可见、
   脱离排布（见 item 与样式），宽度仍量得到，所以不必另做一份测量用的副本。
   预算里先扣掉行内的新建键与它前面那一档间距，新建键因此永远留得住。

   可见的是从头开始能放下的那一段；一个都放不下时至少留一项，并优先留当前页。
   当前页落在后面时它进菜单，菜单里会标出当前态。 */
export function useTabOverflow(tabs: BrowserTab[], activeKey: string): TabOverflowResult {
	const containerRef = useRef<HTMLDivElement>(null)
	const [overflow, setOverflow] = useState<TabOverflow>({
		visibleKeys: tabs.map((tab) => tab.key),
		hiddenTabs: []
	})
	const signature = useRef('')

	useEffect(() => {
		const container = containerRef.current
		if (!container || typeof ResizeObserver === 'undefined') return

		const compute = () => {
			const row = container.querySelector<HTMLElement>('.browser__tabs-row')
			if (!row) return
			const items = Array.from(row.querySelectorAll<HTMLElement>('.browser__tab'))
			if (items.length === 0) return

			const gap = Math.round(Number.parseFloat(getComputedStyle(row).columnGap) || 0)
			const newKey = row.querySelector<HTMLElement>('.browser__new')
			const reserve = newKey ? Math.round(newKey.getBoundingClientRect().width) + gap : 0

			/* 宽度取整再累加，留一像素余量，与标题截断的判定口径一致 */
			let budget = Math.round(container.clientWidth) - reserve - 1
			let fits = 0
			for (let index = 0; index < items.length; index += 1) {
				const cost = Math.round(items[index].getBoundingClientRect().width) + (index > 0 ? gap : 0)
				if (budget - cost < 0) break
				budget -= cost
				fits += 1
			}
			/* 从头开始能放下的那一段，条上因此始终是连续的一段；一个都放不下时只留当前页，
			   没有当前页则留第一项。当前页落在溢出段里时，菜单里那一项标出当前态 */
			const keys =
				fits > 0
					? tabs.slice(0, fits).map((tab) => tab.key)
					: tabs.some((tab) => tab.key === activeKey)
						? [activeKey]
						: tabs.slice(0, 1).map((tab) => tab.key)

			/* 签名要连标签全集一起比：可见段没变、但后面又开了新页时，
			   隐藏段变了，也要把新的隐藏项交给菜单 */
			const next =
				keys.join('|') + '@' + tabs.map((tab) => `${tab.key}:${tab.label}`).join('|')
			if (next === signature.current) return
			signature.current = next
			setOverflow({
				visibleKeys: keys,
				hiddenTabs: tabs.filter((tab) => !keys.includes(tab.key))
			})
		}

		compute()
		const observer = new ResizeObserver(compute)
		observer.observe(container)
		return () => observer.disconnect()
	}, [tabs, activeKey])

	return { containerRef, overflow }
}
