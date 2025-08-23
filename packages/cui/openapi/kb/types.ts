// Base collection metadata structure
export interface CollectionMetadata {
	name: string
	description: string
	uid: string
	readonly: boolean
	system: boolean
	sort: number
	cover: string
	document_count: number
	created_at: string
	updated_at: string
	// Permission fields (consistent with Model resources)
	__yao_created_by?: string // Created By User ID
	__yao_updated_by?: string // Updated By User ID
	__yao_team_id?: string // Team ID
	__yao_tenant_id?: string // Tenant ID
	__yao_public_read?: boolean // Public Read Permission
	__yao_public_write?: boolean // Public Write Permission
	__yao_inherit_from?: string // Inherit Permission From Parent Resource ID
	[key: string]: any // Additional fields
}

// Base collection config structure
export interface CollectionConfig {
	embedding_provider_id: string
	embedding_option_id: string
	locale?: string
	distance: string
	index_type: string
	// Additional HNSW parameters
	m?: number
	ef_construction?: number
	ef_search?: number
	// Additional IVF parameters
	num_lists?: number
	num_probes?: number
}

// Collection data structure (maps to backend GetCollections response)
export interface Collection {
	id: string
	metadata: CollectionMetadata
	config?: CollectionConfig
}

// API request types
export interface CreateCollectionRequest {
	id: string
	metadata?: Partial<CollectionMetadata>
	config: CollectionConfig
}

export interface GetCollectionsRequest {
	filter?: Record<string, string>
}

export interface UpdateCollectionMetadataRequest {
	metadata: Record<string, any>
}

// API response types
export interface CreateCollectionResponse {
	message: string
	collection_id: string
}

export interface RemoveCollectionResponse {
	message: string
	collection_id: string
	removed: boolean
}

export interface CollectionExistsResponse {
	collection_id: string
	exists: boolean
}

export interface UpdateCollectionMetadataResponse {
	message: string
	collection_id: string
}

// ===== Provider Management Types =====

// Re-export provider types from the Provider component
export type { Provider, ProviderSchema } from '../../pages/kb/components/Provider/types'

// Provider API request types
export interface GetProvidersRequest {
	providerType: string
	ids?: string // comma-separated list of provider IDs to filter
	locale?: string // locale for internationalization, defaults to 'en'
}

export interface GetProviderSchemaRequest {
	providerType: string
	providerID: string
	locale?: string // locale for internationalization, defaults to 'en'
}

// ===== Document Management Types =====

// Provider configuration for document operations
export interface ProviderConfig {
	provider_id: string
	option_id?: string
	option?: Record<string, any>
}

// 简化的集合信息，用于向下传递
export interface CollectionInfo {
	id: string
	name: string
	description?: string
	// Embedding provider 配置
	embedding_provider: string
	embedding_option: string
}

// Base request for document upsert operations
export interface BaseUpsertRequest {
	collection_id: string
	locale?: string
	chunking?: ProviderConfig
	embedding: ProviderConfig
	extraction?: ProviderConfig
	fetcher?: ProviderConfig
	converter?: ProviderConfig
	doc_id?: string
	metadata?: Record<string, any>
}

// Document management request types
export interface AddFileRequest extends BaseUpsertRequest {
	file_id: string
	uploader?: string
}

export interface AddTextRequest extends BaseUpsertRequest {
	text: string
}

export interface AddURLRequest extends BaseUpsertRequest {
	url: string
}

// Document management response types
export interface AddDocumentResponse {
	message: string
	collection_id: string
	doc_id: string
}

export interface AddFileResponse extends AddDocumentResponse {
	file_id: string
}

export interface AddURLResponse extends AddDocumentResponse {
	url: string
}

// Async operation response
export interface AsyncOperationResponse {
	job_id: string
	doc_id: string
}

// ===== Document List Types =====

// Document status enum
export type DocumentStatus =
	| 'pending'
	| 'converting'
	| 'chunking'
	| 'extracting'
	| 'embedding'
	| 'storing'
	| 'completed'
	| 'maintenance'
	| 'restoring'
	| 'error'

// Document type enum
export type DocumentType = 'file' | 'text' | 'url'

// Document data structure
export interface Document {
	id: number
	document_id: string
	collection_id: string
	name: string
	description?: string
	cover?: string
	tags?: any
	type: DocumentType
	size: number
	segment_count: number
	status: DocumentStatus
	locale?: string
	job_id?: string
	uploader_id?: string
	system?: boolean
	sort?: number

