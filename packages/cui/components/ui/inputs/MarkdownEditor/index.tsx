import React, { useState, useMemo, useCallback, useEffect } from 'react'
import MDEditor, { commands } from '@uiw/react-md-editor'
import { getLocale } from '@umijs/max'
import { InputComponentProps } from '../types'
import ErrorMessage from '../ErrorMessage'
import styles from './index.less'
import commonStyles from '../common.less'

const h1: commands.ICommand = {
	...commands.title1,
	icon: <span style={{ fontSize: 13, fontWeight: 700 }}>H1</span>
}
const h2: commands.ICommand = {
	...commands.title2,
	icon: <span style={{ fontSize: 13, fontWeight: 700 }}>H2</span>
}
const h3: commands.ICommand = {
	...commands.title3,
	icon: <span style={{ fontSize: 13, fontWeight: 600 }}>H3</span>
}

const toolbarCommands = [
	commands.bold,
	commands.italic,
	commands.divider,
	h1,
	h2,
	h3,
	commands.divider,
	commands.unorderedListCommand,
	commands.orderedListCommand,
	commands.divider,
	commands.link
]

type PreviewMode = 'edit' | 'live' | 'preview'

function parseModes(description?: string): PreviewMode[] {
	if (!description) return ['edit', 'live']
	const lower = description.toLowerCase()
	if (lower.includes('preview')) return ['edit', 'live', 'preview']
	return ['edit', 'live']
}

const modeLabels: Record<PreviewMode, { cn: string; en: string }> = {
	edit: { cn: '编辑', en: 'Edit' },
	live: { cn: '分栏', en: 'Split' },
	preview: { cn: '预览', en: 'Preview' }
}

export default function MarkdownEditor({ schema, value, onChange, error, hasError }: InputComponentProps) {
	const is_cn = getLocale() === 'zh-CN'
	const [focused, setFocused] = useState(false)
	const stringValue = typeof value === 'string' ? value : ''

	const isDark = useMemo(() => {
		return document.documentElement.getAttribute('data-theme') === 'dark'
	}, [])

	const defaultHeight = useMemo(() => {
		const rows = schema.rows || 6
		return rows * 24 + 40
	}, [schema.rows])

	const modes = useMemo(() => parseModes(schema.description), [schema.description])

	const [expanded, setExpanded] = useState(false)
	const [preview, setPreview] = useState<PreviewMode>('edit')

	const handleChange = useCallback(
		(val?: string) => {
			if (onChange) onChange(val || '')
		},
		[onChange]
	)

	useEffect(() => {
		if (!expanded) return
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation()
				setExpanded(false)
			}
		}
		document.addEventListener('keydown', handleKeyDown, true)
		return () => document.removeEventListener('keydown', handleKeyDown, true)
	}, [expanded])

	const cyclePreview = useCallback(() => {
		setPreview((prev) => {
			const idx = modes.indexOf(prev)
			return modes[(idx + 1) % modes.length]
		})
	}, [modes])

	const previewLabel = is_cn ? (modeLabels[preview]?.cn || '编辑') : (modeLabels[preview]?.en || 'Edit')

	const previewCommand: commands.ICommand = useMemo(
		() => ({
			name: 'preview-mode',
			keyCommand: 'preview-mode',
			position: 'right',
			render: () => (
				<button
					key='preview-mode'
					type='button'
					className={styles.toolbarBtn}
					onClick={(e) => {
						e.stopPropagation()
						cyclePreview()
					}}
				>
					<span className={styles.toolbarBtnLabel}>{previewLabel}</span>
				</button>
			)
		}),
		[previewLabel, cyclePreview]
	)

	const expandCommand: commands.ICommand = useMemo(
		() => ({
			name: 'expand',
			keyCommand: 'expand',
			position: 'right',
			render: () => (
				<button
					key='expand'
					type='button'
					className={styles.toolbarBtn}
					onClick={(e) => {
						e.stopPropagation()
						setExpanded((prev) => !prev)
					}}
					title={expanded ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
				>
					<svg width='14' height='14' viewBox='0 0 16 16' fill='currentColor'>
						{expanded ? (
							<path d='M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 0a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z' />
						) : (
							<path d='M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z' />
						)}
					</svg>
				</button>
			)
		}),
		[expanded]
	)

	const extraCommands = useMemo(() => [previewCommand, expandCommand], [previewCommand, expandCommand])

	const containerClass = [
		styles.markdownEditor,
		hasError ? styles.hasError : '',
		focused ? styles.focused : '',
		expanded ? styles.expanded : ''
	]
		.filter(Boolean)
		.join(' ')

	return (
		<div className={commonStyles.inputContainer}>
			<div className={containerClass} data-color-mode={isDark ? 'dark' : 'light'}>
				<MDEditor
					value={stringValue}
					onChange={handleChange}
					preview={preview}
					commands={toolbarCommands}
					extraCommands={extraCommands}
					height={expanded ? undefined : defaultHeight}
					visibleDragbar={false}
					highlightEnable={true}
					hideToolbar={schema.readOnly || schema.disabled}
					textareaProps={{
						placeholder: schema.placeholder,
						disabled: schema.disabled,
						readOnly: schema.readOnly,
						onFocus: () => setFocused(true),
						onBlur: () => setFocused(false)
					}}
				/>
			</div>
			<ErrorMessage message={error} show={hasError} />
		</div>
	)
}
