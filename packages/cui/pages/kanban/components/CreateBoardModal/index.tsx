import { useState, useEffect, useCallback, useRef } from 'react'
import Icon from '@/widgets/Icon'
import { useKanbanContext } from '../../context'
import presets from '../../presets.json'
import type { BoardTemplate } from '../../types'
import styles from './index.less'

const PRESET_ICONS = presets.board.icons
const PRESET_COLORS = presets.board.colors

interface Props {
	open: boolean
	onClose: () => void
}

const CreateBoardModal = ({ open, onClose }: Props) => {
	const { is_cn, createBoard, createBoardFromTemplate, getBoardTemplates } = useKanbanContext()

	const [name, setName] = useState('')
	const [icon, setIcon] = useState(PRESET_ICONS[0])
	const [color, setColor] = useState(PRESET_COLORS[0])
	const [templates, setTemplates] = useState<BoardTemplate[]>([])
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
	const [creating, setCreating] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!open) return
		setName('')
		setIcon(PRESET_ICONS[0])
		setColor(PRESET_COLORS[0])
		setSelectedTemplate(null)
		setCreating(false)
		getBoardTemplates().then(setTemplates)
		setTimeout(() => inputRef.current?.focus(), 100)
	}, [open, getBoardTemplates])

	useEffect(() => {
		if (!open) return
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handleEsc)
		return () => document.removeEventListener('keydown', handleEsc)
	}, [open, onClose])

	const handleCreate = useCallback(async () => {
		if (!name.trim() || creating) return
		setCreating(true)
		try {
			if (selectedTemplate) {
				await createBoardFromTemplate(selectedTemplate, name.trim())
			} else {
				await createBoard({ title: name.trim(), icon, color })
			}
			onClose()
		} catch (err: any) {
			const msg = err?.message || (is_cn ? '创建失败' : 'Failed to create board')
			window.$app?.Event?.emit('app/toast', { type: 'error', message: msg })
		} finally {
			setCreating(false)
		}
	}, [name, icon, color, selectedTemplate, creating, createBoard, createBoardFromTemplate, onClose, is_cn])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && name.trim()) handleCreate()
		},
		[handleCreate, name]
	)

	if (!open) return null

	const canCreate = name.trim().length > 0

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.header}>
					<span className={styles.headerTitle}>
						{is_cn ? '创建看板' : 'Create Board'}
					</span>
					<span className={styles.headerClose} onClick={onClose}>
						<Icon name='material-close' size={18} />
					</span>
				</div>

				<div className={styles.body}>
					<input
						ref={inputRef}
						className={styles.nameInput}
						placeholder={is_cn ? '看板名称' : 'Board name'}
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={handleKeyDown}
					/>

					<div className={styles.section}>
						<span className={styles.label}>{is_cn ? '图标' : 'Icon'}</span>
						<div className={styles.grid}>
							{PRESET_ICONS.map((ic) => (
								<span
									key={ic}
									className={`${styles.iconItem} ${icon === ic ? styles.selected : ''}`}
									onClick={() => setIcon(ic)}
								>
									<Icon name={ic} size={18} />
								</span>
							))}
						</div>
					</div>

					<div className={styles.section}>
						<span className={styles.label}>{is_cn ? '颜色' : 'Color'}</span>
						<div className={styles.grid}>
							{PRESET_COLORS.map((c) => (
								<span
									key={c}
									className={`${styles.colorItem} ${color === c ? styles.selected : ''}`}
									style={{ background: c }}
									onClick={() => setColor(c)}
								/>
							))}
						</div>
					</div>

					{templates.length > 0 && (
						<>
							<div className={styles.divider} />
							<div className={styles.section}>
								<span className={styles.label}>
									{is_cn ? '选择模板（可选）' : 'Choose Template (optional)'}
								</span>
								<div className={styles.templateGrid}>
									{templates.map((tpl) => {
										const isSelected = selectedTemplate === tpl.id
										return (
											<div
												key={tpl.id}
												className={`${styles.templateCard} ${isSelected ? styles.templateSelected : ''}`}
												onClick={() => setSelectedTemplate(isSelected ? null : tpl.id)}
											>
												{isSelected && (
													<span className={styles.templateCheck}>
														<Icon name='material-check_circle' size={16} />
													</span>
												)}
												<div className={styles.templateHeader}>
													<span className={styles.templateIcon} style={{ color: tpl.color }}>
														<Icon name={tpl.icon} size={20} />
													</span>
													<span className={styles.templateTitle}>{tpl.title}</span>
												</div>
												<p className={styles.templateDesc}>{tpl.description}</p>
												<div className={styles.templateColumns}>
													{tpl.preview_columns.map((col) => (
														<span key={col} className={styles.templateTag}>{col}</span>
													))}
												</div>
											</div>
										)
									})}
								</div>
							</div>
						</>
					)}
				</div>

				<div className={styles.footer}>
					<button className={styles.cancelBtn} onClick={onClose}>
						{is_cn ? '取消' : 'Cancel'}
					</button>
					<button
						className={styles.createBtn}
						disabled={!canCreate || creating}
						onClick={handleCreate}
					>
						{creating ? (is_cn ? '创建中...' : 'Creating...') : (is_cn ? '创建' : 'Create')}
					</button>
				</div>
			</div>
		</div>
	)
}

export default CreateBoardModal
