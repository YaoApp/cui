import type { Message } from '@/openapi'
import type { Board, BoardSummary, BoardTemplate, Column, KanbanTask, CreateTaskData } from '../types'

// Real API implementation placeholder
// Switch services/index.ts to export from './api' when backend is ready

export async function getBoards(): Promise<BoardSummary[]> {
	throw new Error('Not implemented')
}

export async function getBoard(_boardId: string): Promise<Board> {
	throw new Error('Not implemented')
}

export async function createBoard(_data: { title: string; icon?: string; color?: string }): Promise<Board> {
	throw new Error('Not implemented')
}

export async function updateBoard(_boardId: string, _data: Partial<Board>): Promise<Board> {
	throw new Error('Not implemented')
}

export async function deleteBoard(_boardId: string): Promise<void> {
	throw new Error('Not implemented')
}

export async function getBoardTemplates(): Promise<BoardTemplate[]> {
	throw new Error('Not implemented')
}

export async function createBoardFromTemplate(_templateId: string, _title?: string): Promise<Board> {
	throw new Error('Not implemented')
}

export async function getTasks(_boardId: string): Promise<KanbanTask[]> {
	throw new Error('Not implemented')
}

export async function getTaskDetail(_taskId: string): Promise<KanbanTask> {
	throw new Error('Not implemented')
}

export async function getTaskMessages(_taskId: string): Promise<Message[]> {
	throw new Error('Not implemented')
}

export async function createTask(_data: CreateTaskData): Promise<KanbanTask> {
	throw new Error('Not implemented')
}

export async function updateTask(_taskId: string, _data: Partial<KanbanTask>): Promise<KanbanTask> {
	throw new Error('Not implemented')
}

export async function moveTask(_taskId: string, _columnId: string, _position: number): Promise<void> {
	throw new Error('Not implemented')
}

export async function deleteTask(_taskId: string): Promise<void> {
	throw new Error('Not implemented')
}

export async function sendMessage(_taskId: string, _content: string): Promise<Message> {
	throw new Error('Not implemented')
}

export async function createColumn(_boardId: string, _data: Partial<Column>): Promise<Column> {
	throw new Error('Not implemented')
}

export async function updateColumn(_columnId: string, _data: Partial<Column>): Promise<Column> {
	throw new Error('Not implemented')
}

export async function deleteColumn(_columnId: string): Promise<void> {
	throw new Error('Not implemented')
}

export async function reorderColumns(_boardId: string, _columnIds: string[]): Promise<void> {
	throw new Error('Not implemented')
}
