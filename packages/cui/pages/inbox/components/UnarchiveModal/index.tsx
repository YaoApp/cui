import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/widgets/Icon'
import { Select } from '@/components/ui/inputs'
import { getBoard } from '@/pages/kanban/services/api'
import { ensureBoard } from '@/utils/ensureBoard'
import { ensureWorkspace } from '@/utils/ensureWorkspace'
import { useWorkspace } from '@/hooks/useComputerWorkspace'
import type { BoardSummary, Board } from '@/pages/kanban/types'
import type { PropertySchema } from '@/components/ui/inputs/types'
import styles from './index.less'

const LAST_WORKSPACE_KEY = 'last_used_workspace'
const CHATBOX_WORKSPACE_KEY = 'yao:selectedWorkspace'

interface UnarchiveModalProps {
	open: boolean
	chatId: string
	is_cn: boolean
	onConfirm: (chatId: string, columnId: string, boardId: string, workspaceId?: string) => void
	onClose: () => void
	title?: string
	icon?: string
	confirmText?: string
	excludeColumnId?: string
	showWorkspace?: boolean
}

const UnarchiveModal = ({ open, chatId, is_cn, onConfirm, onClose, title, icon, confirmText, excludeColumnId, showWorkspace }: UnarchiveModalProps) => {
	const [boards, setBoards] = useState<BoardSummary[]>([])
	const [selectedBoardId, setSelectedBoardId] = useState<string>('')
	const [boardDetail, setBoardDetail] = useState<Board | null>(null)
	const [selectedColumnId, setSelectedColumnId] = useState<string>('')
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')
	const [loading, setLoading] = useState(true)

	const { workspaces, loading: loadingWorkspaces, fetchWorkspaces, workspaceOptionsGrouped } = useWorkspace()

	useEffect(() => {
		if (!open) return
		setLoading(true)

		const loadData = async () => {
			try {
				const list = await ensureBoard(is_cn)
				setBoards(list)

				const lastBoardId = localStorage.getItem('kanban_last_board') || ''
				const targetBoardId = list.find((b) => b.id === lastBoardId)
					? lastBoardId
					: list.length > 0 ? list[0].id : ''
				setSelectedBoardId(targetBoardId)

				if (showWorkspace) {
					await ensureWorkspace(is_cn)
					fetchWorkspaces()
				}
			} catch { /* silent */ }
			setLoading(false)
		}
		loadData()
	}, [open, showWorkspace, fetchWorkspaces])

	useEffect(() => {
		if (!showWorkspace || workspaces.length === 0) return
		const chatboxWsId = localStorage.getItem(CHATBOX_WORKSPACE_KEY) || ''
		const lastWsId = localStorage.getItem(LAST_WORKSPACE_KEY) || ''
		const candidateId = chatboxWsId || lastWsId
		const targetWsId = workspaces.find((w) => w.id === candidateId)
			? candidateId
			: workspaces[0].id
		setSelectedWorkspaceId(targetWsId)
	}, [workspaces, showWorkspace])

	useEffect(() => {
		if (!open || !selectedBoardId) {
			setBoardDetail(null)
			return
		}
		getBoard(selectedBoardId).then((detail) => {
			setBoardDetail(detail)
			if (detail.columns.length > 0) {
				const sorted = [...detail.columns].sort((a, b) => a.position - b.position)
				setSelectedColumnId(sorted[sorted.length - 1].id)
			} else {
				setSelectedColumnId('')
			}
		}).catch(() => setBoardDetail(null))
	}, [open, selectedBoardId])

	const boardSchema: PropertySchema = useMemo(() => ({
		type: 'string',
		placeholder: is_cn ? '选择看板' : 'Select Board',
		enum: boards.map((b) => ({
			label: b.title,
			value: b.id,
			icon: b.icon || 'material-dashboard'
		}))
	}), [boards, is_cn])

	const columnSchema: PropertySchema = useMemo(() => {
		const cols = boardDetail
			? [...boardDetail.columns]
				.sort((a, b) => a.position - b.position)
				.filter((c) => !excludeColumnId || c.id !== excludeColumnId)
			: []
		return {
			type: 'string',
			placeholder: is_cn ? '选择列' : 'Select Column',
			enum: cols.map((c) => ({
				label: c.title,
				value: c.id,
				icon: c.icon || 'material-view_column'
			}))
		}
	}, [boardDetail, is_cn, excludeColumnId])

	const workspaceSchema: PropertySchema = useMemo(() => ({
		type: 'string',
		placeholder: is_cn ? '选择工作空间' : 'Select Workspace',
		searchable: workspaceOptionsGrouped.length >= 3,
		enum: workspaceOptionsGrouped
	}), [workspaceOptionsGrouped, is_cn])

	const isConfirmDisabled = !selectedColumnId || (showWorkspace && !selectedWorkspaceId)

	const handleConfirm = useCallback(() => {
		if (isConfirmDisabled) return
		if (showWorkspace && selectedWorkspaceId) {
			try { localStorage.setItem(LAST_WORKSPACE_KEY, selectedWorkspaceId) } catch {}
		}
		onConfirm(chatId, selectedColumnId, selectedBoardId, showWorkspace ? selectedWorkspaceId : undefined)
	}, [chatId, selectedColumnId, selectedBoardId, selectedWorkspaceId, showWorkspace, isConfirmDisabled, onConfirm])

	useEffect(() => {
		if (!open) return
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handleEsc)
		return () => document.removeEventListener('keydown', handleEsc)
	}, [open, onClose])

	if (!open) return null

	const modalContent = (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.header}>
					<span className={styles.headerTitle}>
						<Icon name={icon || 'material-unarchive'} size={18} />
						{title || (is_cn ? '取消归档' : 'Unarchive Task')}
					</span>
					<span className={styles.closeBtn} onClick={onClose}>
						<Icon name='material-close' size={16} />
					</span>
				</div>

				<div className={styles.body}>
					{loading ? (
						<div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
					) : boards.length === 0 ? (
						<div className={styles.empty}>{is_cn ? '暂无看板' : 'No boards available'}</div>
					) : (
						<>
							{showWorkspace && (
								<div className={styles.field}>
								<label>{is_cn ? '工作空间' : 'Workspace'}</label>
									<div className={styles.fieldInput}>
										{loadingWorkspaces ? (
											<div className={styles.loading}>{is_cn ? '加载中...' : 'Loading...'}</div>
										) : workspaceOptionsGrouped.length === 0 ? (
											<div className={styles.empty}>{is_cn ? '暂无工作空间' : 'No workspaces'}</div>
										) : (
											<Select
												value={selectedWorkspaceId}
												onChange={(val) => setSelectedWorkspaceId(val as string)}
												schema={workspaceSchema}
												size='medium'
											/>
										)}
									</div>
								</div>
							)}

							<div className={styles.field}>
							<label>{is_cn ? '看板' : 'Board'}</label>
								<div className={styles.fieldInput}>
									<Select
										value={selectedBoardId}
										onChange={(val) => setSelectedBoardId(val as string)}
										schema={boardSchema}
										size='medium'
									/>
								</div>
							</div>

							<div className={styles.field}>
							<label>{is_cn ? '列' : 'Column'}</label>
								<div className={styles.fieldInput}>
									{columnSchema.enum && columnSchema.enum.length === 0 ? (
										<div className={styles.empty}>{is_cn ? '该看板暂无列' : 'No columns'}</div>
									) : (
										<Select
											value={selectedColumnId}
											onChange={(val) => setSelectedColumnId(val as string)}
											schema={columnSchema}
											size='medium'
										/>
									)}
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
						className={styles.confirmBtn}
						disabled={isConfirmDisabled}
						onClick={handleConfirm}
					>
						{confirmText || (is_cn ? '确认恢复' : 'Confirm')}
					</button>
				</div>
			</div>
		</div>
	)

	return createPortal(modalContent, document.body)
}

export default window.$app.memo(UnarchiveModal)
