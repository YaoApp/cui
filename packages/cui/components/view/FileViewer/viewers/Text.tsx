import React, { useState, useEffect, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import styles from '../index.less'

// 简单的语法高亮规则
const getSyntaxHighlighting = (text: string, language: string): string => {
	if (!language || language === 'text') return text

	let highlightedText = text

	// 基础的语法高亮规则
	const rules: Record<string, Array<{ pattern: RegExp; className: string }>> = {
		javascript: [
			{ pattern: /(\/\*[\s\S]*?\*\/|\/\/.*$)/gm, className: 'comment' },
			{ pattern: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, className: 'string' },
			{
				pattern: /\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|as|default)\b/g,
				className: 'keyword'
			},
			{ pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, className: 'boolean' },
			{ pattern: /\b\d+\.?\d*\b/g, className: 'number' }
		],
		typescript: [
			{ pattern: /(\/\*[\s\S]*?\*\/|\/\/.*$)/gm, className: 'comment' },
			{ pattern: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, className: 'string' },
			{
				pattern: /\b(function|const|let|var|if|else|for|while|return|class|extends|import|export|from|as|default|interface|type|enum|namespace)\b/g,
				className: 'keyword'
			},
			{ pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, className: 'boolean' },
			{ pattern: /\b\d+\.?\d*\b/g, className: 'number' }
		],
		json: [
			{ pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1(?=\s*:)/g, className: 'property' },
			{ pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1(?!\s*:)/g, className: 'string' },
			{ pattern: /\b(true|false|null)\b/g, className: 'boolean' },
			{ pattern: /\b\d+\.?\d*\b/g, className: 'number' }
		],
		css: [
			{ pattern: /(\/\*[\s\S]*?\*\/)/g, className: 'comment' },
			{ pattern: /([a-zA-Z-]+)\s*:/g, className: 'property' },
			{ pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, className: 'string' },
			{ pattern: /#[a-fA-F0-9]{3,6}\b/g, className: 'color' },
			{ pattern: /\b\d+(?:px|em|rem|%|vh|vw|pt)\b/g, className: 'number' }
		],
		html: [
			{ pattern: /<!--[\s\S]*?-->/g, className: 'comment' },
			{ pattern: /<\/?[a-zA-Z][^>]*>/g, className: 'tag' },
			{ pattern: /\s([a-zA-Z-]+)=/g, className: 'attribute' },
			{ pattern: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g, className: 'string' }
		],
		markdown: [
			{ pattern: /^#{1,6}\s+.*/gm, className: 'heading' },
			{ pattern: /\*\*(.*?)\*\*/g, className: 'bold' },
			{ pattern: /\*(.*?)\*/g, className: 'italic' },
			{ pattern: /`([^`]+)`/g, className: 'code' },
			{ pattern: /```[\s\S]*?```/g, className: 'code-block' },
			{ pattern: /^\s*[-*+]\s+/gm, className: 'list-marker' }
		]
	}

	const langRules = rules[language.toLowerCase()] || []

	// 应用语法高亮规则
	langRules.forEach(({ pattern, className }) => {
		highlightedText = highlightedText.replace(pattern, (match) => {
			return `<span class="syntax-${className}">${match}</span>`
		})
	})

	return highlightedText
}

interface TextProps {
	src?: string
	file?: File
	contentType?: string
	fileName?: string
	language?: string
}

const TextComponent: React.FC<TextProps> = ({ src, file, contentType, fileName, language }) => {
	// 统一处理文件源
	const fileSource = useMemo(() => {
		if (src) return src
		if (file) return URL.createObjectURL(file)
		return undefined
	}, [src, file])

	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [textContent, setTextContent] = useState<string>('')
	const [loading, setLoading] = useState(false)

	// 计算高亮后的内容
	const highlightedContent = useMemo(() => {
		if (!textContent || !language) return textContent
		return getSyntaxHighlighting(textContent, language)
	}, [textContent, language])

	useEffect(() => {
		if (fileSource) {
			setLoading(true)
			fetch(fileSource)
				.then((response) => response.text())
				.then((text) => {
					setTextContent(text)
					setLoading(false)
				})
				.catch((error) => {
					console.error('Failed to load text content:', error)
					setTextContent(is_cn ? '加载文件内容失败' : 'Failed to load file content')
					setLoading(false)
				})
		}
	}, [fileSource, is_cn])

	if (loading) {
		return <div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
	}

	return (
		<pre className={clsx(styles.codeBlock, `language-${language || 'text'}`)}>
			<code
				dangerouslySetInnerHTML={{
					__html: highlightedContent
				}}
			/>
		</pre>
	)
}

export default TextComponent
