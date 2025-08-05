import OpenAPI from '../openapi'
import { ApiResponse } from '../types'
import {
	Collection,
	CreateCollectionRequest,
	CreateCollectionResponse,
	RemoveCollectionResponse,
	CollectionExistsResponse,
	GetCollectionsRequest
} from './types'

/**
 * Knowledge Base API
 */
export class KB {
	private api: OpenAPI

	constructor(api: OpenAPI) {
		this.api = api
	}

	// ===== Collection Management =====

	/**
	 * Create a new collection
	 */
	async CreateCollection(request: CreateCollectionRequest): Promise<ApiResponse<CreateCollectionResponse>> {
		return this.api.Post<CreateCollectionResponse>('/kb/collections', request)
	}

	/**
	 * Remove a collection by ID
	 */
	async RemoveCollection(collectionID: string): Promise<ApiResponse<RemoveCollectionResponse>> {
		return this.api.Delete<RemoveCollectionResponse>(`/kb/collections/${collectionID}`)
	}

	/**
	 * Check if a collection exists
	 */
	async CollectionExists(collectionID: string): Promise<ApiResponse<CollectionExistsResponse>> {
		return this.api.Get<CollectionExistsResponse>(`/kb/collections/${collectionID}/exists`)
	}

	/**
	 * Get collections list
	 */
	async GetCollections(request?: GetCollectionsRequest): Promise<ApiResponse<Collection[]>> {
		const params = request?.filter || {}
		return this.api.Get<Collection[]>('/kb/collections', params)
	}
}
