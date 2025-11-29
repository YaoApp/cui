import { createContext, useContext, ReactNode } from 'react'
import { useChat, UseChatOptions, UseChatReturn } from './hooks/useChat'

const ChatContext = createContext<UseChatReturn | null>(null)

export type ChatContextType = UseChatReturn | null

interface ChatProviderProps extends UseChatOptions {
	children: ReactNode
}

export const ChatProvider = ({ children, ...options }: ChatProviderProps) => {
	const chat = useChat(options)
	return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
}

export const useChatContext = () => {
	const context = useContext(ChatContext)
	if (!context) {
		// Return null instead of throwing error to handle race conditions during initial load
		// Components should check for null and handle gracefully
		return null
	}
	return context
}

// For components that require the context and should throw if not available
export const useRequiredChatContext = () => {
	const context = useContext(ChatContext)
	if (!context) {
		throw new Error('useChatContext must be used within a ChatProvider')
	}
	return context
}
