/** 标签浏览器里的一页 */
export type BrowserTab = {
	/** 一页的稳定标识 */
	key: string
	/** 标签上显示的名字 */
	label: string
	/** 首页不可关 */
	closable: boolean
}
