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
	dimension: number
	distance: string
	index_type: string
	[key: string]: any // Additional config parameters
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
