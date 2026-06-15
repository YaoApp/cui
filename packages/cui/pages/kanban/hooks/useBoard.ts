import { useCallback } from 'react'
import { useKanbanContext } from '../context'

export function useBoard() {
	const {
		board,
		addColumn,
		updateColumn,
		removeColumn,
		reorderColumns,
		is_cn
	} = useKanbanContext()

	const handleAddColumn = useCallback(async () => {
		await addColumn({
			title: is_cn ? '新分组' : 'New Group',
			icon: 'material-view_column'
		})
	}, [addColumn, is_cn])

	const handleRenameColumn = useCallback(
		async (columnId: string, title: string) => {
			await updateColumn(columnId, { title })
		},
		[updateColumn]
	)

	const handleDeleteColumn = useCallback(
		async (columnId: string) => {
			await removeColumn(columnId)
		},
		[removeColumn]
	)

	const handleCollapseColumn = useCallback(
		async (columnId: string, collapsed: boolean) => {
			await updateColumn(columnId, { collapsed })
		},
		[updateColumn]
	)

	return {
		board,
		handleAddColumn,
		handleRenameColumn,
		handleDeleteColumn,
		handleCollapseColumn,
		reorderColumns
	}
}
