import { getBoards, createBoard, createColumn } from '@/pages/kanban/services/api'
import type { BoardSummary } from '@/pages/kanban/types'

const DEFAULT_COLUMNS = {
	zh: [
		{ title: '研发', icon: 'material-rocket_launch', color: '#6366F1' },
		{ title: '调研', icon: 'material-search', color: '#22C55E' },
		{ title: '日常', icon: 'material-edit_note', color: '#F59E0B' }
	],
	en: [
		{ title: 'Dev', icon: 'material-rocket_launch', color: '#6366F1' },
		{ title: 'Research', icon: 'material-search', color: '#22C55E' },
		{ title: 'General', icon: 'material-edit_note', color: '#F59E0B' }
	]
}

/**
 * Ensure at least one board with columns exists.
 * If none, auto-create a default board (skip backend's default "To Do" column)
 * and add 3 custom columns.
 *
 * @returns the board list (existing or newly created).
 */
export async function ensureBoard(is_cn: boolean): Promise<BoardSummary[]> {
	const list = await getBoards()
	if (list.length > 0) return list

	const board = await createBoard({
		title: is_cn ? '我的看板' : 'My Board',
		icon: 'material-work',
		color: '#3B82F6',
		skipDefaultColumn: true
	})

	const cols = is_cn ? DEFAULT_COLUMNS.zh : DEFAULT_COLUMNS.en
	for (const col of cols) {
		await createColumn(board.id, col)
	}

	localStorage.setItem('kanban_last_board', board.id)
	return getBoards()
}
