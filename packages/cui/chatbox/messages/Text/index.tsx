import { useAsyncEffect } from 'ahooks'
import to from 'await-to-js'
import { message as antdMessage } from 'antd'
import React, { Fragment, useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import * as JsxRuntime from 'react/jsx-runtime'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'
import { compile, run } from '@mdx-js/mdx'
import { useMDXComponents } from '@mdx-js/react'
import styles from './index.less'
import Code from './components/Code'
import Mermaid from './components/Mermaid'
import ReferencePopover from './components/ReferencePopover'
import { ParseFileRef, ResolveFileURL } from '@/utils/fileWrapper'
import ImageViewer from '@/components/view/FileViewer/viewers/Image'
import Thinking from '../Thinking'
import ToolCall from '../ToolCall'
import type { TextMessage, ThinkingMessage, ToolCallMessage } from '../../../openapi'
import MdxErrorBoundary from '@/widgets/MdxErrorBoundary'
import { escapeCurlyBraces as sharedEscapeCurlyBraces, unescapeCurlyBraces } from '@/utils/mdx-helpers'

interface ITextProps {
	message: TextMessage
}

interface ReferenceState {
	requestId: string
	refIndex: number
	refType: string
	anchorEl: HTMLElement | null
}

interface PreviewImageState {
	src: string
	alt?: string
	wsSrc?: string
	type: 'workspace' | 'external'
}

const WorkspaceMediaLink = ({ url }: { url: string }) => {
	const ref = ParseFileRef(url)
	if (ref.type !== 'workspace' || !ref.filePath) return null
	const fileName = ref.filePath.split('/').pop() || ref.filePath
	return (
		<a className='workspace-link' href={url} style={{ fontSize: 12, opacity: 0.7 }}>
			<i className='Icon material'>insert_drive_file</i>
			{fileName}
		</a>
	)
}

const WorkspaceImg = ({ src, alt, ...rest }: any) => {
	const [error, setError] = React.useState(false)
	const wsSrc = rest['data-ws-src'] || (src?.startsWith('workspace://') ? src : '')
	const resolvedSrc = src?.startsWith('workspace://') ? ResolveFileURL(src) : src

	if (error) {
		return (
			<div className={styles.mediaFallback}>
				<i className='Icon material'>broken_image</i>
				<span>{alt || wsSrc || src}</span>
				{wsSrc && <WorkspaceMediaLink url={wsSrc} />}
			</div>
		)
	}

	return (
		<div className={wsSrc ? styles.mediaBlock : undefined}>
			<img {...rest} src={resolvedSrc} alt={alt} onError={() => setError(true)} data-ws-src={wsSrc || undefined} />
			{wsSrc && <WorkspaceMediaLink url={wsSrc} />}
		</div>
	)
}

const components = (done?: boolean) => {
	return {
		code: function (props: any) {
			if (props?.className?.includes('language-mermaid')) {
				const chart = props.raw || props.children || ''
				// Preprocess Mermaid content
				const processedChart = chart
					.split('\n')
					.map((line: string) => {
						// Handle node definitions
						let processed = line

						// Helper to quote content in shapes
						// Only process if it doesn't already look like it has quotes
						const quoteIfNeeded = (match: string, content: string) => {
							if (content.startsWith('"') && content.endsWith('"')) return match
							// Replace the content with quoted content
							return match.replace(content, `"${content}"`)
						}

						// 1. Square Rect [ ]
						if (processed.includes('[') && processed.includes(']')) {
							processed = processed.replace(/\[([^\]]+)\]/g, (match, content) => {
								// Don't quote if it's likely an attribute like style [stroke:width] or just an ID?
								// Mermaid is tricky. But usually [Text Label] needs quotes.
								return quoteIfNeeded(match, content)
							})
						}

						// 2. Round Rect ( )
						// Be careful not to break (( )) or >( )
						if (processed.includes('(') && processed.includes(')')) {
							// Look for (text) but avoid ((text)) which is circle.
							// This simple regex might be too aggressive if nested.
							// Let's try a safer approach for common cases: id(Label)
							processed = processed.replace(
								/([a-zA-Z0-9_]+)\(([^)]+)\)/g,
								(match, id, content) => {
									if (content.startsWith('(')) return match // skip ((...))
									return `${id}(${
										content.startsWith('"') ? content : `"${content}"`
									})`
								}
							)
						}

						// 3. Rhombus { }
						if (processed.includes('{') && processed.includes('}')) {
							processed = processed.replace(/\{([^}]+)\}/g, (match, content) => {
								return quoteIfNeeded(match, content)
							})
						}

						return processed
					})
					.filter(Boolean)
					.join('\n')
					.trim()

				return <Mermaid chart={processedChart} />
			}
			return <Code {...props} />
		},
		// Override table for better styling wrapper
		table: (props: any) => (
			<div className={styles.table_wrapper}>
				<table {...props} />
			</div>
		),
		img: ({ src, alt, ...rest }: React.ImgHTMLAttributes<HTMLImageElement>) => {
			return <WorkspaceImg src={src} alt={alt} {...rest} />
		},
		video: ({ src, children, ...rest }: any) => {
			const wsSrc = rest['data-ws-src'] || (src?.startsWith('workspace://') ? src : '')
			const resolvedSrc = src?.startsWith('workspace://') ? ResolveFileURL(src) : src
			return (
				<div className={styles.mediaBlock}>
					<video {...rest} src={resolvedSrc} controls data-ws-src={undefined}>
						{React.Children.map(children, (child) => {
							if (
								React.isValidElement(child) &&
								(child as any).type === 'source'
							) {
								const sourceSrc = (child.props as any)?.src
								if (sourceSrc?.startsWith('workspace://')) {
									return React.cloneElement(
										child as React.ReactElement<any>,
										{ src: ResolveFileURL(sourceSrc) }
									)
								}
							}
							return child
						})}
					</video>
					{wsSrc && <WorkspaceMediaLink url={wsSrc} />}
				</div>
			)
		},
		audio: ({ src, children, ...rest }: any) => {
			const wsSrc = rest['data-ws-src'] || (src?.startsWith('workspace://') ? src : '')
			const resolvedSrc = src?.startsWith('workspace://') ? ResolveFileURL(src) : src
			return (
				<div className={styles.mediaBlock}>
					<audio {...rest} src={resolvedSrc} controls data-ws-src={undefined}>
						{React.Children.map(children, (child) => {
							if (
								React.isValidElement(child) &&
								(child as any).type === 'source'
							) {
								const sourceSrc = (child.props as any)?.src
								if (sourceSrc?.startsWith('workspace://')) {
									return React.cloneElement(
										child as React.ReactElement<any>,
										{ src: ResolveFileURL(sourceSrc) }
									)
								}
							}
							return child
						})}
					</audio>
					{wsSrc && <WorkspaceMediaLink url={wsSrc} />}
				</div>
			)
		},
		VideoEmbed: (props: { src: string; platform: string }) => (
			<div className={styles.videoEmbed}>
				<iframe
					src={props.src}
					allowFullScreen
					allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
					sandbox='allow-scripts allow-same-origin allow-popups'
				/>
			</div>
		)
	}
}

