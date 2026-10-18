import type { ReactNode } from 'react'
import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Icon } from '@/components/base/icon'
import { ScrollArea } from '@/components/base/scroll-area'
import { useTranslation } from '@/platform/i18n'
import type { IconId } from '@/platform/icons'
import type { NavItem } from '../../nav.types'

export type NavMenuProps = {
	/* 导航列的宽度：弹层按它减去两侧内距取宽，保证左右内距相等 */
	columnWidth: number
	items: NavItem[]
	/** 「当前 · 场景」的完整文字，作为触发元素的无障碍名 */
	currentLabel: string
	/** 当前场景的图标 */
	sceneIcon: IconId
	onSelect: (item: NavItem) => void
}

/* 折叠态的找回：触发元素（场景图标 + 场景名 + 向上的箭头）、菜单面板与条目状态都在这一件里。
   只在点击或键盘激活时弹出，指针经过不弹：这一行紧挨底部账户入口，悬停弹出容易误触。
   菜单弹在触发元素的上方、对齐它的左边，宽度不超过导航列本身（design/main-shell.md §三）。 */
export function NavMenu({ columnWidth, items, currentLabel, sceneIcon, onSelect }: NavMenuProps) {
	const { t } = useTranslation()

	const trigger: ReactNode = (
		<>
			<Icon name={sceneIcon} size={16} />
			<span className='nav__label'>{currentLabel}</span>
			<Icon name='i-up' size={16} />
		</>
	)

	return (
		<BaseMenu.Root>
			<BaseMenu.Trigger
				nativeButton={false}
				render={<span className='nav__current' />}
				aria-label={currentLabel}
			>
				{trigger}
			</BaseMenu.Trigger>
			<BaseMenu.Portal>
				<BaseMenu.Positioner
					side='top'
					align='start'
					alignOffset={-12}
					sideOffset={4}
					className='nav__menu-positioner'
				>
					<BaseMenu.Popup
						className='nav__menu'
						style={{ inlineSize: `calc(${columnWidth}px - var(--spacing-8) * 2)` }}
						aria-label={t('shell.navigation.main')}
					>
						<ScrollArea size='small' className='nav__menu-scroll'>
							{items.map((item) => (
								<BaseMenu.Item
									key={item.key}
									className='nav__menu-item nav-item'
									aria-current={item.active ? 'page' : undefined}
									onClick={() => onSelect(item)}
								>
									<Icon name={item.icon} size={18} />
									<span className='nav__label'>{t(item.labelKey)}</span>
									{item.badge ? (
										<span className='nav__badge'>{item.badge}</span>
									) : null}
								</BaseMenu.Item>
							))}
						</ScrollArea>
					</BaseMenu.Popup>
				</BaseMenu.Positioner>
			</BaseMenu.Portal>
		</BaseMenu.Root>
	)
}
