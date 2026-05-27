import { useState } from 'react'
import { getLocale } from '@umijs/max'
import { useAsyncEffect } from 'ahooks'
import { Fragment } from 'react'
import * as JsxRuntime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { evaluate } from '@mdx-js/mdx'
import { App } from '@/types'
import Tag from '../../components/Tag'
import Icon from '@/widgets/Icon'
import MdxErrorBoundary from '@/widgets/MdxErrorBoundary'
import { escapeCurlyBraces, rehypeUnescapeBraces, rehypeUnescapeCodeBlocks } from '@/utils/mdx-helpers'
import { useLLMProviders } from '@/hooks/useLLMProviders'
import styles from './View/index.less'

interface OverviewProps {
	data: App.Assistant
	connectors?: { mapping?: Record<string, string> }
}

const OVERVIEW_HLJS_STYLE = `
.ov-hljs pre code.hljs{display:block;overflow-x:auto;padding:0}
.ov-hljs .hljs{background:transparent}
.ov-hljs .hljs-comment{color:#6a737d;font-style:italic}
.ov-hljs .hljs-keyword,.ov-hljs .hljs-selector-tag,.ov-hljs .hljs-title{color:#d73a49;font-weight:600}
.ov-hljs .hljs-string,.ov-hljs .hljs-attr{color:#032f62}
.ov-hljs .hljs-number,.ov-hljs .hljs-literal{color:#005cc5}
.ov-hljs .hljs-built_in,.ov-hljs .hljs-type{color:#6f42c1}
.ov-hljs .hljs-name,.ov-hljs .hljs-variable{color:#e36209}
.ov-hljs .hljs-operator{color:#d73a49}
.ov-hljs .hljs-meta{color:#005cc5}
.ov-hljs .hljs-property{color:#005cc5}
.ov-hljs .hljs-addition{color:#22863a;background:rgba(34,134,58,0.08)}
.ov-hljs .hljs-deletion{color:#b31d28;background:rgba(179,29,40,0.08)}
.ov-hljs .hljs-section{color:#005cc5;font-weight:700}
.ov-hljs .hljs-emphasis{font-style:italic}
.ov-hljs .hljs-strong{font-weight:700}
[data-theme='dark'] .ov-hljs .hljs-comment{color:#8b949e}
[data-theme='dark'] .ov-hljs .hljs-keyword,[data-theme='dark'] .ov-hljs .hljs-selector-tag,[data-theme='dark'] .ov-hljs .hljs-title{color:#ff7b72}
[data-theme='dark'] .ov-hljs .hljs-string,[data-theme='dark'] .ov-hljs .hljs-attr{color:#a5d6ff}
[data-theme='dark'] .ov-hljs .hljs-number,[data-theme='dark'] .ov-hljs .hljs-literal{color:#79c0ff}
[data-theme='dark'] .ov-hljs .hljs-built_in,[data-theme='dark'] .ov-hljs .hljs-type{color:#d2a8ff}
[data-theme='dark'] .ov-hljs .hljs-name,[data-theme='dark'] .ov-hljs .hljs-variable{color:#ffa657}
[data-theme='dark'] .ov-hljs .hljs-operator{color:#ff7b72}
[data-theme='dark'] .ov-hljs .hljs-meta{color:#79c0ff}
[data-theme='dark'] .ov-hljs .hljs-property{color:#79c0ff}
[data-theme='dark'] .ov-hljs .hljs-section{color:#79c0ff;font-weight:700}
`

const MarkdownContent = ({ content, is_cn }: { content: string; is_cn: boolean }) => {
	const [rendered, setRendered] = useState<any>(null)

	useAsyncEffect(async () => {
		if (!content) return
		try {
			const escaped = escapeCurlyBraces(content)
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
			setRendered(<div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>)
		}
	}, [content])

	if (!rendered) return <span className={styles.emptyValue}>{is_cn ? '暂无内容' : 'No content'}</span>
	return (
		<MdxErrorBoundary fallbackContent={content} resetKeys={[content]}>
			<style>{OVERVIEW_HLJS_STYLE}</style>
			<div className={`${styles.markdownContent} ov-hljs`}>{rendered}</div>
		</MdxErrorBoundary>
	)
}

