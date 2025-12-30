import { memo, useMemo } from 'react'
import styles from './index.less'

interface JsonViewerProps {
	data: any
	collapsed?: boolean
}

// 简单的 JSON 语法高亮
const highlightJson = (json: string): React.ReactNode[] => {
	const tokens: React.ReactNode[] = []
	let i = 0

	// 正则匹配不同类型的 token
	const patterns = [
		{ type: 'string', regex: /"(?:[^"\\]|\\.)*"/ },
		{ type: 'number', regex: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/ },
		{ type: 'boolean', regex: /\b(?:true|false)\b/ },
		{ type: 'null', regex: /\bnull\b/ },
		{ type: 'punctuation', regex: /[{}\[\]:,]/ }
	]

	while (i < json.length) {
		// 跳过空白
		if (/\s/.test(json[i])) {
			const start = i
			while (i < json.length && /\s/.test(json[i])) i++
			tokens.push(json.slice(start, i))
			continue
		}

		let matched = false
		for (const { type, regex } of patterns) {
			const match = json.slice(i).match(new RegExp(`^${regex.source}`))
			if (match) {
				const value = match[0]
				
				// 对于字符串，检查是否是 key（后面跟着冒号）
				if (type === 'string') {
					const afterString = json.slice(i + value.length).trimStart()
					if (afterString.startsWith(':')) {
						tokens.push(
							<span key={i} className={styles.key}>
								{value}
							</span>
						)
					} else {
						tokens.push(
							<span key={i} className={styles.string}>
								{value}
							</span>
						)
					}
				} else {
					tokens.push(
						<span key={i} className={styles[type]}>
							{value}
						</span>
					)
				}
				
				i += value.length
				matched = true
				break
			}
		}

		if (!matched) {
			tokens.push(json[i])
			i++
		}
	}

	return tokens
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
	const highlighted = useMemo(() => {
		try {
			const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
			return highlightJson(jsonString)
		} catch {
			return String(data)
		}
	}, [data])

	return (
		<pre className={styles.jsonViewer}>
			<code>{highlighted}</code>
		</pre>
	)
}

export default memo(JsonViewer)

