import React from 'react'
import styles from './index.less'

interface CollectionCoverProps {
	cover?: string
	name?: string
	description?: string
	className?: string
}

const CollectionCover: React.FC<CollectionCoverProps> = ({ cover, name, description, className }) => {
	if (cover) {
		return (
			<div className={`${styles.coverContainer} ${className || ''}`}>
				<img src={cover} alt={name || 'Collection'} className={styles.coverImage} />
			</div>
		)
	}

	// Fallback: show description with dark background
	return (
		<div className={`${styles.coverContainer} ${styles.nameCover} ${className || ''}`}>
			<div className={styles.nameText}>{description || name || 'No description'}</div>
		</div>
	)
}

export default CollectionCover
