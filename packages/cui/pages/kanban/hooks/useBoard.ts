import { useCallback } from 'react'
import { useKanbanContext } from '../context'

const emitError = (msg: string) => {
	window.$app?.Event?.emit('app/toast', { type: 'error', message: msg })
}

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
		try {
			await addColumn({
				title: is_cn ? '新分组' : 'New Group',
				icon: 'material-view_column'
			})
		} catch (err: any) {
			emitError(err?.message || (is_cn ? '添加分组失败' : 'Failed to add column'))
		}
	}, [addColumn, is_cn])

	const handleRenameColumn = useCallback(
		async (columnId: string, title: string) => {
			try {
				await updateColumn(columnId, { title })
			} catch (err: any) {
				emitError(err?.message || (is_cn ? '重命名失败' : 'Failed to rename'))
			}
		},
		[updateColumn, is_cn]
	)

	const handleDeleteColumn = useCallback(
		async (columnId: string) => {
			try {
				await removeColumn(columnId)
			} catch (err: any) {
				emitError(err?.message || (is_cn ? '删除分组失败' : 'Failed to delete column'))
			}
		},
		[removeColumn, is_cn]
	)

	const handleCollapseColumn = useCallback(
		async (columnId: string, collapsed: boolean) => {
			try {
				await updateColumn(columnId, { collapsed })
			} catch (err: any) {
				emitError(err?.message || (is_cn ? '操作失败' : 'Operation failed'))
			}
		},
		[updateColumn, is_cn]
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
