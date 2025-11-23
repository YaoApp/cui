import React from 'react'
import clsx from 'clsx'
import { Button } from 'antd'
import type { IHeaderProps } from '../../types'
import styles from './index.less'

const Header = (props: IHeaderProps) => {
	const { mode, title, className, onNewChat, tabs, activeTabId, onTabChange, onTabClose } = props

	return (
		<div className={clsx(styles.container, className)}>
			{mode === 'tabs' && tabs && (
				<div className={styles.tabs}>
					{tabs.map((tab) => (
						<div
							key={tab.chatId}
							className={clsx(styles.tab, tab.chatId === activeTabId && styles.active)}
							onClick={() => onTabChange?.(tab.chatId)}
						>
							<span className={styles.tabTitle}>{tab.title}</span>
							<span
								className={styles.closeIcon}
								onClick={(e) => {
									e.stopPropagation()
									onTabClose?.(tab.chatId)
								}}
							>
								×
							</span>
						</div>
					))}
					<div className={styles.addTab} onClick={onNewChat}>
						+
					</div>
				</div>
			)}

			{mode === 'single' && <div className={styles.singleTitle}>{title || 'Chat'}</div>}

			<div className={styles.actions}>
				<Button type='text' size='small' icon={<span style={{ fontSize: 16 }}>...</span>} />
			</div>
		</div>
	)
}

export default Header
