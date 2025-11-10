import React, { useState, useRef, KeyboardEvent } from 'react'
import { InputComponentProps } from '../types'
import ErrorMessage from '../ErrorMessage'
import Icon from '@/widgets/Icon'
import styles from './index.less'
import commonStyles from '../common.less'

export interface ChatBoxFile {
	name: string
	size: number
	type: string
	file: File
}

export interface ChatBoxProps extends InputComponentProps {
	onSend?: (message: string, files: ChatBoxFile[]) => void
	onFilesChange?: (files: ChatBoxFile[]) => void
	files?: ChatBoxFile[]
	maxFiles?: number
	acceptFileTypes?: string
	sendButtonText?: string
	placeholder?: string
	disabled?: boolean
	loading?: boolean
}

export default function ChatBox({
	schema,
	value,
	onChange,
	onSend,
	onFilesChange,
	files = [],
	maxFiles = 5,
	acceptFileTypes = '*',
	sendButtonText = '创建',
	disabled = false,
	loading = false,
	error,
	hasError
}: ChatBoxProps) {
	const [localFiles, setLocalFiles] = useState<ChatBoxFile[]>(files)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange?.(e.target.value)
		adjustTextareaHeight()
	}

	const adjustTextareaHeight = () => {
		const textarea = textareaRef.current
		if (textarea) {
			textarea.style.height = 'auto'
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
		}
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		// Ctrl/Cmd + Enter to send
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault()
			handleSend()
		}
	}

	const handleSend = () => {
		if (!value || String(value).trim() === '' || disabled || loading) {
			return
		}
		onSend?.(String(value), localFiles)
	}

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files || [])
		if (localFiles.length + selectedFiles.length > maxFiles) {
			// 超过文件数量限制
			return
		}

		const newFiles: ChatBoxFile[] = selectedFiles.map((file) => ({
			name: file.name,
			size: file.size,
			type: file.type,
			file
		}))

		const updatedFiles = [...localFiles, ...newFiles]
		setLocalFiles(updatedFiles)
		onFilesChange?.(updatedFiles)

		// 重置 input
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleRemoveFile = (index: number) => {
		const updatedFiles = localFiles.filter((_, i) => i !== index)
		setLocalFiles(updatedFiles)
		onFilesChange?.(updatedFiles)
	}

	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
	}

	const canAddMoreFiles = localFiles.length < maxFiles

	const chatBoxClass = `${styles.chatBox} ${hasError ? commonStyles.error : ''} ${
		disabled || loading ? styles.disabled : ''
	}`

	return (
		<div className={commonStyles.inputContainer}>
			<div className={chatBoxClass}>
				{/* Files preview */}
				{localFiles.length > 0 && (
					<div className={styles.filesPreview}>
						{localFiles.map((file, index) => (
							<div key={index} className={styles.fileItem}>
								<div className={styles.fileIcon}>
									<Icon name='material-insert_drive_file' size={16} />
								</div>
								<div className={styles.fileInfo}>
									<div className={styles.fileName}>{file.name}</div>
									<div className={styles.fileSize}>{formatFileSize(file.size)}</div>
								</div>
								<button
									type='button'
									className={styles.removeFileButton}
									onClick={() => handleRemoveFile(index)}
									disabled={disabled || loading}
								>
									<Icon name='material-close' size={14} />
								</button>
							</div>
						))}
					</div>
				)}

				{/* Input area */}
				<div className={styles.inputArea}>
					<textarea
						ref={textareaRef}
						className={styles.textarea}
						value={String(value || '')}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						placeholder={schema.placeholder || '描述你需要创建的智能体...'}
						disabled={disabled || loading}
						rows={1}
					/>
					<div className={styles.actions}>
						<div className={styles.leftActions}>
							{canAddMoreFiles && (
								<>
									<input
										ref={fileInputRef}
										type='file'
										multiple
										accept={acceptFileTypes}
										onChange={handleFileSelect}
										className={styles.fileInput}
										disabled={disabled || loading}
									/>
									<button
										type='button'
										className={styles.attachButton}
										onClick={() => fileInputRef.current?.click()}
										disabled={disabled || loading}
										title='上传附件'
									>
										<Icon name='material-attach_file' size={18} />
									</button>
								</>
							)}
						</div>
						<div className={styles.rightActions}>
							<button
								type='button'
								className={styles.sendButton}
								onClick={handleSend}
								disabled={!value || String(value).trim() === '' || disabled || loading}
							>
								{loading ? (
									<span className={styles.loadingText}>生成中...</span>
								) : (
									<>
										{sendButtonText}
										<Icon name='material-arrow_forward' size={16} />
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
			<ErrorMessage message={error} show={hasError} />
		</div>
	)
}
