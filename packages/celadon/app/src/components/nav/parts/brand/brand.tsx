import { BrandMark } from '@/components/base/brand-mark'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'

/* 品牌行：标志与产品名。按规范列头不放品牌（见 design/main-shell.md §三），品牌落在列头下面这一行；
   图标轨里整行收走（由容器查询按列宽隐藏），收起态的入口是列头里的标志。 */
export type NavBrandProps = {
	/* 上区是否折叠：一级菜单的收放键画在 LOGO 右侧 */
	mainFolded: boolean
	onToggleMain: () => void
}

export function NavBrand({ mainFolded, onToggleMain }: NavBrandProps) {
	const { t } = useTranslation()
	const foldLabel = t('shell.navigation.action.fold')
	return (
		<div className='nav__brand-row'>
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
		</div>
	)
}