	// File-specific fields
	file_id?: string
	file_name?: string
	file_mime_type?: string

	// URL-specific fields
	url?: string
	url_title?: string

	// Content fields
	text_content?: string

	// Provider configuration fields
	converter_provider_id?: string
	converter_option_id?: string
	converter_properties?: any
	fetcher_provider_id?: string
	fetcher_option_id?: string
	fetcher_properties?: any
	chunking_provider_id?: string
	chunking_option_id?: string
	chunking_properties?: any
	extraction_provider_id?: string
	extraction_option_id?: string
	extraction_properties?: any

	// Timestamps
	processed_at?: string
	error_message?: string
	created_at: string
	updated_at: string
}

// Document list request parameters
export interface ListDocumentsRequest {
	page?: number
	pagesize?: number
	select?: string // comma-separated field names
	keywords?: string
	tag?: string
	collection_id?: string
	status?: string // comma-separated status values
	status_not?: string // comma-separated status values to exclude
	sort?: string // comma-separated sort fields with direction (e.g., "created_at desc,name asc")
}

// Document list response (matches Model.Paginate format)
export interface ListDocumentsResponse {
	data: Document[]
	total: number
	page: number
	pagesize: number
}

// ===== Get Document Types =====

// Get document request parameters
export interface GetDocumentRequest {
	select?: string // comma-separated field names
}

// Get document response (single document)
export type GetDocumentResponse = Document

// ===== Segment Management Types =====

// Segment data structure (matches backend GraphRag Segment type)
export interface Segment {
	collection_id: string
	document_id: string
	id: string
	text: string
	nodes: any[] // GraphNode array
	relationships: any[] // GraphRelationship array
	parents: string[]
	children: string[]
	metadata: Record<string, any>
	created_at: string
	updated_at: string
	version: number
	weight: number
	score: number
	positive: number // Positive vote count
	negative: number // Negative vote count
	hit: number // Hit count for the segment
}

// List segments request parameters
export interface ListSegmentsRequest {
	limit?: number // Number of segments per page (default: 100)
	offset?: number // Offset for pagination (default: 0)
	order_by?: string // Comma-separated fields to order by
	fields?: string // Comma-separated specific fields to retrieve
	include_nodes?: boolean // Whether to include graph nodes
	include_relationships?: boolean // Whether to include graph relationships
	include_metadata?: boolean // Whether to include segment metadata (default: true)
	// Filter parameters
	score?: number
	weight?: number
	vote?: number
}

// Paginated segments response (matches backend PaginatedSegmentsResult)
export interface ListSegmentsResponse {
	segments: Segment[]
	total: number // Total number of matching segments
	has_more: boolean // Whether there are more pages
	next_offset: number // Offset for next page
}

// Scroll segments request (iterator-style pagination)
export interface ScrollSegmentsRequest {
	limit?: number // Number of segments per batch (default: 100)
	scroll_id?: string // Scroll ID for continuing pagination
	order_by?: string // Comma-separated fields to order by (score, weight, vote, created_at, etc.)
	fields?: string // Comma-separated specific fields to retrieve
	include_nodes?: boolean // Whether to include graph nodes
	include_relationships?: boolean // Whether to include graph relationships
	include_metadata?: boolean // Whether to include segment metadata (default: true)
	// Filter parameters
	score?: number
	weight?: number
	vote?: number
}

// Scroll segments response (matches backend SegmentScrollResult)
export interface ScrollSegmentsResponse {
	segments: Segment[]
	scroll_id?: string // ID for next scroll request
	has_more: boolean // Whether there are more results
}

// ===== Segment Operations Types =====

// Get segment response
export interface GetSegmentResponse {
	segment: Segment
	doc_id: string
	segment_id: string
}

// Segment text structure for adding/updating segments
export interface SegmentText {
	id?: string
	text: string
}

// Segment score structure
export interface SegmentScore {
	id: string
	score?: number
}

// Segment weight structure
export interface SegmentWeight {
	id: string
	weight?: number
}

// Update segments request
export interface UpdateSegmentsRequest {
	segment_texts: SegmentText[]
}

// Update segments response
export interface UpdateSegmentsResponse {
	message: string
	updated_count: number
	segments_count: number
}

// Remove segments response
export interface RemoveSegmentsResponse {
	message: string
	segment_ids: string[]
	removed_count: number
}

