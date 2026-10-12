import type { CSSProperties } from 'react'
import { BrandMark } from '@/components/base/brand-mark'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import { useWindowChrome } from '@/platform/client'

export type NavHeaderProps = {
	collapsed: boolean
	onToggle: () => void

	/* 上区是否折叠；一级菜单的收放键现在画在列头里 */
	mainFolded: boolean
	onToggleMain: () => void
}

/* 列头：收起态画标志，指针停在标志上时它淡化并浮出切换图标，点它展开（Web 图标轨里这是唯一出口）；
   展开态只画切换键。品牌在列头下面那一行（`parts/brand`），列头里不重复画，因此不会出现两个标志。
   macOS 上整行按 `--nav-head-inset` 给原生交通灯让位；平台判定来自 `platform/client` 的钩子。 */
export function NavHeader({ mainFolded, onToggleMain, collapsed, onToggle }: NavHeaderProps) {
	const { t } = useTranslation()
	const chrome = useWindowChrome()
	const label = collapsed ? t('shell.navigation.action.expand') : t('shell.navigation.action.collapse')
	return (
		<div
			className='nav__header'
			data-controls={chrome.controls}
			data-no-drag
			style={
				{
					/* macOS：头部内块给原生交通灯让位 */
					'--nav-head-inset': chrome.controls === 'native' ? 'var(--traffic-lights-width)' : '0px'
				} as CSSProperties
			}
			{...chrome.dragProps}
		>
			{/* 一级菜单的收放键：与整列收起键同一行，排在最左 */}
			<Tooltip label={t('shell.navigation.action.fold')} side='bottom'>
				<Button
					className='nav__fold'
					iconOnly
					variant='plain'
					size='small'
					aria-label={t('shell.navigation.action.fold')}
					aria-expanded={!mainFolded}
					onClick={onToggleMain}
				>
					<Icon name={mainFolded ? 'i-dock' : 'i-undock'} size={16} />
				</Button>
			</Tooltip>
			{collapsed && chrome.controls === 'none' ? (
				<Tooltip label={label} side='bottom'>
					<Button
						className='nav__logo'
						variant='plain'
						aria-label={label}
						aria-expanded={!collapsed}
						onClick={onToggle}
					>
						<span className='nav__logo-mark'>
							<BrandMark name='brand-yao-agents' size={24} label={t('app.name')} />
						</span>
						<span className='nav__logo-overlay'>
							<Icon name='i-panel-left' size={16} />
						</span>
					</Button>
				</Tooltip>
			) : chrome.controls === 'none' ? (
				<>
					{/* Web 展开态：LOGO 不可点，切换键在它右侧 */}
					<BrandMark name='brand-yao-agents' size={24} label={t('app.name')} />
					<span className='nav__brand'>{t('app.name')}</span>
					<Tooltip label={label} side='bottom'>
						<Button
							className='nav__toggle'
							iconOnly
							variant='plain'
							size='small'
							aria-label={label}
							aria-expanded
							onClick={onToggle}
						>
							<Icon name='i-panel-left' size={16} />
						</Button>
					</Tooltip>
				</>
			) : (
				<Tooltip label={label} side='bottom'>
					<Button
						className='nav__toggle'
						iconOnly
						variant='plain'
						size='small'
						aria-label={label}
						aria-expanded
						onClick={onToggle}
					>
						<Icon name='i-panel-left' size={16} />
					</Button>
				</Tooltip>
			)}
		</div>
	)
}
