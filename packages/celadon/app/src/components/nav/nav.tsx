import './nav.less'
import { type ReactNode } from 'react'
import type { I18nKey } from '@/platform/i18n/i18n-types'
import type { IconId } from '@/platform/icons'
import { useTranslation } from '@/platform/i18n'
import { useWindowChrome } from '@/platform/client'
import { NavBrand } from './parts/brand'
import { NavFooter } from './parts/footer'
import { NavHeader } from './parts/header'
import { NavMain } from './parts/main'
import { NavScene } from './parts/scene'
import { useNavResize } from './hooks/use-nav-resize'
import type { NavItem } from './nav.types'

export type NavProps = {
	items: NavItem[]
	/** 底部一行右侧的快捷图标：与主导航里的工作空间、电脑是同一份内容 */
	shortcuts: NavItem[]
	/** 当前场景名字在语言包里的键；没有场景时用 `shell.navigation.scene.none` */
	scene: I18nKey
	/** 当前场景的图标 */
	sceneIcon: IconId
	/** 底部一行的账户菜单（触发按钮与弹层都在里面），由装配层给 */
	userMenu?: ReactNode
	/** 整列收起（视口驱动的那一档由样式按视口给，这里是用户偏好） */
	collapsed: boolean
	onToggle: () => void
	/** 主导航那一段折叠 */
	mainFolded: boolean
	onToggleMain: () => void
	/** 「当前」区里的二级导航，由业务域以插槽给（没有也要把那一行画出来） */
	children?: ReactNode
	onSelect: (item: NavItem) => void
	/** 用户拖过的导航列宽度（像素）；null 表示跟随 `--nav-default` */
	navWidth: number | null
	onNavWidth: (width: number | null) => void
}

/* 导航列：四段（头部内块 · 上区主导航 · 下区当前 · 底部一行），两处收起分开 ——
   头部键收整列，上区自己的键只折主导航（见 design/main-shell.md §三）。
   组件不认识业务：条目、「当前」区的内容、账号名与两处收起都由装配层给。 */
export function Nav({
	items,
	shortcuts,
	scene,
	sceneIcon,
	userMenu,
	collapsed,
	onToggle,
	mainFolded,
	onToggleMain,
	children,
	onSelect,
	navWidth,
	onNavWidth
}: NavProps) {
	const { t } = useTranslation()
	const chrome = useWindowChrome()

	const select = (item: NavItem) => {
		onSelect(item)
	}
	const currentLabel = t(scene)
	const resize = useNavResize(navWidth, onNavWidth)

	return (
		<nav
			ref={resize.ref}
			data-main={mainFolded ? 'folded' : 'expanded'}
			data-collapsed={collapsed ? 'true' : 'false'}
			className={['nav', resize.dragging ? 'nav--resizing' : '']
				.filter(Boolean)
				.join(' ')}
			aria-label={t('shell.navigation.label')}
			/* 整列收起后整条不可见：从无障碍树与焦点顺序里摘掉，键盘不会落进零宽的列 */
			aria-hidden={collapsed || undefined}
			inert={collapsed || undefined}
		>
			{chrome.controls === 'own' ? null : (
				<NavHeader
					mainFolded={mainFolded}
					onToggle={onToggle}
					onToggleMain={onToggleMain}
				/>
			)}
			{chrome.controls === 'none' ? null : <NavBrand mainFolded={mainFolded} onToggleMain={onToggleMain} />}
			<NavMain items={items} folded={mainFolded} onSelect={select} />
			<NavScene
				items={items}
				columnWidth={resize.current}
				currentLabel={currentLabel}
				sceneIcon={sceneIcon}
				folded={mainFolded}
				onSelect={select}
				onUnfold={onToggleMain}
			>
				{children}
			</NavScene>
			<NavFooter menu={userMenu} shortcuts={shortcuts} onSelect={select} />
			<>
				<span className='nav__grip' aria-hidden='true' />
				<div
					className='nav__resize'
					role='separator'
					aria-orientation='vertical'
					aria-label={t('shell.navigation.resize')}
					aria-valuemin={resize.min}
					aria-valuemax={resize.max}
					aria-valuenow={resize.current}
					tabIndex={0}
					data-no-drag
					onPointerEnter={resize.onPointerEnter}
					onPointerLeave={resize.onPointerLeave}
					onPointerDown={resize.onPointerDown}
					onKeyDown={resize.onKeyDown}
					onDoubleClick={resize.onDoubleClick}
				/>
			</>
		</nav>
	)
}