// Remove segments by document ID response
export interface RemoveSegmentsByDocIDResponse {
	message: string
	doc_id: string
	removed_count: number
}

// Update vote request
export interface UpdateVoteRequest {
	segments: SegmentVote[]
}

// Update vote response
export interface UpdateVoteResponse {
	message: string
	segments: SegmentVote[]
	updated_count: number
}

// Update score request
export interface UpdateScoreRequest {
	segments: SegmentScore[]
}

// Update score response
export interface UpdateScoreResponse {
	message: string
	segments: SegmentScore[]
	updated_count: number
}

// Update weight request
export interface UpdateWeightRequest {
	segments: SegmentWeight[]
}

// Update weight response
export interface UpdateWeightResponse {
	message: string
	segments: SegmentWeight[]
	updated_count: number
}

// Update weights request (batch)
export interface UpdateWeightsRequest {
	weights: SegmentWeight[]
}

// Update weights response (batch)
export interface UpdateWeightsResponse {
	message: string
	doc_id: string
	weights: SegmentWeight[]
	updated_count: number
}

// Update scores request (batch)
export interface UpdateScoresRequest {
	scores: SegmentScore[]
}

// Update scores response (batch)
export interface UpdateScoresResponse {
	message: string
	doc_id: string
	scores: SegmentScore[]
	updated_count: number
}

// ===== Vote Management Types =====

// Vote type enum
export type VoteType = 'positive' | 'negative'

// Segment reaction structure
export interface SegmentReaction {
	source?: string // Source of the reaction, e.g. "chat", "api", "bot", etc.
	scenario?: string // Scenario of the reaction, e.g. "question", "search", "response", etc.
	query?: string // Query of the reaction, e.g. "What is the capital of France?", etc.
	candidate?: string // Candidate of the reaction, e.g. "Paris", etc.
	context?: Record<string, any> // Context of the reaction
}

// Segment vote structure
export interface SegmentVote {
	id: string // Segment ID
	vote_id?: string // Unique vote ID
	vote: VoteType // Vote type
	source?: string
	scenario?: string
	query?: string
	candidate?: string
	context?: Record<string, any>
}

// Segment hit structure
export interface SegmentHit {
	id: string // Segment ID
	hit_id?: string // Unique hit ID
	source?: string
	scenario?: string
	query?: string
	candidate?: string
	context?: Record<string, any>
}

// Vote removal structure
export interface VoteRemoval {
	segment_id: string
	vote_id: string
}

// Hit removal structure
export interface HitRemoval {
	segment_id: string
	hit_id: string
}

// Vote scroll result
export interface VoteScrollResult {
	votes: SegmentVote[]
	next_cursor?: string
	has_more: boolean
	total?: number
}

// Hit scroll result
export interface HitScrollResult {
	hits: SegmentHit[] | null
	next_cursor?: string
	has_more: boolean
	total?: number
}

// Scroll votes request
export interface ScrollVotesRequest {
	limit?: number
	scroll_id?: string
	vote_type?: VoteType
	source?: string
	scenario?: string
}

// Scroll hits request
export interface ScrollHitsRequest {
	limit?: number
	scroll_id?: string
	source?: string
	scenario?: string
}

// Add votes request
export interface AddVotesRequest {
	segments: SegmentVote[]
	default_reaction?: SegmentReaction
}

// Add votes response
export interface AddVotesResponse {
	message: string
	doc_id: string
	segment_id: string
	votes: SegmentVote[]
	updated_count: number
}

// Add hits request
export interface AddHitsRequest {
	segments: SegmentHit[]
	default_reaction?: SegmentReaction
}

// Add hits response
export interface AddHitsResponse {
	message: string
	doc_id: string
	segment_id: string
	hits: SegmentHit[]
	updated_count: number
}

// Remove votes response
export interface RemoveVotesResponse {
	message: string
	doc_id: string
	segment_id: string
	vote_ids: string[]
	removed_count: number
}

// Remove hits response
export interface RemoveHitsResponse {
	message: string
	doc_id: string
	segment_id: string
	hit_ids: string[]
	removed_count: number
}

// Get vote response
export interface GetVoteResponse {
	vote: SegmentVote
	doc_id: string
	segment_id: string
	vote_id: string
}

// Get hit response
export interface GetHitResponse {
	hit: SegmentHit
	doc_id: string
	segment_id: string
	hit_id: string
}
