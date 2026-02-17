import type { Message } from '../../openapi'

export interface ExportOptions {
	title?: string
	assistantName?: string
}

/**
 * Convert chat messages to Markdown string
 */
export function messagesToMarkdown(messages: Message[], options: ExportOptions = {}): string {
	const { title, assistantName } = options
	const parts: string[] = []

	if (title) {
		parts.push(`# ${title}\n`)
	}

	const roleName = assistantName || 'Assistant'

	for (const msg of messages) {
		const type = msg.type
		const props = msg.props || {}

		switch (type) {
			case 'user_input': {
				const content =
					typeof props.content === 'string'
						? props.content
						: Array.isArray(props.content)
							? props.content
									.filter((p: any) => p.type === 'text' && p.text)
									.map((p: any) => p.text)
									.join('\n')
							: ''
				if (content) {
					parts.push(`## User\n\n${content}\n`)
				}
				break
			}

			case 'text': {
				if (props.content) {
					parts.push(`## ${roleName}\n\n${props.content}\n`)
				}
				break
			}

			case 'thinking': {
				if (props.content) {
					parts.push(
						`<details>\n<summary>Thinking</summary>\n\n${props.content}\n\n</details>\n`
					)
				}
				break
			}

			case 'tool_call': {
				const name = props.name || 'tool_call'
				const args = props.arguments || props.raw || ''
				parts.push(`**Tool Call: ${name}**\n\n\`\`\`json\n${args}\n\`\`\`\n`)
				break
			}

			case 'image': {
				if (props.url) {
					parts.push(`![${props.alt || 'image'}](${props.url})\n`)
				}
				break
			}

			case 'error': {
				if (props.message) {
					parts.push(`> **Error**: ${props.message}\n`)
				}
				break
			}

			// Skip non-content types: loading, action, event
			default:
				break
		}
	}

	return parts.join('\n')
}

/**
 * Export chat messages as a Markdown file download
 */
export function exportChatAsMarkdown(messages: Message[], options: ExportOptions = {}): void {
	const filename = (options.title || 'chat').replace(/[<>:"/\\|?*]+/g, '_')
	const markdown = messagesToMarkdown(messages, options)
	const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = `${filename}.md`
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}
