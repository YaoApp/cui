import type { Message } from '../openapi'
import type { IChatSession } from '../types'

// Mock Data
const MOCK_SESSIONS: IChatSession[] = [
    {
        chat_id: 'chat-1',
        title: 'Explaining Quantum Physics',
        last_message: 'That makes sense now.',
        updated_at: Date.now() - 1000 * 60 * 5,
        assistant_id: 'neo'
    },
    {
        chat_id: 'chat-2',
        title: 'Code Review: Auth Module',
        last_message: 'Please fix the lint errors.',
        updated_at: Date.now() - 1000 * 60 * 60 * 24,
        assistant_id: 'neo'
    }
]

const MOCK_HISTORY: Record<string, Message[]> = {
    'chat-1': [
        { id: '1', type: 'text', props: { content: 'What is quantum entanglement?', role: 'user' }, done: true },
        { id: '2', type: 'text', props: { content: 'Quantum entanglement is a physical phenomenon...', role: 'assistant' }, done: true },
        { id: '3', type: 'text', props: { content: 'That makes sense now.', role: 'user' }, done: true }
    ],
    'chat-2': [
        { id: '1', type: 'text', props: { content: 'Review this code.', role: 'user' }, done: true },
        { id: '2', type: 'text', props: { content: 'Looks good but has lint errors.', role: 'assistant' }, done: true }
    ]
}

export const getRecentChats = async (): Promise<IChatSession[]> => {
    return new Promise(resolve => {
        setTimeout(() => resolve([...MOCK_SESSIONS]), 500)
    })
}

export const getChatHistory = async (chatId: string): Promise<Message[]> => {
    return new Promise(resolve => {
        setTimeout(() => resolve(MOCK_HISTORY[chatId] || []), 500)
    })
}

