import { BrandMark } from '@/components/base/brand-mark'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { MotionPanel } from '@/components/base/motion'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'

/* 品牌行：标志与产品名，只在客户端出现（Web 的列头里已经画了品牌与两个键）。
   一级菜单的收放键画在品牌行右端（见 design/main-shell.md §三）。 */
export type NavBrandProps = {
	/* 上区是否折叠：一级菜单的收放键画在品牌行右端 */
	mainFolded: boolean
	onToggleMain: () => void
}

export function NavBrand({ mainFolded, onToggleMain }: NavBrandProps) {
	const { t } = useTranslation()
	const foldLabel = t('shell.navigation.action.fold')
	return (
		/* 品牌行随列平移，不做显隐切换（plan/08-layout-motion.md §3 第 3 处） */
		<MotionPanel position className='nav__brand-row'>
			<BrandMark name='brand-yao-agents' size={24} label={t('app.name')} />
			<span className='nav__brand'>{t('app.name')}</span>
			<Tooltip label={foldLabel} side='bottom'>
				<Button
					className='nav__fold'
					iconOnly
					variant='plain'
					size='small'
					aria-label={foldLabel}
					aria-expanded={!mainFolded}
					onClick={onToggleMain}
				>
					<Icon name={mainFolded ? 'i-dock' : 'i-undock'} size={16} />
				</Button>
			</Tooltip>
		</MotionPanel>
	)
}
