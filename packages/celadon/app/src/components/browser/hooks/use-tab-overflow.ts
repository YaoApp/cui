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

   可见的是从头开始能放下的那一段。当前页一定留在条上：它放不进这一段时，替掉这一段末尾那一项，
   被替下来的那一项进菜单，可见段与数组次序之间因此有一次隐性的次序调整。
   一个都放不下时只留当前页，没有当前页则留第一项。 */
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
			/* 条上从头放下多少就是多少；当前页落在放不下的那一段里时，用它替掉可见段末尾那一项，
			   被替下来的那一项连同更后面的都进菜单。这样当前页始终在条上（激活态看得到），
			   代价是可见段与数组次序之间有一次隐性的次序调整。一个都放不下时只留当前页，
			   没有当前页则留第一项 */
			let keys = tabs.slice(0, fits).map((tab) => tab.key)
			if (fits > 0 && !keys.includes(activeKey)) {
				const anchor = tabs.find((tab) => tab.key === activeKey)
				if (anchor) keys = [...keys.slice(0, fits - 1), anchor.key]
			} else if (fits === 0) {
				keys = tabs.some((tab) => tab.key === activeKey)
					? [activeKey]
					: tabs.slice(0, 1).map((tab) => tab.key)
			}

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
