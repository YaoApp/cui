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
export type { Provider, ProviderSchema } from '../../pages/knowledge/components/Provider/types'

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
