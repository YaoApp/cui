import React, { useState, useRef, useEffect } from 'react'
import { message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './WeightEditor.less'

interface WeightEditorProps {
	value: number
	onChange: (value: number) => void
	disabled?: boolean // 保留接口兼容性，但内部不使用
}

const WeightEditor: React.FC<WeightEditorProps> = ({ value, onChange, disabled = false }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [isEditing, setIsEditing] = useState(false)
	const [editValue, setEditValue] = useState((value || 0).toString())
	const [isHovered, setIsHovered] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	// 点击外部关闭编辑
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				handleCancel()
			}
		}

		if (isEditing) {
			document.addEventListener('mousedown', handleClickOutside)
			// 自动聚焦输入框
			setTimeout(() => {
				inputRef.current?.focus()
				inputRef.current?.select()
			}, 0)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isEditing])

	const handleClick = () => {
		// 始终可以点击，不检查 disabled 状态
		setEditValue((value || 0).toString())
		setIsEditing(true)
	}

	const handleSave = () => {
		const numValue = parseFloat(editValue)
		if (isNaN(numValue)) {
			message.error(is_cn ? '请输入有效的数字' : 'Please enter a valid number')
			return
		}

		if (numValue < 0 || numValue > 1) {
			message.error(is_cn ? '权重值必须在 0-1 之间' : 'Weight must be between 0-1')
			return
		}

		onChange(numValue)
		setIsEditing(false)
		message.success(is_cn ? '权重已更新' : 'Weight updated')
	}

	const handleCancel = () => {
		setEditValue((value || 0).toString())
		setIsEditing(false)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSave()
		} else if (e.key === 'Escape') {
			handleCancel()
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditValue(e.target.value)
	}

	return (
		<div
			ref={containerRef}
			className={styles.weightEditor}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* 显示值 */}
			<span className={`${styles.weightValue} ${isHovered ? styles.hovered : ''}`} onClick={handleClick}>
				{(value || 0).toFixed(2)}
				<Icon
					name='material-edit'
					size={10}
					className={`${styles.editIcon} ${isHovered ? styles.visible : ''}`}
				/>
			</span>

			{/* 编辑弹窗 */}
			{isEditing && (
				<div className={styles.editTooltip}>
					<div className={styles.inputWrapper}>
						<input
							ref={inputRef}
							type='number'
							value={editValue}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							min='0'
							max='1'
							step='0.01'
							className={styles.weightInput}
							placeholder={is_cn ? '输入权重值' : 'Enter weight'}
						/>
						<div className={styles.actions}>
							<button
								className={styles.saveButton}
								onClick={handleSave}
								title={is_cn ? '保存' : 'Save'}
							>
								<Icon name='material-check' size={12} />
							</button>
							<button
								className={styles.cancelButton}
								onClick={handleCancel}
								title={is_cn ? '取消' : 'Cancel'}
							>
								<Icon name='material-close' size={12} />
							</button>
						</div>
					</div>
					<div className={styles.tooltipArrow}></div>
				</div>
			)}
		</div>
	)
}

export default WeightEditor
