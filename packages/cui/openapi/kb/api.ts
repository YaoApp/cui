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
	GetProviderSchemaRequest,
	AddFileRequest,
	AddTextRequest,
	AddURLRequest,
	AsyncOperationResponse,
	ListDocumentsRequest,
	ListDocumentsResponse,
	GetDocumentRequest,
	GetDocumentResponse
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

	// ===== Document Management =====

	/**
	 * Add file to collection asynchronously
	 */
	async AddFileAsync(collectionID: string, request: AddFileRequest): Promise<ApiResponse<AsyncOperationResponse>> {
		return this.api.Post<AsyncOperationResponse>(
			`/kb/collections/${collectionID}/documents/file/async`,
			request
		)
	}

	/**
	 * Add text to collection asynchronously
	 */
	async AddTextAsync(collectionID: string, request: AddTextRequest): Promise<ApiResponse<AsyncOperationResponse>> {
		return this.api.Post<AsyncOperationResponse>(
			`/kb/collections/${collectionID}/documents/text/async`,
			request
		)
	}

	/**
	 * Add URL to collection asynchronously
	 */
	async AddURLAsync(collectionID: string, request: AddURLRequest): Promise<ApiResponse<AsyncOperationResponse>> {
		return this.api.Post<AsyncOperationResponse>(`/kb/collections/${collectionID}/documents/url/async`, request)
	}

	/**
	 * List documents with pagination and filtering
	 */
	async ListDocuments(request?: ListDocumentsRequest): Promise<ApiResponse<ListDocumentsResponse>> {
		const params: Record<string, string> = {}

		if (request) {
			if (request.page !== undefined) {
				params.page = request.page.toString()
			}
			if (request.pagesize !== undefined) {
				params.pagesize = request.pagesize.toString()
			}
			if (request.select) {
				params.select = request.select
			}
			if (request.keywords) {
				params.keywords = request.keywords
			}
			if (request.tag) {
				params.tag = request.tag
			}
			if (request.collection_id) {
				params.collection_id = request.collection_id
			}
			if (request.status) {
				params.status = request.status
			}
			if (request.status_not) {
				params.status_not = request.status_not
			}
			if (request.sort) {
				params.sort = request.sort
			}
		}

		return this.api.Get<ListDocumentsResponse>('/kb/documents', params)
	}

	/**
	 * Get document details by document ID
	 */
	async GetDocument(docID: string, request?: GetDocumentRequest): Promise<ApiResponse<GetDocumentResponse>> {
		const params: Record<string, string> = {}

		if (request?.select) {
			params.select = request.select
		}

		return this.api.Get<GetDocumentResponse>(`/kb/documents/${docID}`, params)
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
