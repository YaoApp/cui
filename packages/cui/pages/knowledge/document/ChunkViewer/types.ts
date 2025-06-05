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

export interface ChunkViewerProps {
	docId: string
	collectionId: string
}
