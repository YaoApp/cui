import { Icon } from '@/components/base/icon'
import { MotionPanel } from '@/components/base/motion'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserTab } from '../../types'

export type BrowserTabItemProps = {
	tab: BrowserTab
	/** 是否是当前页 */
	active: boolean
	onActivate: (key: string) => void
	onClose: (key: string) => void
}

/* 一个标签项：整块是标签本体，悬停、当前、焦点、点选与中键都由它自己接；
   块里只放图标与标题，关闭键是块内的兄弟控件，点它不激活标签。
   标签只做平移，新建与关闭时其余标签跟着挪，文字不参与尺寸投影。 */
export function BrowserTabItem({ tab, active, onActivate, onClose }: BrowserTabItemProps) {
	const { t } = useTranslation()
	return (
		<MotionPanel
			as="span"
			position
			className="browser__tab"
			data-active={active || undefined}
			onAuxClick={(event) => {
				// 中键关闭（首页不可关）
				if (event.button === 1 && tab.closable) {
					event.preventDefault()
					onClose(tab.key)
				}
			}}
		>
			<span
				className="browser__tab-main"
				role="tab"
				aria-selected={active}
				onClick={() => onActivate(tab.key)}
			>
				<Icon name={tab.closable ? 'i-globe' : 'i-home'} size={16} />
				<span className="browser__tab-label" title={tab.label}>
					{tab.label}
				</span>
			</span>
			{tab.closable ? (
				<Tooltip label={t('shell.browser.tab.close')} side="bottom">
					{/* 关闭键不套基础 Button：它会把图标统一成 16 档，标签里的叉号按解剖要取 14 档。
					    键盘关闭走标签上的 Delete（见键盘口径），这一颗不进 Tab 序 */}
					<span
						className="browser__tab-close"
						role="button"
						tabIndex={-1}
						aria-label={t('shell.browser.tab.close')}
						onClick={() => onClose(tab.key)}
					>
						<Icon name="i-act-close" size={14} />
					</span>
				</Tooltip>
			) : null}
		</MotionPanel>
	)
}