const Overview = ({ data, connectors }: OverviewProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const { mapping: connectorMapping } = useLLMProviders()

	const boolLabel = (val: boolean | undefined) => {
		if (val) return is_cn ? '是' : 'Yes'
		return is_cn ? '否' : 'No'
	}

	return (
		<div className={styles.sectionContent}>
			{/* Capabilities card (first - most useful to users) */}
			{data.capabilities && (
				<div className={styles.card}>
					<MarkdownContent content={data.capabilities} is_cn={is_cn} />
				</div>
			)}

			{/* Basic info card */}
			<div className={styles.card}>
				<div className={styles.sectionTitle}>{is_cn ? '基本信息' : 'General'}</div>
				<div className={styles.kvTable}>
					<div className={styles.kvRow}>
						<div className={styles.kvLabel}>{is_cn ? '默认模型' : 'Default Model'}</div>
						<div className={styles.kvValue}>
							{data.connector
								? connectorMapping[data.connector] ||
									connectors?.mapping?.[data.connector] ||
									data.connector
								: '-'}
						</div>
					</div>

					{Array.isArray(data.tags) && data.tags.length > 0 && (
						<div className={styles.kvRow}>
							<div className={styles.kvLabel}>{is_cn ? '标签' : 'Tags'}</div>
							<div className={styles.kvValue}>
								<div className={styles.tagsDisplay}>
									{data.tags.map((tag: string, index: number) => (
										<Tag key={index} variant='auto'>
											{tag}
										</Tag>
									))}
								</div>
							</div>
						</div>
					)}

					<div className={styles.kvRow}>
						<div className={styles.kvLabel}>{is_cn ? '自动化' : 'Automation'}</div>
						<div className={styles.kvValue}>
							<span className={styles.statusBadge}>
								<Icon
									name={data.automated ? 'material-check_circle' : 'material-cancel'}
									size={14}
								/>
								{data.automated
									? is_cn ? '启用' : 'Enabled'
									: is_cn ? '禁用' : 'Disabled'}
							</span>
						</div>
					</div>

					<div className={styles.kvRow}>
						<div className={styles.kvLabel}>{is_cn ? '提及' : 'Mentions'}</div>
						<div className={styles.kvValue}>
							<span className={styles.statusBadge}>
								<Icon
									name={data.mentionable ? 'material-check_circle' : 'material-cancel'}
									size={14}
								/>
								{data.mentionable
									? is_cn ? '允许' : 'Allowed'
									: is_cn ? '不允许' : 'Disallowed'}
							</span>
						</div>
					</div>

					<div className={styles.kvRow}>
						<div className={styles.kvLabel}>{is_cn ? '沙箱' : 'Sandbox'}</div>
						<div className={styles.kvValue}>
							<span className={styles.statusBadge}>
								<Icon
									name={data.sandbox ? 'material-check_circle' : 'material-cancel'}
									size={14}
								/>
								{data.sandbox
									? is_cn ? '是' : 'Yes'
									: is_cn ? '否' : 'No'}
							</span>
						</div>
					</div>

					{data.built_in && (
						<div className={styles.kvRow}>
							<div className={styles.kvLabel}>{is_cn ? '内建' : 'Built-in'}</div>
							<div className={styles.kvValue}>
								<span className={styles.statusBadge}>
									<Icon name='material-check_circle' size={14} />
									{is_cn ? '是' : 'Yes'}
								</span>
							</div>
						</div>
					)}

					{!data.built_in && data.readonly && (
						<div className={styles.kvRow}>
							<div className={styles.kvLabel}>{is_cn ? '只读' : 'Readonly'}</div>
							<div className={styles.kvValue}>
								<span className={styles.statusBadge}>
									<Icon name='material-check_circle' size={14} />
									{is_cn ? '是' : 'Yes'}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default Overview
