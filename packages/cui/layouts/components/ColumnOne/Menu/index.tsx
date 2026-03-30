import { useDeepCompareEffect } from 'ahooks'
import { Input, Menu, Tooltip } from 'antd'
import clsx from 'clsx'
import { useState } from 'react'

import { Icon } from '@/widgets'
import { history, Link } from '@umijs/max'

import { useMenuItems, useSearch } from './hooks'
import styles from './index.less'

import type { IPropsLogo, IPropsMenu } from '../../../types'
import type { MenuProps } from 'antd'
import Logo from './Logo'
import { Utils } from './utils'

const Index = (props: IPropsMenu) => {
	const { locale_messages, parent, items, menu_selected_keys, visible, nav_props } = props
	const { visible_input, current_items, toggle, setInput } = useSearch(items)
	// const { menu_items } = useMenuItems(current_items)
	const [openKeys, setOpenKeys] = useState<Array<string>>([])

	const license = nav_props?.yao_metadata?.license
	const showWebsiteLink = !license?.valid || license?.edition === 'community'
	const licenseLabel = license?.edition
		? license.edition.charAt(0).toUpperCase() + license.edition.slice(1) + ' Edition'
		: 'Unlicensed'

	useDeepCompareEffect(() => {
		setOpenKeys(menu_selected_keys)
	}, [menu_selected_keys])

	const props_logo: IPropsLogo = {
		logo: nav_props?.app_info?.logo
	}

	// Application menu items
	const { menu_items } = useMenuItems(nav_props?.menus?.items || [])
	const props_menu: MenuProps = {
		items: menu_items,
		mode: 'inline',
		inlineIndent: 20,
		forceSubMenuRender: true,
		selectedKeys: menu_selected_keys,
		openKeys,
		onOpenChange(openKeys) {
			setOpenKeys(openKeys)
		},
		onSelect({ key }) {
			history.push(key)
		}
	}

	// Setting menu items
	const { menu_items: setting_items } = useMenuItems(nav_props?.menus?.setting || [])
	const props_setting: MenuProps = {
		items: setting_items,
		mode: 'vertical',
		inlineIndent: 20,
		forceSubMenuRender: true,
		selectedKeys: menu_selected_keys,
		openKeys,
		onOpenChange(openKeys) {
			setOpenKeys(openKeys)
		},
		onSelect({ key }) {
			history.push(key)
		}
	}

	return (
		<div className={clsx([styles._local, (!items?.length || !visible) && styles.hidden])}>
			<div>
				<Link
					to={'/setting'}
					className='title_wrap w_100 border_box flex flex_column justify_between align_center relative'
				>
					<Logo {...props_logo}></Logo>
					<div className='title'> {nav_props?.app_info?.name} </div>
					<div className='sub_title'>
						{nav_props?.user?.team?.name || nav_props?.user?.mobile || 'Personal'}
					</div>
				</Link>

				<div className='menu_wrap w_100'>
					<Menu {...props_menu}></Menu>
				</div>
			</div>

			<div className='setting_wrap w_100'>
				<Menu {...props_setting}></Menu>
				{/*
				 * LICENSE NOTICE: This website link is required by the Yao open source license.
				 * Removing or hiding this link requires a commercial license.
				 * See /LICENSE for details.
				 */}
				{showWebsiteLink && (
					<a
						href='https://yaoagents.com'
						target='_blank'
						rel='noopener noreferrer'
						className='website_link flex align_center'
						title={`Yao Agents · ${licenseLabel}`}
					>
						<Icon name='material-language' size={14}></Icon>
						<span className='website_link_text'>{licenseLabel}</span>
					</a>
				)}
			</div>
		</div>
	)
}

export default window.$app.memo(Index)
