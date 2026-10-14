import type { CSSProperties } from 'react'
import { BrandMark } from '@/components/base/brand-mark'
import { Button } from '@/components/base/button'
import { Icon } from '@/components/base/icon'
import { Tooltip } from '@/components/base/tooltip'
import { useTranslation } from '@/platform/i18n'
import { useWindowChrome } from '@/platform/client'

export type NavHeaderProps = {
	onToggle: () => void

	/* 上区是否折叠；一级菜单的收放键画在列头里 */
	mainFolded: boolean
	onToggleMain: () => void
}

/* 列头：Web 上右侧依次是一级菜单的收放键与整列收起键；客户端列头只留整列收起键，
   一级菜单的收放键在品牌那一行（`parts/brand`）。品牌在列头下面那一行，列头里不重复画，
   因此不会出现两个标志。macOS 上整行按 `--nav-head-inset` 给原生交通灯让位；
   平台判定来自 `platform/client` 的钩子。 */
export function NavHeader({ mainFolded, onToggleMain, onToggle }: NavHeaderProps) {
	const { t } = useTranslation()
	const chrome = useWindowChrome()
	/* 这颗键只在整列展开时能看见（收起后整列为零宽），因此名字固定为收起、状态固定为已展开 */
	const label = t('shell.navigation.action.collapse')
	const foldLabel = t('shell.navigation.action.fold')
	return (
		<div
			className='nav__header'
			data-controls={chrome.controls}
			style={
				{
					/* macOS：头部内块给原生交通灯让位 */
					'--nav-head-inset': chrome.controls === 'native' ? 'var(--traffic-lights-width)' : '0px'
				} as CSSProperties
			}
		>
			{chrome.controls === 'none' ? (
				<>
					{/* Web 展开态：LOGO 不可点，右侧依次是一级菜单的收放键与整列收起键 */}
					<BrandMark name='brand-yao-agents' size={24} label={t('app.name')} />
					<span className='nav__brand'>{t('app.name')}</span>
					<Tooltip label={foldLabel} side='bottom'>
						<Button
							className='nav__fold'
							iconOnly
							variant='plain'
							size='medium'
							aria-label={foldLabel}
							aria-expanded={!mainFolded}
							onClick={onToggleMain}
						>
							<Icon name={mainFolded ? 'i-dock' : 'i-undock'} size={16} />
						</Button>
					</Tooltip>
					<Tooltip label={label} side='bottom'>
						<Button
							className='nav__toggle'
							iconOnly
							variant='plain'
							size='medium'
							aria-label={label}
							aria-expanded={true}
							onClick={onToggle}
						>
							<Icon name='i-panel-left' size={16} />
						</Button>
					</Tooltip>
				</>
			) : (
				<>
					{/* 客户端：一级菜单的收放键在品牌那一行；列头只留整列收起键，
					     Windows 的列头整块不渲染，那个键由壳与内容列头承担 */}
					<Tooltip label={label} side='bottom'>
						<Button
							className='nav__toggle'
							iconOnly
							variant='plain'
							size='medium'
							aria-label={label}
							aria-expanded={true}
							onClick={onToggle}
						>
							<Icon name='i-panel-left' size={16} />
						</Button>
					</Tooltip>
				</>
			)}
		</div>
	)
}
