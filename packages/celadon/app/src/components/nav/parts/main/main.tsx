import { ScrollArea } from '@/components/base/scroll-area'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from '@/platform/i18n'
import { NavList } from '../list'
import type { NavItem } from '../../nav.types'

export type NavMainProps = {
	items: NavItem[]
	/** 上区是否折叠 */
	folded: boolean
	onSelect: (item: NavItem) => void
}

/* 上区 · 主导航：六项列表。折叠只折这一段，不是整列（`design/main-shell.md` §三）；
   折叠后留「当前」那一行与展开键找回。 */
export function NavMain({ items, folded, onSelect }: NavMainProps) {
	const { t } = useTranslation()
	const reduced = useReducedMotion()
	return (
		<div className={folded ? 'nav__main nav__main--folded' : 'nav__main'}>
			{/* 折叠用 Motion 动高度（auto ↔ 0）：grid 行高过渡在折叠体上收不干净，也更容易被覆盖 */}
			<motion.div
				className='nav__main-body'
				initial={false}
				animate={{ height: folded ? 0 : 'auto', opacity: folded ? 0 : 1 }}
				transition={
					reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }
				}
				style={{ overflow: 'hidden' }}
			>
				<ScrollArea className='nav__scroll' size='small'>
					<NavList items={items} label={t('shell.navigation.main')} onSelect={onSelect} />
				</ScrollArea>
			</motion.div>
		</div>
	)
}
