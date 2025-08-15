import React, { useState, useEffect, useMemo, useRef } from 'react'
import { getLocale } from '@umijs/max'
import clsx from 'clsx'
import styles from '../index.less'
import Editor from 'react-monaco-editor'
import type { EditorDidMount, monaco } from 'react-monaco-editor'
import { useGlobal } from '@/context/app'
import vars from '@/styles/preset/vars'

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
	content?: string // 新增：直接传递文本内容
	contentType?: string
	fileName?: string
	language?: string
}

const TextComponent: React.FC<TextProps> = ({ src, file, content, contentType, fileName, language }) => {
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
	const global = useGlobal()
	const theme = useMemo(() => (global.theme === 'dark' ? 'x-dark' : 'x-light'), [global.theme])
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()

	// Utility: parse charset from Content-Type header
	const parseCharsetFromContentType = (contentTypeHeader: string | null): string | undefined => {
		if (!contentTypeHeader) return undefined
		const parts = contentTypeHeader.split(';')
		for (const part of parts) {
			const [key, value] = part.split('=').map((s) => s.trim().toLowerCase())
			if (key === 'charset' && value) return value
		}
		return undefined
	}

	// Utility: detect encoding from BOM
	const detectEncodingFromBom = (bytes: Uint8Array): string | undefined => {
		if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'utf-8'
		if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le'
		if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be'
		if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xfe && bytes[2] === 0x00 && bytes[3] === 0x00)
			return 'utf-32le'
		if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0xfe && bytes[3] === 0xff)
			return 'utf-32be'
		return undefined
	}

	// Utility: compute quality score for decoded text
	const computeDecodeCost = (text: string): number => {
		if (!text) return Number.POSITIVE_INFINITY
		const replacementChar = '\uFFFD'
		let replacementCount = 0
		let controlCount = 0
		let cjkCount = 0
		let printableCount = 0

		for (let i = 0; i < text.length; i++) {
			const ch = text[i]
			const code = ch.charCodeAt(0)
			if (ch === replacementChar) {
				replacementCount++
				continue
			}
			// Count control characters (excluding common whitespace)
			if ((code >= 0 && code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) {
				controlCount++
			}
			// CJK Unified Ideographs (basic + extensions A/B small subset)
			if (
				(code >= 0x4e00 && code <= 0x9fff) ||
				(code >= 0x3400 && code <= 0x4dbf) ||
				(code >= 0x20000 && code <= 0x2a6df)
			) {
				cjkCount++
			}
			if (code >= 32 && code !== 127) printableCount++
		}

		const length = Math.max(1, text.length)
		const replaceRatio = replacementCount / length
		const controlRatio = controlCount / length
		const cjkRatio = cjkCount / Math.max(1, printableCount)

		// Cost: heavy penalty for replacements, moderate for controls; reward for CJK content
		const cost = replaceRatio * 100 + controlRatio * 10 - cjkRatio * 20
		return cost
	}

	// Utility: detect best encoding using header, BOM and heuristic fallbacks
	const detectBestEncoding = (bytes: Uint8Array, headerCharset?: string): string => {
		const bomEncoding = detectEncodingFromBom(bytes)
		if (bomEncoding) return bomEncoding

		// If header says UTF-8, trust it
		if (headerCharset && /utf-?8/i.test(headerCharset)) return 'utf-8'

		// Try strict UTF-8 first. If it decodes without error, prefer UTF-8
		try {
			const strictUtf8 = new TextDecoder('utf-8', { fatal: true })
			strictUtf8.decode(bytes)
			return 'utf-8'
		} catch {
			// Not valid UTF-8; continue to heuristic detection
		}

		if (headerCharset) return headerCharset

		// Try a set of likely encodings; choose the one with fewest replacement chars
		const candidateEncodings = [
			'utf-8',
			'gb18030',
			'gbk',
			'gb2312',
			'big5',
			'big5-hkscs',
			'shift_jis',
			'euc-jp',
			'windows-1252',
			'iso-8859-1'
		]

		let bestEncoding = 'utf-8'
		let bestCost = Number.POSITIVE_INFINITY
		for (const enc of candidateEncodings) {
			try {
				const decoder = new TextDecoder(enc as any, { fatal: false })
				const text = decoder.decode(bytes)
				const cost = computeDecodeCost(text)
				if (cost < bestCost) {
					bestCost = cost
					bestEncoding = enc
				}
			} catch {
				// Ignore unsupported encodings in current runtime
			}
		}
		return bestEncoding
	}

	// 计算高亮后的内容
	const highlightedContent = useMemo(() => {
		if (!textContent || !language) return textContent
		return getSyntaxHighlighting(textContent, language)
	}, [textContent, language])

	useEffect(() => {
		// 如果直接传递了内容，使用传递的内容
		if (content !== undefined) {
			setTextContent(content)
			setLoading(false)
			return
		}

		// 否则从文件源加载内容
		if (!fileSource) return
		setLoading(true)
		fetch(fileSource)
			.then(async (response) => {
				const arrayBuffer = await response.arrayBuffer()
				const bytes = new Uint8Array(arrayBuffer)
				const headerCharset = parseCharsetFromContentType(response.headers.get('content-type'))
				const encoding = detectBestEncoding(bytes, headerCharset)
				const decoder = new TextDecoder(encoding as any, { fatal: false })
				const decoded = decoder.decode(bytes)
				return decoded
			})
			.then((text) => {
				setTextContent(text)
				setLoading(false)
			})
			.catch((error) => {
				console.error('Failed to load text content:', error)
				setTextContent(is_cn ? '加载文件内容失败' : 'Failed to load file content')
				setLoading(false)
			})
	}, [fileSource, content, is_cn])

	const editorDidMount: EditorDidMount = (editor, monaco) => {
		editorRef.current = editor
		monaco.editor.defineTheme('x-dark', {
			base: 'vs-dark',
			inherit: true,
			rules: [],
			colors: {
				'editor.background': vars[global.theme].color_bg_nav
			}
		})
		monaco.editor.defineTheme('x-light', {
			base: 'vs',
			inherit: true,
			rules: [],
			colors: {
				'editor.background': vars[global.theme].color_bg_nav
			}
		})
		monaco.editor.setTheme(theme)

		// Enable JSON diagnostics to accept comments for JSONC viewing
		if (language === 'jsonc' || language === 'yao') {
			try {
				// @ts-ignore - Monaco json language defaults
				monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
					validate: true,
					allowComments: true,
					schemas: []
				})
			} catch {}
		}
	}

	if (loading) {
		return <div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
	}

	// Use Monaco for non-plain text languages
	if (language && language !== 'text') {
		const effectiveLanguage = language === 'jsonc' || language === 'yao' ? 'json' : language
		return (
			<div style={{ width: '100%', height: '100%' }}>
				<Editor
					width='100%'
					height='100%'
					language={effectiveLanguage}
					theme={theme}
					value={textContent}
					options={{
						readOnly: true,
						wordWrap: 'on',
						minimap: { enabled: false },
						lineNumbers: 'on',
						renderLineHighlight: 'none',
						scrollbar: { verticalScrollbarSize: 8, horizontalSliderSize: 8, useShadows: false }
					}}
					editorDidMount={editorDidMount}
				/>
			</div>
		)
	}

	return (
		<pre className={clsx(styles.codeBlock, `language-${language || 'text'}`, styles.textViewer)}>
			<code
				dangerouslySetInnerHTML={{
					__html: highlightedContent
				}}
			/>
		</pre>
	)
}

export default TextComponent
