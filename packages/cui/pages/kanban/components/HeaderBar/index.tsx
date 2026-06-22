import { useState, useRef, useEffect, useCallback } from 'react'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { useKanbanContext } from '../../context'
import presets from '../../presets.json'
import type { StatusFilter, BoardSummary, BoardTemplate } from '../../types'
import styles from './index.less'

interface HeaderBarProps {
	onCreateTask: () => void
}

const FILTERS: { key: StatusFilter; cn: string; en: string }[] = [
	{ key: 'all', cn: '全部', en: 'All' },
	{ key: 'running', cn: '运行中', en: 'Running' },
	{ key: 'waiting', cn: '等待中', en: 'Waiting' },
	{ key: 'completed', cn: '已完成', en: 'Completed' },
	{ key: 'failed', cn: '失败', en: 'Failed' }
]

const PRESET_ICONS = presets.board.icons
const PRESET_COLORS = presets.board.colors

const HeaderBar = ({ onCreateTask }: HeaderBarProps) => {
	const {
		board, boards, currentBoardId, is_cn,
		searchKeyword, setSearchKeyword, statusFilter, setStatusFilter,
		switchBoard, createBoard, updateBoard, deleteBoard,
		createBoardFromTemplate, getBoardTemplates
	} = useKanbanContext()

	const [dropdownOpen, setDropdownOpen] = useState(false)
	const [view, setView] = useState<'list' | 'create'>('list')
	const dropdownRef = useRef<HTMLDivElement>(null)
	const triggerRef = useRef<HTMLDivElement>(null)

	// List view state — edit form
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editName, setEditName] = useState('')
	const [editIcon, setEditIcon] = useState('')
	const [editColor, setEditColor] = useState('')
	const editInputRef = useRef<HTMLInputElement>(null)
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<string | null>(null)

	// Create view state
	const [newName, setNewName] = useState('')
	const [newIcon, setNewIcon] = useState(PRESET_ICONS[0])
	const [newColor, setNewColor] = useState(PRESET_COLORS[0])
	const [templates, setTemplates] = useState<BoardTemplate[]>([])
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
	const [creating, setCreating] = useState(false)

	useEffect(() => {
		if (!dropdownOpen) return
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
				triggerRef.current && !triggerRef.current.contains(e.target as Node)
			) {
				closeDropdown()
			}
		}
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closeDropdown()
		}
		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEsc)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEsc)
		}
	}, [dropdownOpen])

	useEffect(() => {
		if (editingId && editInputRef.current) {
			editInputRef.current.focus()
			editInputRef.current.select()
		}
	}, [editingId])

	const closeDropdown = useCallback(() => {
		setDropdownOpen(false)
		setView('list')
		setEditingId(null)
		setConfirmDeleteId(null)
		resetCreateForm()
	}, [])

	const resetCreateForm = () => {
		setNewName('')
		setNewIcon(PRESET_ICONS[0])
		setNewColor(PRESET_COLORS[0])
		setSelectedTemplate(null)
	}

	const handleToggleDropdown = () => {
		if (dropdownOpen) {
			closeDropdown()
		} else {
			setDropdownOpen(true)
			setView('list')
		}
	}

	const handleSwitchBoard = (boardId: string) => {
		switchBoard(boardId)
		closeDropdown()
	}

	const handleStartEdit = (b: BoardSummary) => {
		setEditingId(b.id)
		setEditName(b.title)
		setEditIcon(b.icon || PRESET_ICONS[0])
		setEditColor(b.color || PRESET_COLORS[0])
		setConfirmDeleteId(null)
	}

	const handleSaveEdit = async () => {
		if (!editingId || !editName.trim()) return
		try {
			await updateBoard(editingId, { title: editName.trim(), icon: editIcon, color: editColor } as any)
			setEditingId(null)
		} catch (err: any) {
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '保存失败' : 'Failed to save') })
		}
	}

	const handleCancelEdit = () => {
		setEditingId(null)
	}

	const handleDeleteBoard = async (boardId: string) => {
		const b = boards.find((bd) => bd.id === boardId)
		if (!b) return

		if (confirmDeleteId !== boardId) {
			setConfirmDeleteId(boardId)
			return
		}

		setDeletingId(boardId)
		setConfirmDeleteId(null)

		await new Promise((r) => setTimeout(r, 200))

		try {
			await deleteBoard(boardId)
			setDeletingId(null)
			if (boards.length <= 1) closeDropdown()
		} catch (err: any) {
			setDeletingId(null)
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '删除失败' : 'Failed to delete') })
		}
	}

	const handleShowCreate = async () => {
		setView('create')
		resetCreateForm()
		try {
			const tpls = await getBoardTemplates()
			setTemplates(tpls)
		} catch (err: any) {
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '加载模板失败' : 'Failed to load templates') })
		}
	}

	const handleCreate = async () => {
		if (!newName.trim() || creating) return
		setCreating(true)
		try {
			if (selectedTemplate) {
				await createBoardFromTemplate(selectedTemplate, newName.trim())
			} else {
				await createBoard({ title: newName.trim(), icon: newIcon, color: newColor })
			}
			closeDropdown()
		} catch (err: any) {
			window.$app?.Event?.emit('app/toast', { type: 'error', message: err?.message || (is_cn ? '创建失败' : 'Failed to create') })
		} finally {
			setCreating(false)
		}
	}

	const canCreate = newName.trim().length > 0

	const [searchOpen, setSearchOpen] = useState(false)
	const searchInputRef = useRef<HTMLInputElement>(null)
	const searchBoxRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (searchOpen && searchInputRef.current) {
			searchInputRef.current.focus()
		}
	}, [searchOpen])

	useEffect(() => {
		if (!searchOpen) setSearchKeyword('')
	}, [searchOpen])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault()
				setSearchOpen((v) => !v)
			}
			if (e.key === 'Escape' && searchOpen) {
				setSearchOpen(false)
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [searchOpen])

	useEffect(() => {
		if (!searchOpen) return
		const handleClickOutside = (e: MouseEvent) => {
			if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
				setSearchOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [searchOpen])

	return (
		<div className={styles.header}>
			<div className={styles.titleSection} ref={triggerRef} onClick={handleToggleDropdown}>
				{board?.icon && (
					<span className={styles.titleIcon} style={board.color ? { color: board.color } : undefined}>
						<Icon name={board.icon} size={20} />
					</span>
				)}
				{!board?.icon && (
					<span className={styles.titleIcon}>
						<Icon name='material-view_kanban' size={20} />
					</span>
				)}
				<span className={styles.title}>{board?.title || (is_cn ? '任务看板' : 'Task Board')}</span>
				<span className={styles.titleArrow}>
					<Icon name={dropdownOpen ? 'material-expand_less' : 'material-expand_more'} size={18} />
				</span>
			</div>

			{dropdownOpen && (
				<div className={styles.dropdown} ref={dropdownRef}>
					{view === 'list' && (
						<div className={styles.boardList}>
							<div className={styles.boardListItems}>
								{boards.map((b) => (
									<div
										key={b.id}
										className={`${styles.boardItem} ${b.id === currentBoardId ? styles.boardItemActive : ''} ${deletingId === b.id ? styles.deleting : ''}`}
									>
										{editingId === b.id ? (
											<div className={styles.editForm}>
												<input
													ref={editInputRef}
													className={styles.editFormInput}
													value={editName}
													onChange={(e) => setEditName(e.target.value)}
													placeholder={is_cn ? '看板名称' : 'Board name'}
												/>
												<div className={styles.editFormSection}>
													<span className={styles.editFormLabel}>{is_cn ? '图标' : 'Icon'}</span>
													<div className={styles.editFormGrid}>
														{PRESET_ICONS.map((icon) => (
															<span
																key={icon}
																className={`${styles.editFormIconItem} ${editIcon === icon ? styles.selected : ''}`}
																onClick={() => setEditIcon(icon)}
															>
																<Icon name={icon} size={16} />
															</span>
														))}
													</div>
												</div>
												<div className={styles.editFormSection}>
													<span className={styles.editFormLabel}>{is_cn ? '颜色' : 'Color'}</span>
													<div className={styles.editFormGrid}>
														{PRESET_COLORS.map((color) => (
															<span
																key={color}
																className={`${styles.editFormColorItem} ${editColor === color ? styles.selected : ''}`}
																style={{ background: color }}
																onClick={() => setEditColor(color)}
															/>
														))}
													</div>
												</div>
												<div className={styles.editFormActions}>
													<span className={styles.editFormCancel} onClick={handleCancelEdit}>
														{is_cn ? '取消' : 'Cancel'}
													</span>
												<span
													className={`${styles.editFormConfirm}${!editName.trim() ? ` ${styles.disabled}` : ''}`}
													onClick={handleSaveEdit}
												>
													{is_cn ? '保存' : 'Save'}
												</span>
												</div>
											</div>
										) : confirmDeleteId === b.id ? (
											<div className={styles.confirmDelete}>
												<div className={styles.confirmText}>
													{is_cn
														? b.task_count > 0
															? `确定删除「${b.title}」？该看板包含 ${b.task_count} 个任务，删除后不可恢复。`
															: `确定删除「${b.title}」？删除后不可恢复。`
														: b.task_count > 0
															? `Delete "${b.title}"? This board has ${b.task_count} tasks. Deletion is irreversible.`
															: `Delete "${b.title}"? Deletion is irreversible.`}
												</div>
												<div className={styles.confirmActions}>
													<span className={styles.confirmCancel} onClick={() => setConfirmDeleteId(null)}>
														{is_cn ? '取消' : 'Cancel'}
													</span>
													<span className={styles.confirmOk} onClick={() => handleDeleteBoard(b.id)}>
														{is_cn ? '确定删除' : 'Delete'}
													</span>
												</div>
											</div>
										) : (
											<>
												<div
													className={styles.boardItemInfo}
													onClick={() => handleSwitchBoard(b.id)}
												>
													<span className={styles.boardItemIcon} style={b.color ? { color: b.color } : undefined}>
														<Icon name={b.icon || 'material-view_kanban'} size={16} />
													</span>
													<span className={styles.boardItemTitle}>{b.title}</span>
													{b.id === currentBoardId && (
														<span className={styles.boardItemCurrent}>
															{is_cn ? '当前' : 'Current'}
														</span>
													)}
												</div>
												<div className={styles.boardItemActions}>
													<span
														className={styles.boardItemAction}
														onClick={(e) => { e.stopPropagation(); handleStartEdit(b) }}
														title={is_cn ? '编辑' : 'Edit'}
													>
														<Icon name='material-edit' size={14} />
													</span>
													<span
														className={`${styles.boardItemAction} ${boards.length <= 1 ? styles.disabled : ''}`}
														onClick={(e) => {
															e.stopPropagation()
															if (boards.length > 1) handleDeleteBoard(b.id)
														}}
														title={boards.length <= 1
															? (is_cn ? '至少保留一个看板' : 'Must keep at least one board')
															: (is_cn ? '删除' : 'Delete')
														}
													>
														<Icon name='material-delete_outline' size={14} />
													</span>
												</div>
											</>
										)}
									</div>
								))}
							</div>
							<div className={styles.boardListFooter} onClick={handleShowCreate}>
								<Icon name='material-add' size={16} />
								<span>{is_cn ? '新看板' : 'New Board'}</span>
							</div>
						</div>
					)}

					{view === 'create' && (
						<div className={styles.createPanel}>
							<div className={styles.createHeader}>
								<span className={styles.createBack} onClick={() => setView('list')}>
									<Icon name='material-arrow_back' size={16} />
								</span>
								<span className={styles.createTitle}>
									{is_cn ? '创建看板' : 'Create Board'}
								</span>
								<span className={styles.createHeaderSpacer} />
								<button
									className={styles.createHeaderBtn}
									disabled={!canCreate || creating}
									onClick={handleCreate}
								>
									{is_cn ? '创建' : 'Create'}
								</button>
							</div>

							<div className={styles.createForm}>
								<input
									className={styles.createNameInput}
									placeholder={is_cn ? '看板名称' : 'Board name'}
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									autoFocus
								/>

								<div className={styles.createSection}>
									<span className={styles.createLabel}>{is_cn ? '图标' : 'Icon'}</span>
									<div className={styles.createGrid}>
										{PRESET_ICONS.map((icon) => (
											<span
												key={icon}
												className={`${styles.createIconItem} ${newIcon === icon ? styles.selected : ''}`}
												onClick={() => setNewIcon(icon)}
											>
												<Icon name={icon} size={18} />
											</span>
										))}
									</div>
								</div>

								<div className={styles.createSection}>
									<span className={styles.createLabel}>{is_cn ? '颜色' : 'Color'}</span>
									<div className={styles.createGrid}>
										{PRESET_COLORS.map((color) => (
											<span
												key={color}
												className={`${styles.createColorItem} ${newColor === color ? styles.selected : ''}`}
												style={{ background: color }}
												onClick={() => setNewColor(color)}
											/>
										))}
									</div>
								</div>
							</div>

							{templates.length > 0 && (
								<>
									<div className={styles.createDivider} />
									<div className={styles.createSection}>
										<span className={styles.createLabel}>
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
					)}
				</div>
			)}

			<div className={styles.filters}>
				{FILTERS.map((f) => (
					<span
						key={f.key}
						className={`${styles.filterBtn} ${statusFilter === f.key ? styles.active : ''}`}
						onClick={() => setStatusFilter(f.key)}
					>
						{is_cn ? f.cn : f.en}
					</span>
				))}
			</div>

			<span className={styles.spacer} />

			{searchOpen && (
				<div className={styles.searchOverlay} ref={searchBoxRef}>
					<div className={styles.searchBox}>
						<span className={styles.searchIcon}>
							<Icon name='material-search' size={16} />
						</span>
						<input
							ref={searchInputRef}
							type='text'
							placeholder={is_cn ? '搜索任务...' : 'Search tasks...'}
							value={searchKeyword}
							onChange={(e) => setSearchKeyword(e.target.value)}
							onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false) }}
						/>
						<span className={styles.searchHint}>ESC</span>
					</div>
				</div>
			)}

			<Button
				type='primary'
				size='small'
				icon={<Icon name='material-add' size={14} />}
				onClick={onCreateTask}
			>
				{is_cn ? '新任务' : 'New Task'}
			</Button>
		</div>
	)
}

export default window.$app.memo(HeaderBar)
