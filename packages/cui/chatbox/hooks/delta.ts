import type { Message } from '../../openapi'

// Message cache for merging deltas
// Two-level cache: chatId -> (message_id -> Message Props)
// This ensures each chat tab has its own isolated cache
const chatCaches = new Map<string, Map<string, any>>()

/**
 * Get or create a cache for a specific chat
 */
function getChatCache(chatId: string): Map<string, any> {
	let cache = chatCaches.get(chatId)
	if (!cache) {
		cache = new Map<string, any>()
		chatCaches.set(chatId, cache)
	}
	return cache
}

/**
 * Apply delta updates to a message state
 *
 * @param chatId - The chat ID to scope the cache
 * @param msgId - The message_id (same for all delta chunks of one logical message)
 * @param chunk - The delta chunk received from backend
 * @returns Merged message state with accumulated props
 */
export function applyDelta(chatId: string, msgId: string, chunk: Message): any {
	const cache = getChatCache(chatId)
	// Get or initialize message state
	let current = cache.get(msgId)
	if (!current) {
		// Initialize with empty props for delta messages
		// Props will be populated by the delta merge logic below
		current = { type: chunk.type, props: {} }
		cache.set(msgId, current)
	}

	if (!chunk.delta) {
		// Not a delta, use as-is (complete message)
		// Usually non-delta chunks replace the props or are standalone
		current.props = { ...chunk.props }
		current.type = chunk.type
		return current
	}

	// Get target path (default to entire props)
	const path = chunk.delta_path || ''
	const action = chunk.delta_action || 'append'

	// Apply delta based on action
	switch (action) {
		case 'append':
			// Append to string or array
			if (path) {
				const target = getValueByPath(current.props, path)
				const chunkValue = getValueByPath(chunk.props, path)
				if (typeof target === 'string') {
					setValueByPath(current.props, path, target + chunkValue)
				} else if (Array.isArray(target)) {
					setValueByPath(current.props, path, [
						...target,
						...(Array.isArray(chunkValue) ? chunkValue : [chunkValue])
					])
				} else {
					// If target doesn't exist, set it
					setValueByPath(current.props, path, chunkValue)
				}
			} else {
				// Append to root level fields (e.g., content)
				const props = chunk.props
				if (props) {
					Object.keys(props).forEach((key) => {
						if (typeof current.props[key] === 'string') {
							current.props[key] = (current.props[key] || '') + props[key]
						} else if (Array.isArray(current.props[key])) {
							current.props[key].push(
								...(Array.isArray(props[key]) ? props[key] : [props[key]])
							)
						} else {
							current.props[key] = props[key]
						}
					})
				}
			}
			break

		case 'replace':
			// Replace entire value at path
			if (path) {
				setValueByPath(current.props, path, getValueByPath(chunk.props, path))
			} else {
				current.props = { ...chunk.props }
			}
			break

		case 'merge':
			// Deep merge objects
			if (path) {
				const target = getValueByPath(current.props, path)
				const source = getValueByPath(chunk.props, path)
				setValueByPath(current.props, path, deepMerge(target, source))
			} else {
				current.props = deepMerge(current.props, chunk.props)
			}
			break

		case 'set':
			// Set new field
			if (path) {
				setValueByPath(current.props, path, getValueByPath(chunk.props, path))
			} else {
				Object.assign(current.props, chunk.props)
			}
			break
	}

	// Update type if changed (and not just delta)
	if (chunk.type && chunk.type !== current.type && !chunk.type_change) {
		// Sometimes type might be provided in delta, update it if it's valid
		current.type = chunk.type
	}

	return current
}

/**
 * Clear message cache
 *
 * @param chatId - The chat ID to scope the operation
 * @param msgId - Optional message_id to clear specific message cache, or clear all messages for the chat if not provided
 */
export function clearMessageCache(chatId: string, msgId?: string) {
	if (msgId) {
		const cache = chatCaches.get(chatId)
		if (cache) {
			cache.delete(msgId)
		}
	} else {
		// Clear only this chat's cache, not others
		chatCaches.delete(chatId)
	}
}

// Helper functions
function getValueByPath(obj: any, path: string): any {
	if (!path) return obj
	return path.split('.').reduce((acc, part) => {
		const match = part.match(/^(\w+)(\[(\d+)\])?$/)
		if (match) {
			const [, key, , index] = match
			return index !== undefined ? acc?.[key]?.[parseInt(index)] : acc?.[key]
		}
		return acc?.[part]
	}, obj)
}

function setValueByPath(obj: any, path: string, value: any): void {
	if (!path) return
	const parts = path.split('.')
	const last = parts.pop()!
	const target = parts.reduce((acc, part) => {
		const match = part.match(/^(\w+)(\[(\d+)\])?$/)
		if (match) {
			const [, key, , index] = match
			if (index !== undefined) {
				acc[key] = acc[key] || []
				return acc[key][parseInt(index)]
			}
			acc[key] = acc[key] || {}
			return acc[key]
		}
		acc[part] = acc[part] || {}
		return acc[part]
	}, obj)

	const match = last.match(/^(\w+)(\[(\d+)\])?$/)
	if (match) {
		const [, key, , index] = match
		if (index !== undefined) {
			target[key] = target[key] || []
			target[key][parseInt(index)] = value
		} else {
			target[key] = value
		}
	} else {
		target[last] = value
	}
}

function deepMerge(target: any, source: any): any {
	if (!source) return target
	if (!target) return source
	if (typeof target !== 'object' || typeof source !== 'object') return source

	const result = Array.isArray(target) ? [...target] : { ...target }
	for (const key in source) {
		if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
			result[key] = deepMerge(result[key], source[key])
		} else {
			result[key] = source[key]
		}
	}
	return result
}
