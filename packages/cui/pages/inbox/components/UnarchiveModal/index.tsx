import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Icon from '@/widgets/Icon'
import { Select } from '@/components/ui/inputs'
import { getBoards, getBoard } from '@/pages/kanban/services/api'
import type { BoardSummary, Board } from '@/pages/kanban/types'
import type { PropertySchema } from '@/components/ui/inputs/types'
import styles from './index.less'

interface UnarchiveModalProps {
	open: boolean
	chatId: string
	is_cn: boolean
	onConfirm: (chatId: string, columnId: string) => void
	onClose: () => void
}

const UnarchiveModal = ({ open, chatId, is_cn, onConfirm, onClose }: UnarchiveModalProps) => {
	const [boards, setBoards] = useState<BoardSummary[]>([])
	const [selectedBoardId, setSelectedBoardId] = useState<string>('')
	const [boardDetail, setBoardDetail] = useState<Board | null>(null)
	const [selectedColumnId, setSelectedColumnId] = useState<string>('')
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!open) return
		setLoading(true)
		getBoards().then((list) => {
			setBoards(list)
			if (list.length > 0) {
				setSelectedBoardId(list[0].id)
			}
			setLoading(false)
		}).catch(() => setLoading(false))
	}, [open])

	useEffect(() => {
		if (!open || !selectedBoardId) {
			setBoardDetail(null)
			return
		}
		getBoard(selectedBoardId).then((detail) => {
			setBoardDetail(detail)
			if (detail.columns.length > 0) {
				const sorted = [...detail.columns].sort((a, b) => a.position - b.position)
				setSelectedColumnId(sorted[0].id)
			} else {
				setSelectedColumnId('')
			}
		}).catch(() => setBoardDetail(null))
	}, [open, selectedBoardId])

	const boardSchema: PropertySchema = useMemo(() => ({
		type: 'string',
		placeholder: is_cn ? '选择看板' : 'Select Board',
		enum: boards.map((b) => ({ label: b.title, value: b.id }))
	}), [boards, is_cn])

	const columnSchema: PropertySchema = useMemo(() => {
		const cols = boardDetail
			? [...boardDetail.columns].sort((a, b) => a.position - b.position)
			: []
		return {
			type: 'string',
			placeholder: is_cn ? '选择列' : 'Select Column',
			enum: cols.map((c) => ({ label: c.title, value: c.id }))
		}
	}, [boardDetail, is_cn])

	const handleConfirm = useCallback(() => {
		if (!selectedColumnId) return
		onConfirm(chatId, selectedColumnId)
	}, [chatId, selectedColumnId, onConfirm])

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
						<Icon name='material-unarchive' size={18} />
						{is_cn ? '取消归档' : 'Unarchive Task'}
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
							<div className={styles.field}>
								<label>{is_cn ? '选择看板' : 'Select Board'}</label>
								<Select
									value={selectedBoardId}
									onChange={(val) => setSelectedBoardId(val as string)}
									schema={boardSchema}
									size='medium'
								/>
							</div>

							<div className={styles.field}>
								<label>{is_cn ? '选择列' : 'Select Column'}</label>
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
						</>
					)}
				</div>

				<div className={styles.footer}>
					<button className={styles.cancelBtn} onClick={onClose}>
						{is_cn ? '取消' : 'Cancel'}
					</button>
					<button
						className={styles.confirmBtn}
						disabled={!selectedColumnId}
						onClick={handleConfirm}
					>
						{is_cn ? '确认恢复' : 'Confirm'}
					</button>
				</div>
			</div>
		</div>
	)

	return createPortal(modalContent, document.body)
}

export default window.$app.memo(UnarchiveModal)
