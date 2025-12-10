import { useCallback } from 'react'
import { getLocale } from '@umijs/max'
import type { Message } from '../../openapi'
import type { ChatTab } from '../types'
import type { ChatRefs } from './state'
import { Chat } from '../../openapi'

export interface UseTitleOptions {
	chatClient: Chat | null
	titleAgentId?: string
	setTabs: React.Dispatch<React.SetStateAction<ChatTab[]>>
	refs: ChatRefs
}

/**
 * Check if messages represent the first round of conversation
 * First round = 1 user message + AI responses (regardless of thinking/tool_call etc.)
 */
function isFirstRound(messages: Message[]): boolean {
	// Count user messages
	const userMessageCount = messages.filter((msg) => msg.type === 'user_input').length
	// First round means exactly one user message
	return userMessageCount === 1
}

/**
 * Extract conversation text for title generation
 * Includes user input and text responses
 */
function extractConversationText(messages: Message[]): string {
	return messages
		.filter((msg) => {
			// Include user input
			if (msg.type === 'user_input') return true
			// Include text responses
			if (msg.type === 'text' && msg.props?.content) return true
			return false
		})
		.map((msg) => msg.props?.content || '')
		.join('\n')
		.slice(0, 500)
}

export function useTitle({ chatClient, titleAgentId, setTabs, refs }: UseTitleOptions) {
	const generateChatTitle = useCallback(
		async (targetTabId: string, currentMessages: Message[]) => {
			if (!titleAgentId || !chatClient) {
				return
			}

			// Check if already generated
			if (refs.titleGenerated.current[targetTabId]) {
				return
			}

			// Only generate for first round
			if (!isFirstRound(currentMessages)) {
				return
			}

			// Mark as generated to prevent duplicate calls
			refs.titleGenerated.current[targetTabId] = true

			try {
				const conversationText = extractConversationText(currentMessages)

				if (!conversationText) {
					return
				}

				let generatedTitle = ''
				const locale = getLocale() || 'en-us'
				const languageHint = locale.startsWith('zh')
					? 'Please generate the title in Chinese.'
					: 'Please generate the title in English.'

				chatClient.StreamCompletion(
					{
						assistant_id: titleAgentId,
						messages: [
							{
								role: 'user',
								content: `Generate a short title for this conversation. ${languageHint}\n\nConversation:\n${conversationText}`
							}
						],
						// Don't pass model - use titleAgent's configured model
						skip: {
							history: true,
							trace: true
						}
					},
					(chunk: Message) => {
						if (chunk.type === 'event' && chunk.props?.event === 'message_end') {
							if (generatedTitle) {
								const finalTitle = generatedTitle.trim().slice(0, 50)
								// Update local tab title
								setTabs((prev) =>
									prev.map((t) =>
										t.chatId === targetTabId ? { ...t, title: finalTitle } : t
									)
								)
								// Update title via API
								chatClient
									.UpdateSession(targetTabId, { title: finalTitle })
									.then(() => {
										// Notify History to refresh after title is saved
										if (window.$app?.Event) {
											window.$app.Event.emit('chat/historyRefresh')
										}
									})
									.catch((err) => {
										console.error('Failed to update chat title via API:', err)
									})
							}
							return
						}

						if (chunk.type === 'text' && chunk.props?.content) {
							if (chunk.delta) {
								generatedTitle += chunk.props.content
							} else {
								generatedTitle = chunk.props.content
							}

							// Real-time update local tab title
							const currentTitle = generatedTitle.trim().slice(0, 50)
							if (currentTitle) {
								setTabs((prev) =>
									prev.map((t) =>
										t.chatId === targetTabId ? { ...t, title: currentTitle } : t
									)
								)
							}
						}
					},
					(error: any) => {
						console.error('Failed to generate title:', error)
					}
				)
			} catch (err) {
				console.error('Error generating chat title:', err)
			}
		},
		[chatClient, titleAgentId, setTabs, refs]
	)

	return { generateChatTitle }
}
