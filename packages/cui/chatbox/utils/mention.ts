export type MentionType = 'expert' | 'workspace' | 'file'

export interface MentionData {
	type: MentionType
	id: string
	label: string
}

export const MENTION_DRAG_TYPE = 'application/x-yao-mention'

/**
 * Recursively serialize a contentEditable editor's DOM into plain text,
 * converting .mentionTag spans into <Mention> XML tags.
 *
 * Handles browser-specific contentEditable differences:
 * - Chrome wraps lines in <div>
 * - Firefox uses <br>
 * - Safari may use <p>
 */
export function serializeEditorContent(editor: HTMLElement, mentionTagClass: string): string {
	const parts: string[] = []
	serializeNode(editor, parts, mentionTagClass, true)
	return parts.join('')
}

function serializeNode(
	node: Node,
	parts: string[],
	mentionTagClass: string,
	isRoot: boolean
): void {
	if (node.nodeType === Node.TEXT_NODE) {
		parts.push(node.textContent || '')
		return
	}

	if (node.nodeType !== Node.ELEMENT_NODE) return

	const el = node as HTMLElement
	const tagName = el.tagName.toLowerCase()

	if (tagName === 'br') {
		parts.push('\n')
		return
	}

	if (el.classList.contains(mentionTagClass)) {
		const mType = el.dataset.mentionType || 'expert'
		const mId = el.dataset.mentionId || ''
		const mLabel = el.dataset.mentionLabel || el.textContent || ''
		parts.push(`<Mention type="${mType}" value="${mId}">${mLabel}</Mention>`)
		return
	}

	const isBlock = tagName === 'div' || tagName === 'p'
	if (isBlock && !isRoot) {
		const lastPart = parts[parts.length - 1]
		if (lastPart && lastPart !== '\n' && !lastPart.endsWith('\n')) {
			parts.push('\n')
		}
	}

	for (const child of Array.from(node.childNodes)) {
		serializeNode(child, parts, mentionTagClass, false)
	}
}

const DRAG_GHOST_ICONS: Record<MentionType, string> = {
	expert: 'smart_toy',
	workspace: 'folder',
	file: 'insert_drive_file'
}

const DRAG_GHOST_COLORS: Record<MentionType, string> = {
	expert: '#1677ff',
	workspace: '#52c41a',
	file: '#faad14'
}

/**
 * Create a compact, styled drag ghost element and apply it via setDragImage().
 * The ghost is a small pill showing an icon and label, removed after the drag ends.
 */
export function setMentionDragImage(e: { dataTransfer: DataTransfer }, data: MentionData): void {
	const ghost = document.createElement('div')
	const color = DRAG_GHOST_COLORS[data.type]

	Object.assign(ghost.style, {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		padding: '6px 12px',
		borderRadius: '8px',
		background: '#fff',
		border: `1.5px solid ${color}`,
		boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
		fontSize: '13px',
		fontWeight: '500',
		fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		color: color,
		whiteSpace: 'nowrap',
		maxWidth: '220px',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		position: 'fixed',
		top: '-1000px',
		left: '-1000px',
		zIndex: '-1',
		pointerEvents: 'none'
	})

	const icon = document.createElement('span')
	icon.className = 'Icon material'
	icon.textContent = DRAG_GHOST_ICONS[data.type]
	Object.assign(icon.style, {
		fontSize: '16px',
		lineHeight: '1',
		flexShrink: '0'
	})

	const label = document.createElement('span')
	label.textContent = data.label
	Object.assign(label.style, {
		overflow: 'hidden',
		textOverflow: 'ellipsis'
	})

	ghost.appendChild(icon)
	ghost.appendChild(label)
	document.body.appendChild(ghost)

	e.dataTransfer.setDragImage(ghost, 16, 16)

	requestAnimationFrame(() => {
		setTimeout(() => document.body.removeChild(ghost), 0)
	})
}

/**
 * Parse a JSON string from drag-and-drop dataTransfer into MentionData.
 * Returns null if the data is invalid.
 */
export function parseMentionDragData(jsonStr: string): MentionData | null {
	try {
		const data = JSON.parse(jsonStr)
		if (
			data &&
			typeof data.type === 'string' &&
			typeof data.id === 'string' &&
			typeof data.label === 'string' &&
			['expert', 'workspace', 'file'].includes(data.type)
		) {
			return data as MentionData
		}
		return null
	} catch {
		return null
	}
}
