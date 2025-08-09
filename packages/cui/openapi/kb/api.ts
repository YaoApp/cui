import OpenAPI from '../openapi'
import { ApiResponse } from '../types'
import {
	Collection,
	CreateCollectionRequest,
	CreateCollectionResponse,
	RemoveCollectionResponse,
	CollectionExistsResponse,
	GetCollectionsRequest,
	UpdateCollectionMetadataRequest,
	UpdateCollectionMetadataResponse,
	Provider,
	ProviderSchema,
	GetProvidersRequest,
	GetProviderSchemaRequest
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

	/**
	 * Update collection metadata
	 */
	async UpdateCollectionMetadata(
		collectionID: string,
		request: UpdateCollectionMetadataRequest
	): Promise<ApiResponse<UpdateCollectionMetadataResponse>> {
		return this.api.Put<UpdateCollectionMetadataResponse>(`/kb/collections/${collectionID}/metadata`, request)
	}

	// ===== Provider Management =====

	/**
	 * Get providers by type
	 */
	async GetProviders(request: GetProvidersRequest): Promise<ApiResponse<Provider[]>> {
		const params: Record<string, string> = {}
		if (request.ids) {
			params.ids = request.ids
		}
		if (request.locale) {
			params.locale = request.locale
		}

		return this.api.Get<Provider[]>(`/kb/providers/${request.providerType}`, params)
	}

	/**
	 * Get provider schema
	 */
	async GetProviderSchema(request: GetProviderSchemaRequest): Promise<ApiResponse<ProviderSchema>> {
		const params: Record<string, string> = {}
		if (request.locale) {
			params.locale = request.locale
		}

		return this.api.Get<ProviderSchema>(
			`/kb/providers/${request.providerType}/${request.providerID}/schema`,
			params
		)
	}
}