// List of allowed HTML tags that should not be escaped
const ALLOWED_HTML_TAGS = [
	'a',
	'b',
	'i',
	'u',
	's',
	'em',
	'strong',
	'code',
	'pre',
	'br',
	'hr',
	'p',
	'div',
	'span',
	'ul',
	'ol',
	'li',
	'table',
	'thead',
	'tbody',
	'tr',
	'th',
	'td',
	'img',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'blockquote',
	'sup',
	'sub',
	'del',
	'ins',
	'mark',
	'abbr',
	'details',
	'summary',
	'figure',
	'figcaption',
	'caption',
	'col',
	'colgroup',
	'video',
	'audio',
	'source'
]

// Create a regex pattern for allowed tags
const ALLOWED_TAG_PATTERN = new RegExp(`^<(\\/)?\\s*(${ALLOWED_HTML_TAGS.join('|')})(?:\\s|>|\\/>|$)`, 'i')

/**
 * Escape < that are not part of valid HTML tags
 * This handles cases like "<3" which would break HTML parsing
 * Skips content inside code blocks (``` ... ```)
 */
const escapeInvalidHtmlTags = (text: string): string => {
	// Split by code blocks to avoid escaping HTML inside them
	const parts: string[] = []
	let lastIndex = 0
	let inCodeBlock = false
	let codeBlockStart = -1

	// Find all ``` positions
	const codeBlockRegex = /```/g
	let match

	while ((match = codeBlockRegex.exec(text)) !== null) {
		if (!inCodeBlock) {
			// Entering code block - process the text before it
			const beforeCode = text.slice(lastIndex, match.index)
			parts.push(escapeHtmlInText(beforeCode))
			codeBlockStart = match.index
			inCodeBlock = true
		} else {
			// Exiting code block - keep the code block content as-is
			const codeBlockContent = text.slice(codeBlockStart, match.index + 3)
			parts.push(codeBlockContent)
			lastIndex = match.index + 3
			inCodeBlock = false
		}
	}

	// Handle remaining text
	if (inCodeBlock) {
		// Unclosed code block - keep as-is (will be closed later)
		parts.push(text.slice(codeBlockStart))
	} else {
		// Process remaining text outside code blocks
		const remaining = text.slice(lastIndex)
		if (remaining) {
			parts.push(escapeHtmlInText(remaining))
		}
	}

	return parts.join('')
}

/**
 * Escape < that are not part of valid HTML tags in regular text
 */
const VOID_HTML_TAGS = ['br', 'hr', 'img', 'source', 'col', 'track', 'wbr']
const VOID_TAG_PATTERN = new RegExp(`<(${VOID_HTML_TAGS.join('|')})\\b([^>]*?)(?<!\\/)>`, 'gi')

const escapeHtmlInText = (text: string): string => {
	// Match all < characters and check if they start a valid HTML tag
	let result = text.replace(/<([^>]*>?)/g, (match, afterBracket) => {
		const fullMatch = '<' + afterBracket
		// Check if this looks like a valid HTML tag
		if (ALLOWED_TAG_PATTERN.test(fullMatch)) {
			return match // Keep valid HTML tags
		}
		// Escape the < for non-valid tags like <3, <-- etc
		return '&lt;' + afterBracket
	})
	// Ensure void HTML elements are self-closed for JSX/MDX compatibility
	// e.g. <source src="..." type="video/mp4"> → <source src="..." type="video/mp4" />
	result = result.replace(VOID_TAG_PATTERN, '<$1$2 />')
	return result
}

/**
 * Handle unclosed HTML tags during streaming
 * This removes incomplete tags at the end of the text to prevent rendering issues
 */
const handleUnclosedHtmlTags = (text: string): string => {
	// Find the last < that might be an unclosed tag
	let lastOpenBracket = text.lastIndexOf('<')

	while (lastOpenBracket !== -1) {
		const afterOpen = text.slice(lastOpenBracket)

		// If there's a > after <, check if it's a complete tag
		const closeIndex = afterOpen.indexOf('>')
		if (closeIndex !== -1) {
			// Tag is closed, check if it's a valid opening tag that needs a closing tag
			const tagContent = afterOpen.slice(1, closeIndex)
			const tagMatch = tagContent.match(/^([a-zA-Z][a-zA-Z0-9]*)/)?.[1]?.toLowerCase()

			if (tagMatch && ALLOWED_HTML_TAGS.includes(tagMatch)) {
				// Check if this tag has a matching closing tag
				const closingTag = `</${tagMatch}>`
				const textAfterTag = text.slice(lastOpenBracket + closeIndex + 1)
				if (!textAfterTag.toLowerCase().includes(closingTag)) {
					// Self-closing tags don't need closing
					const selfClosingTags = ['br', 'hr', 'img', 'col', 'source']
					if (!selfClosingTags.includes(tagMatch) && !afterOpen.includes('/>')) {
						// Unclosed tag found, append closing tag
						return text + closingTag
					}
				}
			}
			break
		} else {
			// No > found after <, this is an incomplete tag during streaming
			// Remove the incomplete tag part
			return text.slice(0, lastOpenBracket)
		}
	}

	return text
}

/**
 * Build an HTML <a> tag for a workspace:// URL.
 * Displays the full path after the workspace ID with a file icon.
 */
const buildWorkspaceTag = (url: string): string => {
	const rest = url.slice('workspace://'.length)
	const slashIdx = rest.indexOf('/')
	const displayPath = slashIdx !== -1 ? rest.slice(slashIdx + 1) : rest
	return `<a className="workspace-link" href="${url}"><i className="Icon material">insert_drive_file</i>${escapeBraces(displayPath || rest)}</a>`
}

const escapeHtml = (s: string): string =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const escapeBraces = (s: string): string =>
	s.replace(/\{/g, '\\{').replace(/\}/g, '\\}')

/**
 * Build an HTML <a> tag for a service:// URL.
 * Supports ?title= query param for display; falls back to :port.
 */
const buildServiceTag = (url: string): string => {
	const withoutProto = url.slice('service://'.length)
	const qIdx = withoutProto.indexOf('?')
	const mainPart = qIdx === -1 ? withoutProto : withoutProto.slice(0, qIdx)
	const queryStr = qIdx === -1 ? '' : withoutProto.slice(qIdx + 1)
	const parts = mainPart.split('/')
	const port = parts[2] || ''

	let display = `:${port}`
	if (queryStr) {
		const params = new URLSearchParams(queryStr)
		const title = params.get('title')
		if (title) display = title
	}

	return `<a className="service-link" href="${escapeHtml(url)}"><i className="Icon material">language</i>${escapeBraces(escapeHtml(display))}</a>`
}

/**
 * Convert workspace:// and service:// URLs in text to clickable HTML <a> tags.
 * Handles: backtick-wrapped URLs, markdown links, and bare URLs.
 * Skips URLs inside fenced code blocks (``` ... ```).
 */
const wrapProtocolLinks = (text: string): string => {
	const codeBlockPositions: Array<[number, number]> = []
	const codeBlockRegex = /```/g
	let cbMatch
	let inCodeBlock = false
	while ((cbMatch = codeBlockRegex.exec(text)) !== null) {
		if (!inCodeBlock) {
			inCodeBlock = true
			codeBlockPositions.push([cbMatch.index, -1])
		} else {
			inCodeBlock = false
			const last = codeBlockPositions[codeBlockPositions.length - 1]
			if (last) last[1] = cbMatch.index + 3
		}
	}
	if (inCodeBlock) {
		const last = codeBlockPositions[codeBlockPositions.length - 1]
		if (last) last[1] = text.length
	}
	const isInCodeBlock = (pos: number) =>
		codeBlockPositions.some(([start, end]) => pos >= start && pos < end)

	const hasTemplateBraces = (s: string) => /\{/.test(s)

	// Pass 1: unwrap backtick-wrapped protocol URLs:  `workspace://...` / `service://...`  →  <a>
	// Also handle markdown links: [text](workspace://...) / [text](service://...) → <a>
	// Skip URLs containing { } — those are template placeholders, not real links
	let result = text.replace(
		/`(workspace:\/\/[^`]+)`/g,
		(match, url, offset) => {
			if (isInCodeBlock(offset) || hasTemplateBraces(url)) return match
			return buildWorkspaceTag(url)
		}
	)
	result = result.replace(
		/`(service:\/\/[^`]+)`/g,
		(match, url, offset) => {
			if (isInCodeBlock(offset) || hasTemplateBraces(url)) return match
			return buildServiceTag(url)
		}
	)
	result = result.replace(
		/(?<!!)\[([^\]]*)\]\((workspace:\/\/[^)]+)\)/g,
		(match, label, url, offset) => {
			if (isInCodeBlock(offset) || hasTemplateBraces(url)) return match
			const displayName = label || url.split('/').pop() || url
			return `<a className="workspace-link" href="${url}">${escapeBraces(displayName)}</a>`
		}
	)
	result = result.replace(
		/(?<!!)\[([^\]]*)\]\((service:\/\/[^)]+)\)/g,
		(match, label, url, offset) => {
			if (isInCodeBlock(offset) || hasTemplateBraces(url)) return match
			const displayName = label || `:${url.split('/')[4] || ''}`
			return `<a className="service-link" href="${url}">${escapeBraces(displayName)}</a>`
		}
	)

	// Pass 2: convert remaining bare workspace:// and service:// URLs
	const parts: string[] = []
	let lastIndex = 0
	const protocolRegex = /(?:workspace|service):\/\/[^\s)><\]`"']+/g
	let protoMatch
	while ((protoMatch = protocolRegex.exec(result)) !== null) {
		if (isInCodeBlock(protoMatch.index)) continue
		const before = result.slice(Math.max(0, protoMatch.index - 6), protoMatch.index)
		if (
			before.endsWith('href="') ||
			before.endsWith("href='") ||
			before.endsWith('src="') ||
			before.endsWith("src='") ||
			before.endsWith('](')
		)
			continue

		const url = protoMatch[0]
		if (hasTemplateBraces(url)) continue
		parts.push(result.slice(lastIndex, protoMatch.index))
		if (url.startsWith('service://')) {
			parts.push(buildServiceTag(url))
		} else {
			parts.push(buildWorkspaceTag(url))
		}
		lastIndex = protoMatch.index + url.length
	}

	if (parts.length === 0) return result
	parts.push(result.slice(lastIndex))
	return parts.join('')
}

const escapeCurlyBraces = sharedEscapeCurlyBraces

const mentionIconNames: Record<string, string> = {
	expert: 'assistant',
	workspace: 'folder',
	file: 'insert_drive_file',
	directory: 'folder_open',
	clip: 'attachment'
}

const mentionCssClasses: Record<string, string> = {
	expert: 'mention-expert',
	workspace: 'mention-workspace',
	file: 'mention-file',
	directory: 'mention-directory',
	clip: 'mention-clip'
}

/**
 * Convert <Mention type="..." value="...">Label</Mention> tags into rendered HTML
 * before escapeInvalidHtmlTags runs (which would escape them as invalid).
 * file → <a>, everything else → <span>
 */
const wrapMentionTags = (text: string): string => {
	return text.replace(
		/<Mention\s+type="([^"]+)"\s+value="([^"]+)"[^>]*>([^<]*)<\/Mention>/g,
		(_match, type: string, value: string, label: string) => {
			const iconName = mentionIconNames[type] || 'insert_drive_file'
			const cls = mentionCssClasses[type] || 'mention-file'
			const safeLabel = escapeBraces(label)
			const iconHtml = `<i className="Icon material">${iconName}</i>`
			if (type === 'file') {
				return `<a className="mention-pill ${cls}" href="${value}">${iconHtml}${safeLabel}</a>`
			}
			return `<span className="mention-pill ${cls}">${iconHtml}${safeLabel}</span>`
		}
	)
}

const wrapVideoEmbeds = (text: string): string => {
	const codeBlockPositions: Array<[number, number]> = []
	const codeBlockRegex = /```/g
	let cbMatch
	let inCodeBlock = false
	while ((cbMatch = codeBlockRegex.exec(text)) !== null) {
		if (!inCodeBlock) {
			inCodeBlock = true
			codeBlockPositions.push([cbMatch.index, -1])
		} else {
			inCodeBlock = false
			const last = codeBlockPositions[codeBlockPositions.length - 1]
			if (last) last[1] = cbMatch.index + 3
		}
	}
	if (inCodeBlock) {
		const last = codeBlockPositions[codeBlockPositions.length - 1]
		if (last) last[1] = text.length
	}
	const isInCodeBlock = (pos: number) =>
		codeBlockPositions.some(([start, end]) => pos >= start && pos < end)

	const youtubeRegex =
		/^\s*(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})\S*)\s*$/gm
	const bilibiliRegex =
		/^\s*(https?:\/\/(?:www\.|m\.)?bilibili\.com\/video\/(BV[a-zA-Z0-9]+)\S*)\s*$/gm

	let result = text

	result = result.replace(youtubeRegex, (match, _fullUrl, videoId, offset) => {
		if (isInCodeBlock(offset)) return match
		return `<VideoEmbed src="https://www.youtube.com/embed/${videoId}" platform="youtube" />`
	})

	result = result.replace(bilibiliRegex, (match, _fullUrl, bvId, offset) => {
		if (isInCodeBlock(offset)) return match
		return `<VideoEmbed src="https://player.bilibili.com/player.html?bvid=${bvId}&autoplay=0" platform="bilibili" />`
	})

	return result
}

