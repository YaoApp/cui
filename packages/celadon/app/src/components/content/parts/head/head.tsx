import type { CSSProperties, ReactNode } from 'react'
import { Button, Icon } from '@/components/base'
import { MotionPanel } from '@/components/base/motion'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import { useWindowChrome } from '@/platform/client'
import './head.less'

export type ContentHeadProps = {
	/** 这一页的标题；不传只画两侧插槽 */
	title?: string
	/** 导航列是否收起：收起才展示导航操作按钮，并接管交通灯留白 */
	navCollapsed: boolean
	/** 窗口窄到由视口强制收起导航：切换键置灰并给出原因，按下去不会有任何变化 */
	navBlocked?: boolean
	/** 标签浏览器列是否收起：决定切换键的文案与 aria-expanded */
	browserCollapsed: boolean
	/** 窗口窄到放不下标签浏览器那一栏：切换键置灰并给出原因，按下去不会有任何变化 */
	browserBlocked?: boolean
	onToggleNav: () => void
	onToggleBrowser: () => void
	/** 右侧插槽：与当前页有关的动作，放在 Browser 操作按钮之前 */
	trailing?: ReactNode
}

/* 内容列的标题栏（40 像素，与另两列列头等高）。
   三个区域固定：左导航操作按钮 · 中标题 · 右 Browser 操作按钮。
   导航键按那一列的状态展示（列展开时不展示），标签浏览器键恒在；不展示用隐藏实现，占位保留，标题因此不跳。
   它不认识业务：标题与右侧插槽都由装配层给。 */
export function ContentHead({
	title,
	navCollapsed,
	navBlocked = false,
	browserCollapsed,
	browserBlocked = false,
	onToggleNav,
	onToggleBrowser,
	trailing
}: ContentHeadProps) {
	const { t } = useTranslation()
	const chrome = useWindowChrome()
	const navLabel = navCollapsed ? t('shell.navigation.action.expand') : t('shell.navigation.action.collapse')
	const navTitle = navBlocked ? t('shell.navigation.action.blocked') : navLabel
	const browserLabel = browserCollapsed ? t('shell.browser.action.expand') : t('shell.browser.action.collapse')
	const browserTitle = browserBlocked ? t('shell.browser.action.blocked') : browserLabel
	return (
		/* 列头随列平移，不做显隐切换：尺寸变化的投影不允许缩到标题上 */
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
			{/* Windows 的收放键在自绘标题栏里，这一栏不重复展示打开按钮；
			    窗口窄到由视口强制收起时置灰并给出原因，不出现按下去没有反应的键 */}
			<span className='content__head-slot' data-hidden={!navCollapsed || chrome.controls === 'own'}>
				<Tooltip label={navTitle} side='bottom'>
					<span className='content__head-key-wrap' title={navBlocked ? navTitle : undefined}>
						<Button
							className='content__head-key'
							iconOnly
							variant='plain'
							size='small'
							disabled={navBlocked}
							aria-label={navTitle}
							aria-expanded={!navCollapsed}
							onClick={onToggleNav}
						>
							<Icon name='i-panel-left' size={16} />
						</Button>
					</span>
				</Tooltip>
			</span>
			{title ? <h1 className='content__title'>{title}</h1> : null}
			{trailing ? <span className='content__head-trailing'>{trailing}</span> : null}
			{/* 本栏打开时不留键（顶栏有关闭键），收起后出现，用于把本栏找回来；窗口放不下时置灰并给出原因。
			    提示挂在外层 span 上，因为禁用态的按钮收不到指针事件，气泡否则不会出现 */}
			<span className='content__head-slot content__head-slot--browser' data-hidden={!browserCollapsed}>
				<Tooltip label={browserTitle} side='bottom'>
					<span className='content__head-key-wrap' title={browserBlocked ? browserTitle : undefined}>
						<Button
							className='content__head-key content__head-key--browser'
							iconOnly
							variant='plain'
							size='small'
							disabled={browserBlocked}
							aria-label={browserTitle}
							aria-expanded={!browserCollapsed}
							onClick={onToggleBrowser}
						>
							<Icon name='i-panel-right' size={16} />
						</Button>
					</span>
				</Tooltip>
			</span>
		</MotionPanel>
	)
}
