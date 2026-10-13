import type { CSSProperties, ReactNode } from 'react'
import { Button, Icon } from '@/components/base'
import { MotionPanel } from '@/components/base/motion'
import { useTranslation } from '@/platform/i18n'
import { useWindowChrome } from '@/platform/client'
import './head.less'

export type ContentHeadProps = {
	/** 这一页的标题；不传只画两侧插槽 */
	title?: string
	/** 导航列是否收起：收起才展示导航操作按钮，并接管交通灯留白 */
	navCollapsed: boolean
	/** 标签浏览器列是否收起：收起才展示 Browser 操作按钮 */
	browserCollapsed: boolean
	onToggleNav: () => void
	onToggleBrowser: () => void
	/** 右侧插槽：与当前页有关的动作，放在 Browser 操作按钮之前 */
	trailing?: ReactNode
}

/* 内容列的标题栏（40 像素，与另两列列头等高，见内部文档「Content 标题栏」）。
   三个区域固定：左导航操作按钮 · 中标题 · 右 Browser 操作按钮。
   两个按钮按各自那一列的状态展示：列展开时不展示。不展示用隐藏实现，占位保留，标题因此不跳。
   它不认识业务：标题与右侧插槽都由装配层给。 */
export function ContentHead({
	title,
	navCollapsed,
	browserCollapsed,
	onToggleNav,
	onToggleBrowser,
	trailing
}: ContentHeadProps) {
	const { t } = useTranslation()
	const chrome = useWindowChrome()
	const navLabel = navCollapsed ? t('shell.navigation.action.expand') : t('shell.navigation.action.collapse')
	const browserLabel = browserCollapsed ? t('shell.browser.action.expand') : t('shell.browser.action.collapse')
	return (
		/* 列头随列平移，不做显隐切换：尺寸变化的投影不允许缩到标题上（plan/08-layout-motion.md §3 第 4 处） */
		<MotionPanel
			as='header'
			position
			className='content__head'
			data-controls={chrome.controls}
			data-nav={navCollapsed ? 'collapsed' : 'expanded'}
			style={
				{
					/* macOS 且导航收起：这一行接管交通灯留白 */
					'--head-inset':
						navCollapsed && chrome.controls === 'native' ? 'var(--traffic-lights-width)' : '0px'
				} as CSSProperties
			}
		>
			{/* Windows 的收放键在自绘标题栏里，这一栏不重复展示打开按钮 */}
			<span className='content__head-slot' data-hidden={!navCollapsed || chrome.controls === 'own'}>
				<Button
					className='content__head-key'
					iconOnly
					variant='plain'
					size='small'
					aria-label={navLabel}
					aria-expanded={!navCollapsed}
					onClick={onToggleNav}
				>
					<Icon name='i-panel-left' size={16} />
				</Button>
			</span>
			{title ? <h1 className='content__title'>{title}</h1> : null}
			{trailing ? <span className='content__head-trailing'>{trailing}</span> : null}
			{/* 标签浏览器那一栏的切换键恒在列头右端：展开与收起都从这里切，不必先去菜单里找「收掉这一栏」 */}
			<span className='content__head-slot content__head-slot--browser'>
				<Button
					className='content__head-key content__head-key--browser'
					iconOnly
					variant='plain'
					size='small'
					aria-label={browserLabel}
					aria-expanded={!browserCollapsed}
					onClick={onToggleBrowser}
				>
					<Icon name='i-panel-right' size={16} />
				</Button>
			</span>
		</MotionPanel>
	)
}
