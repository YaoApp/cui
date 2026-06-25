import { getEventStream } from './useEventStream'
import type { EventHandler } from './useEventStream'

type StoreAction = (data: Record<string, any>) => void

interface EventStoreOptions {
	boardStore?: {
		addTask: StoreAction
		patchTask: (chatId: string, patch: Record<string, any>) => void
		moveTask: (chatId: string, columnId: string, position: number) => void
		removeTask: (chatId: string) => void
		refreshQuota?: () => void
		addBoard: StoreAction
		patchBoard: (boardId: string, patch: Record<string, any>) => void
		removeBoard: (boardId: string) => void
		addColumn: (boardId: string, data: Record<string, any>) => void
		patchColumn: (boardId: string, columnId: string, patch: Record<string, any>) => void
		removeColumn: (boardId: string, columnId: string) => void
	}
	inboxStore?: {
		incrementUnread: () => void
		prependMail: StoreAction
	}
}

const EVENT_HANDLERS: Record<string, (data: Record<string, any>, stores: EventStoreOptions) => void> = {
	// Task events — unified via task.updated (enrichTaskResult pushes all fields at once)
	'task.created': (data, { boardStore }) => boardStore?.addTask(data),
	'task.updated': (data, { boardStore }) => {
		const patch: Record<string, any> = {}
		if (data.title) patch.title = data.title
		if (data.run_status) patch.run_status = data.run_status
		if (data.summary) patch.summary = data.summary
		if (data.instruction) patch.instruction = data.instruction
		if (data.outputs) patch.outputs = data.outputs
		if (data.tags) patch.tags = data.tags
		if (data.priority) patch.priority = data.priority
		if (data.progress !== undefined) patch.progress = data.progress
		if (data.current_step) patch.current_step = data.current_step
		if (data.error_message) patch.error_message = data.error_message
		if (data.duration !== undefined) patch.duration = data.duration
		if (Object.keys(patch).length > 0) {
			boardStore?.patchTask(data.chat_id, patch)
		}
	},
	'task.moved': (data, { boardStore }) => boardStore?.moveTask(data.chat_id, data.column_id, data.position),
	'task.deleted': (data, { boardStore }) => boardStore?.removeTask(data.chat_id),
	'task.archived': (data, { boardStore }) => {
		boardStore?.removeTask(data.chat_id)
		boardStore?.refreshQuota?.()
	},
	'task.unarchived': (data, { boardStore }) => {
		boardStore?.addTask(data)
		boardStore?.refreshQuota?.()
	},

	// Board events (6)
	'board.created': (data, { boardStore }) => boardStore?.addBoard(data),
	'board.updated': (data, { boardStore }) => boardStore?.patchBoard(data.board_id, data),
	'board.deleted': (data, { boardStore }) => boardStore?.removeBoard(data.board_id),
	'board.column_added': (data, { boardStore }) => boardStore?.addColumn(data.board_id, data),
	'board.column_updated': (data, { boardStore }) =>
		boardStore?.patchColumn(data.board_id, data.column_id, data),
	'board.column_deleted': (data, { boardStore }) => boardStore?.removeColumn(data.board_id, data.column_id),

	// Inbox events (1)
	'mail.new': (data, { inboxStore }) => {
		inboxStore?.incrementUnread()
		inboxStore?.prependMail(data)
	}
}

let unsubscribers: Array<() => void> = []

export function initEventStore(stores: EventStoreOptions) {
	disposeEventStore()
	const stream = getEventStream()

	for (const [eventType, handler] of Object.entries(EVENT_HANDLERS)) {
		const wrappedHandler: EventHandler = (data) => handler(data, stores)
		const unsub = stream.subscribe(eventType, wrappedHandler)
		unsubscribers.push(unsub)
	}
}

export function disposeEventStore() {
	unsubscribers.forEach((unsub) => unsub())
	unsubscribers = []
}

export { EVENT_HANDLERS }
