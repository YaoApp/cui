import React, { useState, useRef, useEffect, useCallback } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '../../../widgets/Icon'
import styles from './index.less'

export interface TabMenuProps {
	/** 关闭当前 Tab */
	onCloseTab?: () => void
	/** 关闭其他 Tab */
	onCloseOthers?: () => void
	/** 关闭全部 Tab */
	onCloseAll?: () => void
	/** 是否禁用关闭当前（没有激活 tab 时） */
	disableCloseTab?: boolean
	/** 是否禁用关闭其他（只有一个或没有 tab 时） */
	disableCloseOthers?: boolean
	/** 是否禁用关闭全部（没有 tab 时） */
	disableCloseAll?: boolean
}

const TabMenu: React.FC<TabMenuProps> = (props) => {
	const { onCloseTab, onCloseOthers, onCloseAll, disableCloseTab, disableCloseOthers, disableCloseAll } = props

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [open, setOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const buttonRef = useRef<HTMLDivElement>(null)

	// Close menu when clicking outside
	useEffect(() => {
		if (!open) return

		const handleClickOutside = (e: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(e.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(e.target as Node)
			) {
				setOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [open])

	const handleToggle = useCallback(() => {
		setOpen((prev) => !prev)
	}, [])

	const handleCloseTab = useCallback(() => {
		onCloseTab?.()
		setOpen(false)
	}, [onCloseTab])

	const handleCloseOthers = useCallback(() => {
		onCloseOthers?.()
		setOpen(false)
	}, [onCloseOthers])

	const handleCloseAll = useCallback(() => {
		onCloseAll?.()
		setOpen(false)
	}, [onCloseAll])

	return (
		<div className={styles.container}>
			<div ref={buttonRef} className={styles.iconBtn} onClick={handleToggle} title='Menu'>
				<Icon name='material-more_horiz' size={18} />
			</div>

			{open && (
				<div ref={menuRef} className={styles.menu}>
					<div
						className={`${styles.menuItem} ${disableCloseTab ? styles.disabled : ''}`}
						onClick={disableCloseTab ? undefined : handleCloseTab}
					>
						<Icon name='material-close' size={14} />
						<span>{is_cn ? '关闭当前会话' : 'Close Chat'}</span>
					</div>
					<div
						className={`${styles.menuItem} ${disableCloseOthers ? styles.disabled : ''}`}
						onClick={disableCloseOthers ? undefined : handleCloseOthers}
					>
						<Icon name='material-tab_close' size={14} />
						<span>{is_cn ? '关闭其他会话' : 'Close Other Chats'}</span>
					</div>
					<div className={styles.divider} />
					<div
						className={`${styles.menuItem} ${disableCloseAll ? styles.disabled : ''}`}
						onClick={disableCloseAll ? undefined : handleCloseAll}
					>
						<Icon name='material-clear_all' size={14} />
						<span>{is_cn ? '关闭全部会话' : 'Close All Chats'}</span>
					</div>
				</div>
			)}
		</div>
	)
}

export default TabMenu
