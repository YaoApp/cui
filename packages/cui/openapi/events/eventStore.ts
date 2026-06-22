import { getEventStream } from './useEventStream'
import type { EventHandler } from './useEventStream'

type StoreAction = (data: Record<string, any>) => void

interface EventStoreOptions {
	boardStore?: {
		addTask: StoreAction
		patchTask: (chatId: string, patch: Record<string, any>) => void
		moveTask: (chatId: string, columnId: string, position: number) => void
		removeTask: (chatId: string) => void
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
	// Task events (9)
	'task.created': (data, { boardStore }) => boardStore?.addTask(data),
	'task.status_change': (data, { boardStore }) =>
		boardStore?.patchTask(data.chat_id, {
			run_status: data.run_status,
			progress: data.progress,
			current_step: data.current_step
		}),
	'task.title_updated': (data, { boardStore }) => boardStore?.patchTask(data.chat_id, { title: data.title }),
	'task.moved': (data, { boardStore }) => boardStore?.moveTask(data.chat_id, data.column_id, data.position),
	'task.deleted': (data, { boardStore }) => boardStore?.removeTask(data.chat_id),
	'task.completed': (data, { boardStore }) =>
		boardStore?.patchTask(data.chat_id, { run_status: 'completed', duration: data.duration }),
	'task.failed': (data, { boardStore }) =>
		boardStore?.patchTask(data.chat_id, { run_status: 'failed', error_message: data.error_message }),
	'task.progress': (data, { boardStore }) =>
		boardStore?.patchTask(data.chat_id, { progress: data.progress, current_step: data.current_step }),
	'task.queue_position': (data, { boardStore }) =>
		boardStore?.patchTask(data.chat_id, { queue_position: data.position }),

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
