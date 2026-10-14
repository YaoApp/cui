import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserTab } from '../../types'
import { BrowserTabItem } from './tab'

export type BrowserTabsProps = {
	tabs: BrowserTab[]
	activeKey: string
	onActivate: (key: string) => void
	onClose: (key: string) => void
	onNew: () => void
}

/* 标签条：一行标签加末尾的新建键。新建键紧跟最后一个标签；
   只有一个首页标签时不画新建键（不渲染，不是隐藏），只留条外的下拉键。 */
export function BrowserTabs({ tabs, activeKey, onActivate, onClose, onNew }: BrowserTabsProps) {
	const { t } = useTranslation()
	return (
		<div className="browser__tabs-row" role="tablist" aria-label={t('shell.browser.label')}>
			{tabs.map((tab) => (
				<BrowserTabItem
					key={tab.key}
					tab={tab}
					active={tab.key === activeKey}
					onActivate={onActivate}
					onClose={onClose}
				/>
			))}
			{tabs.length > 1 ? (
				<Tooltip label={t('shell.browser.tab.new')} side="bottom">
					<Button
						className="browser__new"
						iconOnly
						variant="plain"
						size="small"
						aria-label={t('shell.browser.tab.new')}
						onClick={onNew}
					>
						<Icon name="i-plus" size={16} />
					</Button>
				</Tooltip>
			) : null}
		</div>
	)
}
