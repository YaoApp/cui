// 知识库数据类型
export interface KnowledgeBase {
	id: string
	collection_id: string
	name: string
	description: string
	uid: string
	public: boolean
	scope?: any
	readonly: boolean
	option?: any
	system: boolean
	sort: number
	cover: string
	document_count: number // 文档数量
	created_at: string
	updated_at: string
}

export interface DocumentSummary {
	id: string
	collection_id: string
	doc_id: string // 文档ID
	uid: string // Creator
	name: string
	cover?: string
	description?: string
	created_at: string
	updated_at: string
	chunk_count: number // 切片数量
}

// 文档状态枚举
export type DocumentStatus = 'processing' | 'ready' | 'failed' | 'indexing'

export interface Document {
	id: string
	doc_id: string // 文档ID
	collection_id: string
	name: string
	description: string
	uid: string
	cover?: string
	content: string
	created_at: string
	updated_at: string
	// 新增字段
	knowledge_base_name: string // 所属知识库集合名称
	chunk_count: number // 切片数量
	status: DocumentStatus // 文档状态
	file_size: number // 文件大小（字节）
}

export interface Chunk {
	id: string
	doc_id: string // 文档ID
	collection_id: string // 知识库ID
	content: string // 切片内容
	seek: number // 切片位置
	length: number // 切片长度
	created_at: string
	updated_at: string
}

// KB 相关的记录类型定义
export interface HitRecord {
	id: string
	scenario: string
	source: string
	context: any
	created_at: string
	query?: string
	score?: number
	metadata?: Record<string, any>
}

export interface VoteRecord {
	id: string
	type: 'up' | 'down'
	reason?: string
	created_at: string
	user_id?: string
	query?: string
	segment_id?: string
	metadata?: Record<string, any>
}

export interface LogRecord {
	id: string
	level: 'info' | 'warn' | 'error' | 'debug'
	message: string
	created_at: string
	user_id?: string
	action?: string
	metadata?: Record<string, any>
}
