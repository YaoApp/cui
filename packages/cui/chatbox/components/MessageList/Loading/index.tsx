import React from 'react'
import styles from './index.less'

const Loading = () => {
    return (
        <div className={styles.loadingRow}>
            <div className={styles.loadingBubble}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
            </div>
        </div>
    )
}

export default Loading

