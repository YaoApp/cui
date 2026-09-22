import React from 'react'
import { getLocale } from '@umijs/max'
import { Icon } from '@/widgets'
import styles from './index.less'

interface ICancelledProps {
	message: {
		type: 'cancelled'
		props?: {
			message?: string
		}
	}
}

const Cancelled = ({ message }: ICancelledProps) => {
	const is_cn = getLocale() === 'zh-CN'
	const text = message.props?.message || (is_cn ? '用户取消操作' : 'Cancelled by user')

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<span className={styles.icon}>
					<Icon name='icon-x' size={11} />
				</span>
				<span className={styles.text}>{text}</span>
			</div>
		</div>
	)
}

export default Cancelled
