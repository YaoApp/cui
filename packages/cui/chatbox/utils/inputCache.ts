/** 单条缓存 — 一个 chatId 的 InputArea 编辑态快照 */
export interface InputCacheEntry {
	/** contentEditable innerHTML（保留 mention span 结构） */
	draft: string
	/** 编辑器是否为空 */
	isEmpty: boolean
	/** 未发送的附件（已序列化） */
	attachments: SerializedAttachment[]
}

export interface SerializedAttachment {
	id: string
	name: string
	type: 'image' | 'file'
	/** 已上传的服务端文件 ID — 恢复后可直接发送 */
	fileId?: string
	wrapper?: string
	/** 服务端 URL 或 data URL（排除 blob URL，blob 不可跨生命周期） */
	previewUrl?: string
}

/** 完整条目默认值 — 防止增量写入产生 undefined 字段 */
const EMPTY_ENTRY: InputCacheEntry = {
	draft: '',
	isEmpty: true,
	attachments: []
}

/** 模块级单例，与组件生命周期无关 */
const cache = new Map<string, InputCacheEntry>()

export function getInputCache(chatId: string): InputCacheEntry | undefined {
	return cache.get(chatId)
}

/**
 * 写入缓存。增量合并，首次写入时以 EMPTY_ENTRY 为基底，
 * 保证每个条目的所有字段都有值。
 */
export function setInputCache(chatId: string, entry: Partial<InputCacheEntry>): void {
	const prev = cache.get(chatId) ?? EMPTY_ENTRY
	cache.set(chatId, { ...prev, ...entry })
}

export function removeInputCache(chatId: string): void {
	cache.delete(chatId)
}
