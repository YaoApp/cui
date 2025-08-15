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
	embedding_provider: string
	embedding_option: string
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

// Base request for document upsert operations
export interface BaseUpsertRequest {
	collection_id: string
	locale?: string
	chunking: ProviderConfig
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
	file_name?: string
	file_path?: string
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
