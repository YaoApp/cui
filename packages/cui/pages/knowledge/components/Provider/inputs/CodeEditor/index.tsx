import React, { useState, useEffect, useMemo, useRef } from 'react'
import { InputComponentProps } from '../../types'
import ErrorMessage from '../ErrorMessage'
import styles from './index.less'
import commonStyles from '../common.less'

// Monaco Editor imports
let Editor: any = null
let monaco: any = null

// Dynamically import Monaco Editor
const loadMonacoEditor = async () => {
	if (Editor) return { Editor, monaco }

	try {
		const monacoModule = await import('react-monaco-editor')
		Editor = monacoModule.default
		return { Editor, monaco: (window as any).monaco }
	} catch (error) {
		console.warn('Failed to load Monaco Editor, falling back to textarea:', error)
		return { Editor: null, monaco: null }
	}
}

export default function CodeEditor({ schema, value, onChange, error, hasError }: InputComponentProps) {
	const [editorState, setEditorState] = useState<{
		loaded: boolean
		component: any
		error: boolean
	}>({
		loaded: false,
		component: null,
		error: false
	})
	const editorRef = useRef<any>()
	const stringValue = typeof value === 'string' ? value : ''

	// Detect language from schema or default to json
	const language = useMemo(() => {
		// Try to detect from schema title or description
		const schemaText = ((schema.title || '') + ' ' + (schema.description || '')).toLowerCase()
		if (schemaText.includes('jsonc')) return 'jsonc'
		if (schemaText.includes('json')) return 'json'
		if (schemaText.includes('javascript') || schemaText.includes('js')) return 'javascript'
		if (schemaText.includes('typescript') || schemaText.includes('ts')) return 'typescript'
		if (schemaText.includes('yaml') || schemaText.includes('yml')) return 'yaml'
		if (schemaText.includes('xml')) return 'xml'
		if (schemaText.includes('css')) return 'css'
		if (schemaText.includes('html')) return 'html'
		if (schemaText.includes('python')) return 'python'
		if (schemaText.includes('sql')) return 'sql'
		if (schemaText.includes('markdown')) return 'markdown'
		return 'json' // Default to JSON
	}, [schema.title, schema.description])

	// Get theme from document attribute (following project pattern)
	const theme = useMemo(() => {
		const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
		return isDark ? 'x-dark' : 'x-light'
	}, [])

	// Load Monaco Editor on mount
	useEffect(() => {
		loadMonacoEditor()
			.then(({ Editor: LoadedEditor }) => {
				if (LoadedEditor) {
					setEditorState({
						loaded: true,
						component: LoadedEditor,
						error: false
					})
				} else {
					setEditorState({
						loaded: false,
						component: null,
						error: true
					})
				}
			})
			.catch(() => {
				setEditorState({
					loaded: false,
					component: null,
					error: true
				})
			})
	}, [])

	// Handle resize observer for editor layout (following project pattern)
	useEffect(() => {
		if (!editorRef.current) return

		const resizeObserver = new ResizeObserver(() => {
			if (editorRef.current) {
				editorRef.current.layout()
			}
		})

		const container = document.querySelector(`.${styles.codeEditor}`)
		if (container) {
			resizeObserver.observe(container)
		}

		return () => {
			resizeObserver.disconnect()
		}
	}, [editorState.loaded])

	const handleChange = (newValue: string) => {
		if (typeof newValue === 'string') {
			onChange(newValue)
		}
	}

	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value)
	}

	const editorDidMount = (editor: any, monacoInstance: any) => {
		editorRef.current = editor

		// Define custom themes (following project pattern)
		monacoInstance.editor.defineTheme('x-dark', {
			base: 'vs-dark',
			inherit: true,
			rules: [],
			colors: {
				'editor.background': '#2f2f34'
			}
		})

		monacoInstance.editor.defineTheme('x-light', {
			base: 'vs',
			inherit: true,
			rules: [],
			colors: {
				'editor.background': '#ffffff'
			}
		})

		monacoInstance.editor.setTheme(theme)

		// Enable JSON diagnostics for JSON files (following project pattern)
		if (language === 'json' || language === 'jsonc') {
			try {
				monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
					validate: true,
					allowComments: language === 'jsonc',
					schemas: []
				})
			} catch (error) {
				console.warn('Failed to set JSON diagnostics:', error)
			}
		}

		// Fix select all when the editor is loaded (following project pattern)
		editor.onDidChangeModelContent(() => {
			const position = editor.getPosition()
			if (position && editor.getModel()?.getValue() !== '') {
				editor.setPosition(position)
			}
		})
	}

	// Show loading state while Monaco Editor is loading
	if (!editorState.loaded && !editorState.error) {
		return (
			<div className={styles.codeEditor}>
				<div className={styles.loadingState}>Loading code editor...</div>
			</div>
		)
	}

	// If Monaco Editor failed to load, use textarea fallback
	if (!editorState.loaded || !editorState.component) {
		const textareaClass = `${styles.textareaFallback} ${hasError ? commonStyles.error : ''}`
		return (
			<div className={commonStyles.inputContainer}>
				<textarea
					className={textareaClass}
					value={stringValue}
					onChange={handleTextareaChange}
					placeholder={schema.placeholder || 'Enter code...'}
					disabled={schema.disabled}
					readOnly={schema.readOnly}
				/>
				<ErrorMessage message={error} show={hasError} />
			</div>
		)
	}

	const MonacoEditor = editorState.component

	const editorContainerClass = `${styles.codeEditor} ${hasError ? commonStyles.error : ''}`

	return (
		<div className={commonStyles.inputContainer}>
			<div className={editorContainerClass}>
				<MonacoEditor
					className={styles.editor}
					width='100%'
					height='100%'
					language={language === 'jsonc' ? 'json' : language}
					theme={theme}
					value={stringValue}
					onChange={handleChange}
					options={{
						readOnly: schema.readOnly || schema.disabled,
						wordWrap: 'on',
						formatOnPaste: true,
						formatOnType: true,
						renderLineHighlight: 'none',
						smoothScrolling: true,
						padding: { top: 15 },
						lineNumbersMinChars: 3,
						minimap: { enabled: false },
						lineNumbers: 'on',
						scrollbar: {
							verticalScrollbarSize: 8,
							horizontalSliderSize: 8,
							useShadows: false
						}
					}}
					editorDidMount={editorDidMount}
				/>
			</div>
			<ErrorMessage message={error} show={hasError} />
		</div>
	)
}
