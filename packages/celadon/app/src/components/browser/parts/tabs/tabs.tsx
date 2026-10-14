import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import type { BrowserTab } from '../../types'
import { BrowserTabItem } from '../item'

export type BrowserTabsProps = {
	tabs: BrowserTab[]
	activeKey: string
	onActivate: (key: string) => void
	onClose: (key: string) => void
	onNew: () => void
}

/* 标签条：一行标签项加末尾的新建键。新建键恒在，紧跟最后一个标签；
   标签项本身负责「先出现一项、随后在本页里换内容」。 */
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
			{/* 新建键恒在：首页也在自己的窗口里换内容，关掉所有页时首页才回来，
			    所以「只有一个首页标签」时它同样是开第二页的唯一入口 */}
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
		</div>
	)
}
