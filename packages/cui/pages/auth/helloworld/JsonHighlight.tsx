import React from 'react'
import styles from './JsonHighlight.less'

interface JsonHighlightProps {
	data: any
	className?: string
}

const JsonHighlight: React.FC<JsonHighlightProps> = ({ data, className }) => {
	const highlightJson = (obj: any, indent = 0): React.ReactNode => {
		const indentStr = '  '.repeat(indent)

		if (obj === null) {
			return <span className={styles.null}>null</span>
		}

		if (typeof obj === 'boolean') {
			return <span className={styles.boolean}>{obj.toString()}</span>
		}

		if (typeof obj === 'number') {
			return <span className={styles.number}>{obj}</span>
		}

		if (typeof obj === 'string') {
			return <span className={styles.string}>"{obj}"</span>
		}

		if (Array.isArray(obj)) {
			if (obj.length === 0) {
				return <span className={styles.bracket}>[]</span>
			}

			return (
				<>
					<span className={styles.bracket}>[</span>
					<br />
					{obj.map((item, index) => (
						<React.Fragment key={index}>
							<span className={styles.indent}>{indentStr} </span>
							{highlightJson(item, indent + 1)}
							{index < obj.length - 1 && <span className={styles.comma}>,</span>}
							<br />
						</React.Fragment>
					))}
					<span className={styles.indent}>{indentStr}</span>
					<span className={styles.bracket}>]</span>
				</>
			)
		}

		if (typeof obj === 'object') {
			const keys = Object.keys(obj)
			if (keys.length === 0) {
				return <span className={styles.brace}>{'{}'}</span>
			}

			return (
				<>
					<span className={styles.brace}>{'{'}</span>
					<br />
					{keys.map((key, index) => (
						<React.Fragment key={key}>
							<span className={styles.indent}>{indentStr} </span>
							<span className={styles.key}>"{key}"</span>
							<span className={styles.colon}>: </span>
							{highlightJson(obj[key], indent + 1)}
							{index < keys.length - 1 && <span className={styles.comma}>,</span>}
							<br />
						</React.Fragment>
					))}
					<span className={styles.indent}>{indentStr}</span>
					<span className={styles.brace}>{'}'}</span>
				</>
			)
		}

		return String(obj)
	}

	return <pre className={`${styles.jsonHighlight} ${className || ''}`}>{highlightJson(data)}</pre>
}

export default JsonHighlight
