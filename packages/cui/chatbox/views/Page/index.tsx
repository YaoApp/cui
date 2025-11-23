import React from 'react'
import styles from './index.less'
import type { IProps } from './types'

const Page = (props: IProps) => {
	const { title, headerMode } = props
	return (
		<div className={styles.container}>
			<div style={{ textAlign: 'center' }}>
				<h3>Page Mode Placeholder</h3>
				<p>Title: {title || '-'}</p>
				<p>Header Mode: {headerMode || 'tabs (default)'}</p>
			</div>
		</div>
	)
}

export default Page
