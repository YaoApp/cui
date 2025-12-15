import { useAsyncEffect } from 'ahooks'
import to from 'await-to-js'
import React, { Fragment, useState } from 'react'
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
import Thinking from '../Thinking'
import ToolCall from '../ToolCall'
import type { TextMessage, ThinkingMessage, ToolCallMessage } from '../../../openapi'

interface ITextProps {
	message: TextMessage
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
	'colgroup'
]

// Create a regex pattern for allowed tags
const ALLOWED_TAG_PATTERN = new RegExp(
	`^<(\\/)?\\s*(${ALLOWED_HTML_TAGS.join('|')})(?:\\s|>|\\/>|$)`,
	'i'
)

/**
 * Escape < that are not part of valid HTML tags
 * This handles cases like "<3" which would break HTML parsing
 */
const escapeInvalidHtmlTags = (text: string): string => {
	// Match all < characters and check if they start a valid HTML tag
	return text.replace(/<([^>]*>?)/g, (match, afterBracket) => {
		const fullMatch = '<' + afterBracket
		// Check if this looks like a valid HTML tag
		if (ALLOWED_TAG_PATTERN.test(fullMatch)) {
			return match // Keep valid HTML tags
		}
		// Escape the < for non-valid tags like <3, <-- etc
		return '&lt;' + afterBracket
	})
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
					const selfClosingTags = ['br', 'hr', 'img', 'col']
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

const escape = (text?: string) => {
	if (!text) return ''

	let result = text
		// First, escape invalid HTML-like patterns (e.g., <3, <--, etc.)
		.replace(
			/\|([^|\n]*[<>][^|\n]*)\|/g,
			(_, content) => `|${content.replace(/[<>]/g, (match: string) => (match === '<' ? '&lt;' : '&gt;'))}|`
		)
		.replace(/\r/g, '')
		.replace(/\$\$[\n\r]+/g, '$$\n')
		.replace(/[\n\r]+\$\$/g, '\n$$')

	// Escape < that are not part of valid HTML tags (handles <3, <--, etc.)
	result = escapeInvalidHtmlTags(result)

	// Handle unclosed HTML tags during streaming
	result = handleUnclosedHtmlTags(result)

	// Auto-close unclosed code blocks to prevent MDX parse errors during streaming
	const codeBlocks = result.match(/```/g) || []
	const codeBlockCount = codeBlocks.length
	const hasUnclosedCodeBlock = codeBlockCount % 2 !== 0

	if (hasUnclosedCodeBlock) {
		result = result + '\n```'
	}

	return result
}

const unescape = (text?: string) => {
	return text?.replace(/\\{/g, '{').replace(/\\}/g, '}')
}

const Text = ({ message }: ITextProps) => {
	const contentText = message.props?.content || ''
	const [content, setContent] = useState<any>('')
	// We don't have 'done' status in TextMessage easily, assuming done for now or passing via props if available.
	// But usually Text message in chatbox might be streaming.
	// If streaming, we might want to pass that info. For now, let's assume default behavior.

	console.log('[MDX Text] Received message:', {
		ui_id: message.ui_id,
		chunk_id: message.chunk_id,
		message_id: message.message_id,
		type: message.type,
		delta: message.delta,
		content_length: contentText.length,
		content_preview: contentText.substring(0, 200)
	})

	const mdxComponents = useMDXComponents(components())

	useAsyncEffect(async () => {
		if (!contentText) {
			setContent('')
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
								const [codeEl] = node.children
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
			console.error(`[MDX Text] Parse error: ${err.message || err}`)
			// Fallback to plain text on error
			setContent(<div className='whitespace-pre-wrap'>{contentText}</div>)
			return
		}

		if (!compiledSource) return

		try {
			const { default: Content } = await run(compiledSource, {
				...JsxRuntime,
				Fragment,
				useMDXComponents: () => mdxComponents
			})
			setContent(Content)
		} catch (err) {
			console.error(`[MDX Text] Run error: ${err}`)
			setContent(<div className='whitespace-pre-wrap'>{contentText}</div>)
		}
	}, [contentText])

	return <div className={styles._local}>{content}</div>
}

export default window.$app?.memo ? window.$app.memo(Text) : React.memo(Text)
