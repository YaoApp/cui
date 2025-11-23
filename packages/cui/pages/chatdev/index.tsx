import React from 'react'
import styles from './index.less'

const Index = () => {
	return (
		<div className={styles._local} style={{ padding: 20 }}>
			<h3>ChatDev Sidebar Content</h3>
			<p>This content is rendered in the sidebar.</p>
			<p>The main area (left) is rendered by ChatboxWrapper using the new Page component.</p>
		</div>
	)
}

export default Index
