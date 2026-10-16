import type { IconId } from '@/platform/icons'

/** 标签浏览器里的一页 */
export type BrowserTab = {
	/** 一页的稳定标识：页里换内容时不变 */
	key: string
	/** 标签上显示的名字 */
	label: string
	/** 这一页能不能关：还是首页那一页时不能，换上目标成普通页后就能 */
	closable: boolean
	/** 标签上的图形；不给时按是否可关推（首页 i-home、其余 i-globe） */
	icon?: IconId
}
