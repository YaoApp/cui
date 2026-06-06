import React, { useState, useEffect, useMemo, useRef, Fragment } from 'react'
import { getLocale } from '@umijs/max'
import { useAsyncEffect } from 'ahooks'
import * as JsxRuntime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { evaluate } from '@mdx-js/mdx'
import clsx from 'clsx'
import styles from '../index.less'
import Editor from 'react-monaco-editor'
import type { EditorDidMount, monaco } from 'react-monaco-editor'
import { useGlobal } from '@/context/app'
import vars from '@/styles/preset/vars'
import MdxErrorBoundary from '@/widgets/MdxErrorBoundary'
import { escapeCurlyBraces, rehypeUnescapeBraces, rehypeUnescapeCodeBlocks } from '@/utils/mdx-helpers'

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
	content?: string
	contentType?: string
	fileName?: string
	language?: string
	markdownPreview?: boolean
}

function parseFrontmatter(raw: string): { meta: Record<string, string> | null; body: string } {
	if (!raw.startsWith('---')) return { meta: null, body: raw }
	const end = raw.indexOf('---', 3)
	if (end < 0) return { meta: null, body: raw }

	const yamlBlock = raw.substring(3, end).trim()
	const body = raw.substring(end + 3).trimStart()
	const meta: Record<string, string> = {}

	for (const line of yamlBlock.split('\n')) {
		const idx = line.indexOf(':')
		if (idx <= 0) continue
		const key = line.substring(0, idx).trim()
		let val = line.substring(idx + 1).trim()
		val = val.replace(/^['"]|['"]$/g, '')
		if (key && val) meta[key] = val
	}

	return { meta: Object.keys(meta).length > 0 ? meta : null, body }
}

const HLJS_STYLE = `
.fv-hljs pre code.hljs{display:block;overflow-x:auto;padding:0}
.fv-hljs .hljs{background:transparent}
.fv-hljs .hljs-comment{color:#6a737d;font-style:italic}
.fv-hljs .hljs-keyword,.fv-hljs .hljs-selector-tag,.fv-hljs .hljs-title{color:#d73a49;font-weight:600}
.fv-hljs .hljs-string,.fv-hljs .hljs-attr{color:#032f62}
.fv-hljs .hljs-number,.fv-hljs .hljs-literal{color:#005cc5}
.fv-hljs .hljs-built_in,.fv-hljs .hljs-type{color:#6f42c1}
.fv-hljs .hljs-name,.fv-hljs .hljs-variable{color:#e36209}
.fv-hljs .hljs-function .hljs-title{color:#6f42c1}
.fv-hljs .hljs-params{color:#24292e}
.fv-hljs .hljs-meta{color:#005cc5}
.fv-hljs .hljs-operator{color:#d73a49}
.fv-hljs .hljs-punctuation{color:#24292e}
.fv-hljs .hljs-property{color:#005cc5}
.fv-hljs .hljs-regexp{color:#032f62}
.fv-hljs .hljs-addition{color:#22863a;background:rgba(34,134,58,0.08)}
.fv-hljs .hljs-deletion{color:#b31d28;background:rgba(179,29,40,0.08)}
.fv-hljs .hljs-section{color:#005cc5;font-weight:700}
.fv-hljs .hljs-bullet{color:#735c0f}
.fv-hljs .hljs-emphasis{font-style:italic}
.fv-hljs .hljs-strong{font-weight:700}
[data-theme='dark'] .fv-hljs .hljs-comment{color:#8b949e}
[data-theme='dark'] .fv-hljs .hljs-keyword,[data-theme='dark'] .fv-hljs .hljs-selector-tag,[data-theme='dark'] .fv-hljs .hljs-title{color:#ff7b72}
[data-theme='dark'] .fv-hljs .hljs-string,[data-theme='dark'] .fv-hljs .hljs-attr{color:#a5d6ff}
[data-theme='dark'] .fv-hljs .hljs-number,[data-theme='dark'] .fv-hljs .hljs-literal{color:#79c0ff}
[data-theme='dark'] .fv-hljs .hljs-built_in,[data-theme='dark'] .fv-hljs .hljs-type{color:#d2a8ff}
[data-theme='dark'] .fv-hljs .hljs-name,[data-theme='dark'] .fv-hljs .hljs-variable{color:#ffa657}
[data-theme='dark'] .fv-hljs .hljs-function .hljs-title{color:#d2a8ff}
[data-theme='dark'] .fv-hljs .hljs-params{color:#c9d1d9}
[data-theme='dark'] .fv-hljs .hljs-meta{color:#79c0ff}
[data-theme='dark'] .fv-hljs .hljs-operator{color:#ff7b72}
[data-theme='dark'] .fv-hljs .hljs-punctuation{color:#c9d1d9}
[data-theme='dark'] .fv-hljs .hljs-property{color:#79c0ff}
[data-theme='dark'] .fv-hljs .hljs-regexp{color:#a5d6ff}
[data-theme='dark'] .fv-hljs .hljs-section{color:#79c0ff;font-weight:700}
[data-theme='dark'] .fv-hljs .hljs-bullet{color:#f2cc60}
`

const MarkdownPreviewRenderer = ({ content }: { content: string }) => {
	const [rendered, setRendered] = useState<React.ReactNode>(null)
	const [showMeta, setShowMeta] = useState(false)
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const { meta, body } = useMemo(() => parseFrontmatter(content), [content])

	useAsyncEffect(async () => {
		if (!body) return
		try {
			const escaped = escapeCurlyBraces(body)
			const { default: Content } = await evaluate(escaped, {
				...JsxRuntime,
				Fragment,
				format: 'md',
				remarkPlugins: [remarkGfm],
				rehypePlugins: [
					rehypeUnescapeCodeBlocks,
					rehypeUnescapeBraces,
					[rehypeHighlight, { ignoreMissing: true }]
				],
				baseUrl: import.meta.url
			})
			setRendered(<Content />)
		} catch {
			setRendered(<div style={{ whiteSpace: 'pre-wrap' }}>{body}</div>)
		}
	}, [body])

	if (!rendered) return <div className={styles.loading}>{is_cn ? '渲染中...' : 'Rendering...'}</div>
	return (
		<MdxErrorBoundary fallbackContent={body} resetKeys={[body]}>
			<style>{HLJS_STYLE}</style>
			<div className={`${styles.markdownPreview} fv-hljs`}>
				{meta && (
					<>
						<button
							className={styles.metaToggle}
							onClick={() => setShowMeta(!showMeta)}
							title={is_cn ? '文件元信息' : 'File metadata'}
						>
							<span className={styles.metaToggleIcon}>i</span>
							<span>{is_cn ? '元信息' : 'Metadata'}</span>
						</button>
						{showMeta && (
							<div className={styles.metaPanel}>
								{Object.entries(meta).map(([key, val]) => (
									<div key={key} className={styles.metaRow}>
										<span className={styles.metaKey}>{key}</span>
										<span className={styles.metaVal}>{val}</span>
									</div>
								))}
							</div>
						)}
					</>
				)}
				{rendered}
			</div>
		</MdxErrorBoundary>
	)
}

const TextComponent: React.FC<TextProps> = ({ src, file, content, contentType, fileName, language, markdownPreview }) => {
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

	if (markdownPreview && language === 'markdown' && textContent) {
		return <MarkdownPreviewRenderer content={textContent} />
	}

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
						padding: { top: 12 },
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
