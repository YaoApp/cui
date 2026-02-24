import type { UserMessage } from '@/openapi/chat/types'

export type AIGeneratorState = 'idle' | 'input' | 'generating'

export type OutputFormat = 'text' | 'json'

export interface AIGeneratorChildState {
	onClick: () => void
	generating: boolean
	tokenCount: number
	cancel: () => void
}

export interface AIGeneratorProps {
	assistantId: string

	context?: UserMessage[] | (() => UserMessage[])

	outputFormat?: OutputFormat

	onStart?: (userInput: string) => void
	onStream?: (text: string, parsed?: Record<string, any>) => void
	onComplete: (text: string, parsed?: Record<string, any>) => void
	onCancel?: (text: string, parsed?: Record<string, any>) => void
	onError?: (error: Error) => void

	placeholder?: string
	label?: string
	buttonClassName?: string
	buttonStyle?: React.CSSProperties
	size?: 'small' | 'default'

	children?: (state: AIGeneratorChildState) => React.ReactNode
}
