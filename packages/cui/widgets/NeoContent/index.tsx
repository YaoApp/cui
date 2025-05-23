import { useAsyncEffect } from 'ahooks'
import to from 'await-to-js'
import clsx from 'clsx'
import { Fragment, useState } from 'react'
import * as JsxRuntime from 'react/jsx-runtime'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { VFile } from 'vfile'

import { compile, run } from '@mdx-js/mdx'
import { useMDXComponents } from '@mdx-js/react'

import components from './components'
import styles from './index.less'
import { App } from '@/types'

interface IProps {
	chat_info: App.ChatAI
	type?: App.ChatMessageType
	callback?: () => void
}

const Index = (props: IProps) => {
	const { chat_info, type, callback } = props
	const [target, setTarget] = useState<any>()
	const mdx_components = useMDXComponents(components)

	useAsyncEffect(async () => {
		// If there is an error, display the error message
		if (type === 'error') {
			setTarget(<div className={'error'}>{chat_info.text}</div>)
			return
		}

		const vfile = new VFile(chat_info.text)
		const [err, compiled_source] = await to(
			compile(vfile, {
				format: 'md',
				outputFormat: 'function-body',
				providerImportSource: '@mdx-js/react',
				remarkPlugins: [remarkGfm],
				rehypePlugins: [
					() => (tree) => {
						visit(tree, (node) => {
							if (node?.type === 'text' && node?.value === '\n') {
								node.type = 'element'
								node.tagName = 'p'
								node.properties = { className: '_newline' }
							}

							if (node?.type === 'element' && node?.tagName === 'pre') {
								const [codeEl] = node.children

								if (codeEl.tagName !== 'code') return

								node.raw = codeEl.children?.[0].value
							}
						})
					},
					rehypeHighlight,
					() => (tree) => {
						visit(tree, (node) => {
							if (node?.type === 'element' && node?.tagName === 'pre') {
								for (const child of node.children) {
									if (child.tagName === 'code') {
										child.properties['raw'] = node.raw
									}
								}
							}
						})
					}
				]
			})
		)

		if (err) {
			setTarget(<div className={'error'}>{err.message}</div>)
			return
		}

		if (!compiled_source) return
		compiled_source.value = (compiled_source.value as string).replaceAll('%7B', '{')

		const { default: Content } = await run(compiled_source, {
			...JsxRuntime,
			Fragment,
			useMDXComponents: () => mdx_components
		})

		setTarget(Content)
		callback?.()
	}, [chat_info])

	return <div className={clsx(styles._local)}>{target}</div>
}

export default window.$app.memo(Index)