const escape = (text?: string) => {
	if (!text) return ''

	let result = text
		.replace(
			/\|([^|\n]*[<>][^|\n]*)\|/g,
			(_, content) => `|${content.replace(/[<>]/g, (match: string) => (match === '<' ? '&lt;' : '&gt;'))}|`
		)
		.replace(/\r/g, '')
		.replace(/\$\$[\n\r]+/g, '$$\n')
		.replace(/[\n\r]+\$\$/g, '\n$$')

	result = escapeCurlyBraces(result)

	result = wrapProtocolLinks(result)

	// Convert <Mention> tags to safe HTML BEFORE escapeInvalidHtmlTags
	result = wrapMentionTags(result)

	result = escapeInvalidHtmlTags(result)

	result = handleUnclosedHtmlTags(result)

	result = wrapVideoEmbeds(result)

	const codeBlocks = result.match(/```/g) || []
	const codeBlockCount = codeBlocks.length
	const hasUnclosedCodeBlock = codeBlockCount % 2 !== 0

	if (hasUnclosedCodeBlock) {
		result = result + '\n```'
	}

	return result
}

const unescape = unescapeCurlyBraces

const Text = ({ message }: ITextProps) => {
	const contentText = message.props?.content || ''
	const [content, setContent] = useState<any>('')
	const [referenceState, setReferenceState] = useState<ReferenceState | null>(null)
	const [previewImage, setPreviewImage] = useState<PreviewImageState | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// Track last successful render to avoid flashing raw content on parse errors
	const lastSuccessRef = useRef<{ content: any; text: string }>({ content: '', text: '' })
	// Track consecutive errors to decide when to show fallback
	const errorCountRef = useRef(0)

	// Get request_id from message metadata for reference support
	// Note: request_id may be added dynamically by the stream handler
	const requestId = (message.metadata as Record<string, any>)?.request_id || ''

	/**
	 * Add tracking parameter to URL (same logic as ReferencePopover)
	 * - If URL has existing 'from' query param, rename it to '__from'
	 * - Add 'from=yaoagents.com' parameter
	 */
	const addTrackingParam = useCallback((url: string): string => {
		try {
			const urlObj = new URL(url)
			// If 'from' param exists, rename it to '__from'
			if (urlObj.searchParams.has('from')) {
				const originalFrom = urlObj.searchParams.get('from')
				urlObj.searchParams.delete('from')
				urlObj.searchParams.set('__from', originalFrom || '')
			}
			// Add our tracking param
			urlObj.searchParams.set('from', 'yaoagents.com')
			return urlObj.toString()
		} catch {
			// If URL parsing fails, fallback to simple append
			const separator = url.includes('?') ? '&' : '?'
			return `${url}${separator}from=yaoagents.com`
		}
	}, [])

	/**
	 * Check if URL is an external link (http/https)
	 */
	const isExternalLink = useCallback((url: string): boolean => {
		return url.startsWith('http://') || url.startsWith('https://')
	}, [])

	const isWorkspaceLink = useCallback((url: string): boolean => {
		return url.startsWith('workspace://')
	}, [])

	const handleWorkspaceLinkOpen = useCallback((href: string) => {
		const ref = ParseFileRef(href)
		if (ref.type !== 'workspace' || !ref.filePath) return
		const fileName = ref.filePath.split('/').pop() || ref.filePath
		window.$app?.Event?.emit('app/openSidebar', {
			url: `/preview?ws=${ref.workspaceId}&path=${encodeURIComponent(ref.filePath)}`,
			title: fileName
		})
	}, [])

	const isServiceLink = useCallback((url: string): boolean => {
		return url.startsWith('service://')
	}, [])

	const handleServiceLinkOpen = useCallback(async (href: string, linkTitle?: string) => {
		const ref = ParseFileRef(href)
		if (ref.type !== 'service' || !ref.nodeId || !ref.targetId || !ref.port) return

		try {
			const baseURL = window.$app?.openapi?.config?.baseURL ?? '/v1'

			const resp = await fetch(
				`${baseURL}/tai/${ref.nodeId}/webproxy/bindings?target_id=${encodeURIComponent(ref.targetId)}`,
				{ credentials: 'include' }
			)
			if (!resp.ok) throw new Error(`Failed to fetch bindings: ${resp.status}`)
			const data = await resp.json()

			let hostPort: number | undefined
			let domainSource = data
			for (const target of data.targets || []) {
				for (const asst of target.assistants || []) {
					const svc = (asst.services || []).find(
						(s: any) => s.port === ref.port && s.bound
					)
					if (svc?.host_port) {
						hostPort = svc.host_port
						break
					}
				}
				if (hostPort) break
				const tmp = (target.temporary || []).find(
					(t: any) => t.target_port === ref.port
				)
				if (tmp) hostPort = tmp.host_port
				if (hostPort) break
			}

			if (!hostPort) {
				const bindResp = await fetch(`${baseURL}/tai/${ref.nodeId}/webproxy/bindings`, {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						target_id: ref.targetId,
						port: ref.port,
						label: `Port ${ref.port}`
					})
				})
				if (!bindResp.ok) throw new Error(`Failed to bind port: ${bindResp.status}`)
				const bindData = await bindResp.json()
				domainSource = bindData.domain ? bindData : data
				for (const target of bindData.targets || []) {
					for (const asst of target.assistants || []) {
						const svc = (asst.services || []).find(
							(s: any) => s.port === ref.port && s.bound
						)
						if (svc?.host_port) {
							hostPort = svc.host_port
							break
						}
					}
					if (hostPort) break
					const tmp = (target.temporary || []).find(
						(t: any) => t.target_port === ref.port
					)
					if (tmp) hostPort = tmp.host_port
					if (hostPort) break
				}
			}

			if (!hostPort) {
				antdMessage.error('Service port not available')
				return
			}

			const { domain, prefix } = domainSource
			let url: string
			if (domain) {
				url = `https://${prefix || ''}${hostPort}.${domain}`
			} else {
				url = `${location.protocol}//${location.hostname}:${hostPort}`
			}
			if (ref.servicePath) url += '/' + ref.servicePath

			window.$app?.Event?.emit('app/openSidebar', {
				url,
				title: linkTitle || ref.serviceTitle || `Service :${ref.port}`,
				icon: 'material-web'
			})
		} catch (err: any) {
			antdMessage.error(err?.message || 'Failed to open service')
		}
	}, [])

	// Handle link clicks (reference links, workspace links, and external links)
	const handleLinkClick = useCallback(
		(e: MouseEvent) => {
			const target = e.target as HTMLElement

			// Check for image clicks - open preview overlay
			const imgEl = target.closest('img') as HTMLImageElement
			if (imgEl) {
				if (imgEl.naturalWidth > 0 && imgEl.naturalWidth < 40 && imgEl.naturalHeight < 40) return
				e.preventDefault()
				e.stopPropagation()
				const imgSrc = imgEl.getAttribute('src')
				if (!imgSrc) return
				const imgAlt = imgEl.getAttribute('alt') || undefined
				const imgWsSrc = imgEl.getAttribute('data-ws-src') || undefined
				setPreviewImage({
					src: imgSrc,
					alt: imgAlt,
					wsSrc: imgWsSrc,
					type: imgWsSrc ? 'workspace' : 'external'
				})
				return
			}

			// First check for reference links (a.ref)
			const refLink = target.closest('a.ref') as HTMLAnchorElement
			if (refLink) {
				e.preventDefault()
				e.stopPropagation()

				const refId = refLink.dataset.refId
				const refType = refLink.dataset.refType || 'web'

				if (refId && requestId) {
					// Parse the ref index from the refId (e.g., "1", "2", etc.)
					const refIndex = parseInt(refId, 10)

					if (!isNaN(refIndex)) {
						setReferenceState({
							requestId,
							refIndex,
							refType,
							anchorEl: refLink
						})
					}
				}
				return
			}

			// Check for all links (workspace:// and external)
			const link = target.closest('a') as HTMLAnchorElement
			if (link) {
				const href = link.getAttribute('href')
				if (!href) return

				// Handle workspace:// links
				if (isWorkspaceLink(href)) {
					e.preventDefault()
					e.stopPropagation()
					handleWorkspaceLinkOpen(href)
					return
				}

				// Handle service:// links
				if (isServiceLink(href)) {
					e.preventDefault()
					e.stopPropagation()
					const hasIcon = link.querySelector('i.Icon')
					const linkTitle = hasIcon ? undefined : link.textContent?.trim()
					handleServiceLinkOpen(href, linkTitle || undefined)
					return
				}

				// Handle external http/https links
				if (isExternalLink(href)) {
					e.preventDefault()
					e.stopPropagation()

					// Add tracking parameter and open in new window
					// External sites can't be loaded in iframe due to security restrictions
					const trackedUrl = addTrackingParam(href)
					window.open(trackedUrl, '_blank', 'noopener,noreferrer')
				}
			}
		},
		[requestId, isExternalLink, isWorkspaceLink, isServiceLink, addTrackingParam, handleWorkspaceLinkOpen, handleServiceLinkOpen]
	)

	// Close reference popover
	const handleCloseReference = useCallback(() => {
		setReferenceState(null)
	}, [])

	// ESC key to close image preview
	useEffect(() => {
		if (!previewImage) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setPreviewImage(null)
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [previewImage])

	// Download the previewed image (same pattern as Preview page)
	const handleImageDownload = useCallback(async () => {
		if (!previewImage) return
		let filename: string
		if (previewImage.wsSrc) {
			filename = ParseFileRef(previewImage.wsSrc).filePath?.split('/').pop() || 'image'
		} else {
			try {
				filename = decodeURIComponent(new URL(previewImage.src).pathname.split('/').pop() || '') || previewImage.alt || 'image'
			} catch {
				filename = previewImage.alt || 'image'
			}
		}
		try {
			const resp = await fetch(previewImage.src, { credentials: 'include' })
			if (!resp.ok) throw new Error('Download failed')
			const blob = await resp.blob()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = filename
			a.style.display = 'none'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
		} catch {
			window.open(previewImage.src, '_blank', 'noopener,noreferrer')
		}
	}, [previewImage])

	// Attach click handler to container
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		container.addEventListener('click', handleLinkClick as EventListener)

		return () => {
			container.removeEventListener('click', handleLinkClick as EventListener)
		}
	}, [handleLinkClick])

	const mdxComponents = useMDXComponents(components())

	useAsyncEffect(async () => {
		if (!contentText) {
			setContent('')
			lastSuccessRef.current = { content: '', text: '' }
			errorCountRef.current = 0
			return
		}

		const vfile = new VFile(escape(contentText))
		const [err, compiledSource] = await to(
			compile(vfile, {
				format: 'mdx',
				outputFormat: 'function-body',
				providerImportSource: '@mdx-js/react',
				development: false,
				remarkPlugins: [remarkGfm, [remarkMath, { strict: true }]],
				rehypePlugins: [
					// Remove whitespace text nodes from table structure elements first
					() => (tree) => {
						visit(
							tree,
							(node: any) => {
								return (
									node?.type === 'element' &&
									['table', 'thead', 'tbody', 'tfoot', 'tr'].includes(node.tagName)
								)
							},
							(node: any) => {
								if (node.children) {
									node.children = node.children.filter((child: any) => {
										// Keep non-text nodes
										if (child.type !== 'text') return true
										// Remove text nodes that are only whitespace/newlines
										return child.value && !/^\s*$/.test(child.value)
									})
								}
							}
						)
					},
					// Store raw code content before any transformations
					() => (tree) => {
						visit(tree, (node: any) => {
							if (node?.type === 'element' && node?.tagName === 'pre') {
								const [codeEl] = node.children || []
								if (
									codeEl?.tagName === 'code' &&
									codeEl.children?.[0]?.type === 'text'
								) {
									const rawValue = codeEl.children[0].value
									node.raw = unescape(rawValue)
								}
							}
						})
					},
					// Replace \{ => { and \} => } in text nodes (but NOT in code blocks)
					() => (tree) => {
						visit(tree, (node: any, index: any, parent: any) => {
							if (node?.type === 'text') {
								// Skip if inside code or pre
								if (
									parent?.type === 'element' &&
									['code', 'pre'].includes(parent.tagName)
								) {
									return
								}
								node.value = unescape(node.value)
							}
						})
					},
					[rehypeKatex, { output: 'mathml', strict: true, throwOnError: false }],
					rehypeHighlight.bind(null, { ignoreMissing: true }),
					// After highlight, restore raw content and handle special cases
					() => (tree) => {
						visit(tree, (node: any) => {
							if (node?.type === 'element' && node?.tagName === 'pre') {
								for (const child of node.children) {
									if (child.tagName === 'code') {
										child.properties['raw'] = node.raw
										// Handle mermaid code blocks
										if (
											child.properties?.className?.includes(
												'language-mermaid'
											)
										) {
											child.properties.raw = node.raw
										}
									}
								}
							}
						})
					},
				// Resolve workspace:// URLs in src attributes for all elements
				() => (tree) => {
					visit(tree, (node: any) => {
						// Standard HTML elements (from markdown syntax like ![](workspace://...))
						if (node?.type === 'element') {
							const src = node.properties?.src
							if (typeof src === 'string' && src.startsWith('workspace://')) {
								node.properties['data-ws-src'] = src
								node.properties.src = ResolveFileURL(src)
							}
						}
						// MDX JSX elements (from HTML written in source like <img src="workspace://...">)
						if (node?.type === 'mdxJsxFlowElement' || node?.type === 'mdxJsxTextElement') {
							const attrs = node.attributes
							if (!Array.isArray(attrs)) return
							const srcAttr = attrs.find((a: any) => a.type === 'mdxJsxAttribute' && a.name === 'src')
							if (srcAttr && typeof srcAttr.value === 'string' && srcAttr.value.startsWith('workspace://')) {
								const original = srcAttr.value
								srcAttr.value = ResolveFileURL(original)
								if (!attrs.some((a: any) => a.name === 'data-ws-src')) {
									attrs.push({ type: 'mdxJsxAttribute', name: 'data-ws-src', value: original })
								}
							}
						}
					})
				},
				// Ensure workspace:// and service:// links have their respective classes
				() => (tree) => {
					visit(tree, (node: any) => {
						if (node?.type === 'element' && node?.tagName === 'a') {
							const href = node.properties?.href
							if (typeof href === 'string' && href.startsWith('workspace://')) {
								const cls = Array.isArray(node.properties.className)
									? node.properties.className.join(' ')
									: (node.properties.className || '')
								if (!cls.includes('workspace-link')) {
									node.properties.className = (cls + ' workspace-link').trim()
								}
							}
							if (typeof href === 'string' && href.startsWith('service://')) {
								const cls = Array.isArray(node.properties.className)
									? node.properties.className.join(' ')
									: (node.properties.className || '')
								if (!cls.includes('service-link')) {
									node.properties.className = (cls + ' service-link').trim()
								}
							}
						}
					})
				},
				// Handle newlines - convert standalone newlines to paragraph breaks
				() => (tree) => {
					visit(tree, (node: any, index: any, parent: any) => {
						if (node?.type === 'text' && node?.value === '\n') {
							const skipInTags = [
								'table',
								'thead',
								'tbody',
								'tfoot',
								'tr',
								'th',
								'td',
								'pre',
								'code'
							]
							if (parent?.type === 'element' && skipInTags.includes(parent.tagName)) {
								return
							}
							node.type = 'element'
							node.tagName = 'p'
							node.properties = { className: styles.newline }
							node.children = []
						}
					})
				}
				]
			})
		)

		if (err) {
			errorCountRef.current++

			// During streaming, keep showing last successful render to avoid flashing
			// Only show fallback if:
			// 1. We have no previous successful render, OR
			// 2. Stream is complete (delta is false) and we've had multiple consecutive errors
			const isStreaming = message.delta !== false
			const hasLastSuccess = lastSuccessRef.current.content !== ''

			if (isStreaming && hasLastSuccess) {
				// Keep showing last successful content during streaming parse errors
				// This prevents flashing raw markdown during incomplete chunks
				return
			}

			if (!hasLastSuccess || errorCountRef.current > 3) {
				// No previous success or too many errors, show fallback
				setContent(<div className='whitespace-pre-wrap'>{contentText}</div>)
			}
			return
		}

		if (!compiledSource) return

		try {
			const { default: Content } = await run(compiledSource, {
				...JsxRuntime,
				Fragment,
				useMDXComponents: () => mdxComponents
			})
			// Success! Update content and save as last successful render
			setContent(<Content />)
			lastSuccessRef.current = { content: <Content />, text: contentText }
			errorCountRef.current = 0
		} catch (err) {
			errorCountRef.current++

			const isStreaming = message.delta !== false
			const hasLastSuccess = lastSuccessRef.current.content !== ''

			if (isStreaming && hasLastSuccess) {
				// Keep showing last successful content during streaming
				return
			}

			if (!hasLastSuccess || errorCountRef.current > 3) {
				setContent(<div className='whitespace-pre-wrap'>{contentText}</div>)
			}
		}
	}, [contentText, message.delta])

	return (
		<MdxErrorBoundary fallbackContent={contentText} resetKeys={[contentText]}>
			<div ref={containerRef} className={styles._local}>
				{content}

				{/* Reference Popover */}
				{referenceState && (
					<ReferencePopover
						requestId={referenceState.requestId}
						refIndex={referenceState.refIndex}
						refType={referenceState.refType}
						anchorEl={referenceState.anchorEl}
						onClose={handleCloseReference}
					/>
				)}

		</div>

		{previewImage && createPortal(
			<div className={styles.imagePreviewOverlay} onClick={(e) => { if (e.target === e.currentTarget) setPreviewImage(null) }}>
				<div className={styles.imagePreviewToolbar}>
					<div className={styles.previewFileInfo}>
						<i className='Icon material'>
							{previewImage.type === 'workspace' ? 'insert_drive_file' : 'image'}
						</i>
						<span>
							{previewImage.wsSrc
								? ParseFileRef(previewImage.wsSrc).filePath || 'image'
								: previewImage.alt || (() => {
									try { return decodeURIComponent(new URL(previewImage.src).pathname.split('/').pop() || '') || 'image' }
									catch { return 'image' }
								})()
							}
						</span>
					</div>
					<span style={{ flex: 1 }} />
					<div className={styles.previewActions}>
						<span className={styles.previewBtn} onClick={handleImageDownload} title='Download'>
							<i className='Icon material'>download</i>
						</span>
						<span className={styles.previewBtn} onClick={() => setPreviewImage(null)} title='Close'>
							<i className='Icon material'>close</i>
						</span>
					</div>
				</div>
				<div className={styles.imagePreviewBody}>
					<ImageViewer src={previewImage.src} fileName={previewImage.alt} />
				</div>
			</div>,
			document.body
		)}
	</MdxErrorBoundary>
	)
}

export default window.$app?.memo ? window.$app.memo(Text) : React.memo(Text)
