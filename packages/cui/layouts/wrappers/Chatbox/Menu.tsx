import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'
import { GlobalModel } from '@/context/app'
import { Tooltip } from 'antd'
import { useNavigate } from '@umijs/max'
import clsx from 'clsx'
import './menu.less'
import { Icon, UserAvatar } from '@/widgets'
import { App } from '@/types'

interface Props {
	sidebarVisible?: boolean
	setSidebarVisible?: (visible: boolean, maximize?: boolean, forceNormal?: boolean) => void
	closeSidebar?: () => void
	openSidebar?: (temporaryLink?: string, title?: string) => void
}

const Menu: FC<Props> = ({ sidebarVisible, setSidebarVisible, openSidebar }) => {
	const global = container.resolve(GlobalModel)
	const [currentNav, setCurrentNav] = useState(0)
	const quick_items = global.menus?.quick || []
	const navigate = useNavigate()

	if (quick_items.length == 0) {
		return null
	}

	const NavigateTo = (path: string, maximize?: boolean) => {
		navigate(path)
		if (maximize !== undefined) {
			setSidebarVisible?.(true, maximize)
		} else {
			// 默认情况下，普通导航应该以正常模式打开侧边栏
			setSidebarVisible?.(true, false, true)
		}
	}

	const handleNavChange = (menu: App.Menu) => {
		if (menu.path === '/chat') {
			setCurrentNav(0)
			return
		} else if (menu.path === 'open:sidebar') {
			setSidebarVisible?.(true, false, true) // visible=true, maximize=false, forceNormal=true
			return
		}

		NavigateTo(menu.path)
	}

	return (
		<div className={clsx('chatbox-main-menu')}>
			<div className='menu-content'>
				<Tooltip title={global.app_info?.name} placement='right'>
					<div className='menu-logo'>
						<img src={global.app_info?.logo} alt='Logo' />
					</div>
				</Tooltip>

				<div className='menu-items'>
					{quick_items.map((menu, index) => (
						<Tooltip key={index} title={menu.name} placement='right'>
							<div
								className={clsx('menu-item', index === currentNav && 'active')}
								onClick={() => handleNavChange(menu)}
							>
								<span className='menu-icon'>
									{menu.icon && (
										<Icon
											name={
												typeof menu.icon === 'string'
													? menu.icon
													: menu.icon.name
											}
											size={
												typeof menu.icon === 'string'
													? 24
													: menu.icon.size
											}
										/>
									)}
								</span>
							</div>
						</Tooltip>
					))}
				</div>

				<div className='menu-avatar'>
					<UserAvatar
						size={32}
						showCard={true}
						cardAlign='end'
						onClick={() => NavigateTo('/settings/profile', true)}
					/>
				</div>
			</div>
		</div>
	)
}

export default observer(Menu)
