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
