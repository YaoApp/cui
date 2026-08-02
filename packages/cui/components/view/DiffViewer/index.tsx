import { useMemo } from 'react'
import { MonacoDiffEditor } from 'react-monaco-editor'
import type { MonacoDiffEditorProps } from 'react-monaco-editor'
import { useGlobal } from '@/context/app'
import vars from '@/styles/preset/vars'

interface DiffViewerProps {
	original: string
	modified: string
	language?: string
	sideBySide?: boolean
	isBinary?: boolean
	isNew?: boolean
	isDeleted?: boolean
	isTooLarge?: boolean
}

const DiffViewer = ({
	original,
	modified,
	language = 'plaintext',
	sideBySide = true,
	isBinary,
	isNew,
	isDeleted,
	isTooLarge
}: DiffViewerProps) => {
	const global = useGlobal()
	const theme = useMemo(() => (global.theme === 'dark' ? 'x-dark' : 'x-light'), [global.theme])

	const editorDidMount: MonacoDiffEditorProps['editorDidMount'] = (_editor, monaco) => {
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
	}

	if (isBinary) {
		return (
			<div style={{ padding: 40, textAlign: 'center', color: 'var(--color_text_grey)' }}>
				Binary file — diff not available
			</div>
		)
	}

	if (isTooLarge) {
		return (
			<div style={{ padding: 40, textAlign: 'center', color: 'var(--color_text_grey)' }}>
				File too large ({'>'}5MB) — diff not available
			</div>
		)
	}

	return (
		<MonacoDiffEditor
			language={language}
			theme={theme}
			original={isNew ? '' : original}
			value={isDeleted ? '' : modified}
			options={{
				readOnly: true,
				renderSideBySide: sideBySide,
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				fontSize: 13,
				lineHeight: 20,
				automaticLayout: true
			}}
			editorDidMount={editorDidMount}
		/>
	)
}

export default DiffViewer
