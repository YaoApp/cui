import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { useTranslation } from '@/platform/i18n'
import type { BrowserTab } from '../../types'
import './tab-menu.less'

export type TabMenuActions = {
	onActivate: (key: string) => void
	onClose: (key: string) => void
	onRefresh?: (key: string) => void
	onCloseOthers?: (key: string) => void
	onCloseAll?: () => void
}

/** 新栏的标签菜单：右键菜单（刷新 / 关闭 / 关闭其它 / 关闭全部）与溢出菜单（放不下的页 + 同几项）。
    与主栏那两套菜单同一口径，只作用于本栏这一组标签。 */
export function TabContextMenu({
	tab,
	point,
	actions,
	onOpenChange
}: {
	tab: BrowserTab | null
	point: { x: number; y: number } | null
	actions: TabMenuActions
	onOpenChange: (open: boolean) => void
}) {
	const { t } = useTranslation()
	if (!tab || !point) return null
	return (
		<BaseMenu.Root open onOpenChange={onOpenChange}>
			<BaseMenu.Portal>
				<BaseMenu.Positioner
					className="browser__menu-layer"
					side="bottom"
					align="start"
					sideOffset={4}
					anchor={{
						getBoundingClientRect: () => ({
							x: point.x,
							y: point.y,
							top: point.y,
							left: point.x,
							right: point.x,
							bottom: point.y,
							width: 0,
							height: 0,
							toJSON: () => ({})
						})
					}}
				>
					<BaseMenu.Popup className="browser__menu" aria-label={t('shell.browser.label')}>
						<BaseMenu.Item className="browser__menu-item" onClick={() => actions.onRefresh?.(tab.key)}>
							<Icon name="i-act-refresh" size={16} />
							<span>{t('shell.browser.tab.refresh')}</span>
						</BaseMenu.Item>
						<BaseMenu.Item className="browser__menu-item" onClick={() => actions.onClose(tab.key)}>
							<Icon name="i-act-close" size={16} />
							<span>{t('shell.browser.tab.close')}</span>
						</BaseMenu.Item>
						<BaseMenu.Item className="browser__menu-item" onClick={() => actions.onCloseOthers?.(tab.key)}>
							<Icon name="i-act-close" size={16} />
							<span>{t('shell.browser.tab.closeOthers')}</span>
						</BaseMenu.Item>
						<BaseMenu.Item className="browser__menu-item" onClick={() => actions.onCloseAll?.()}>
							<Icon name="i-act-close" size={16} />
							<span>{t('shell.browser.tab.closeAll')}</span>
						</BaseMenu.Item>
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	)
}

/** 新栏的溢出菜单：放不下的那些页点一条即切过去，下面跟本栏的关闭项 */
export function TabOverflowMenu({
	hiddenTabs,
	actions,
	label
}: {
	hiddenTabs: BrowserTab[]
	actions: TabMenuActions
	label: string
}) {
	const { t } = useTranslation()
	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger
				className="browser__more"
				aria-label={t('shell.browser.action.more')}
				render={<Button iconOnly variant="plain" size="small" />}
			>
				<Icon name="i-down" size={16} />
			</BaseMenu.Trigger>
			<BaseMenu.Portal>
				<BaseMenu.Positioner className="browser__menu-layer" side="bottom" align="end" sideOffset={4}>
					<BaseMenu.Popup className="browser__menu" aria-label={label}>
						{hiddenTabs.map((tab) => (
							<BaseMenu.Item key={tab.key} className="browser__menu-item" onClick={() => actions.onActivate(tab.key)}>
								<Icon name={tab.icon ?? 'i-globe'} size={16} />
								<span className="browser__menu-label">{tab.label}</span>
							</BaseMenu.Item>
						))}
						{hiddenTabs.length > 0 ? (
							<span className="browser__menu-separator" role="separator" aria-orientation="horizontal" />
						) : null}
						<BaseMenu.Item className="browser__menu-item" onClick={() => actions.onCloseAll?.()}>
							<Icon name="i-act-close" size={16} />
							<span>{t('shell.browser.tab.closeAll')}</span>
						</BaseMenu.Item>
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	)
}
