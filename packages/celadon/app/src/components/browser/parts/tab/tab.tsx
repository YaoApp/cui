import { Button } from '@/components/base/button'
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

/* 一个标签是一整块（见 browser.less 的 `.browser__tab`）：图标、标题与关闭键在同一块底里，
   块自己表达悬停与当前态，里面两颗按钮都用 plain，不各画一层边框或底。
   标签只做平移，新建与关闭时其余标签跟着挪，文字不参与尺寸投影。 */
export function BrowserTabItem({ tab, active, onActivate, onClose }: BrowserTabItemProps) {
	const { t } = useTranslation()
	return (
		<MotionPanel as="span" position className="browser__tab">
			<Button
				className="browser__tab-button"
				variant="plain"
				size="small"
				role="tab"
				aria-selected={active}
				onClick={() => onActivate(tab.key)}
			>
				<Icon name={tab.closable ? 'i-globe' : 'i-home'} size={16} />
				<span className="browser__tab-label" title={tab.label}>
					{tab.label}
				</span>
			</Button>
			{tab.closable ? (
				<Tooltip label={t('shell.browser.tab.close')} side="bottom">
					<Button
						className="browser__tab-close"
						iconOnly
						variant="plain"
						size="small"
						aria-label={t('shell.browser.tab.close')}
						onClick={() => onClose(tab.key)}
					>
						<Icon name="i-act-close" size={14} />
					</Button>
				</Tooltip>
			) : null}
		</MotionPanel>
	)
}
