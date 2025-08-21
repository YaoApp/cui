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
	GetDocumentResponse,
	Segment,
	GetSegmentResponse,
	ListSegmentsRequest,
	ListSegmentsResponse,
	ScrollSegmentsRequest,
	ScrollSegmentsResponse,
	UpdateSegmentsRequest,
	UpdateSegmentsResponse,
	RemoveSegmentsResponse,
	RemoveSegmentsByDocIDResponse,
	UpdateWeightRequest,
	UpdateWeightResponse
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
	 * Get collection by ID
	 */
	async GetCollection(collectionID: string): Promise<ApiResponse<Collection>> {
		return this.api.Get<Collection>(`/kb/collections/${collectionID}`)
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

	// ===== Segment Management =====

	/**
	 * Get a single segment by ID
	 */
	async GetSegment(docID: string, segmentID: string): Promise<ApiResponse<GetSegmentResponse>> {
		return this.api.Get<GetSegmentResponse>(`/kb/documents/${docID}/segments/${segmentID}`)
	}

	/**
	 * Scroll segments with iterator-style pagination (recommended for large datasets)
	 */
	async ScrollSegments(
		docID: string,
		request?: ScrollSegmentsRequest
	): Promise<ApiResponse<ScrollSegmentsResponse>> {
		const params: Record<string, string> = {}

		if (request) {
			if (request.limit !== undefined) {
				params.limit = request.limit.toString()
			}
			if (request.scroll_id) {
				params.scroll_id = request.scroll_id
			}
			if (request.order_by) {
				params.order_by = request.order_by
			}
			if (request.fields) {
				params.fields = request.fields
			}
			if (request.include_nodes !== undefined) {
				params.include_nodes = request.include_nodes.toString()
			}
			if (request.include_relationships !== undefined) {
				params.include_relationships = request.include_relationships.toString()
			}
			if (request.include_metadata !== undefined) {
				params.include_metadata = request.include_metadata.toString()
			}
			// Filter parameters
			if (request.score !== undefined) {
				params.score = request.score.toString()
			}
			if (request.weight !== undefined) {
				params.weight = request.weight.toString()
			}
			if (request.vote !== undefined) {
				params.vote = request.vote.toString()
			}
		}

		return this.api.Get<ScrollSegmentsResponse>(`/kb/documents/${docID}/segments`, params)
	}

	/**
	 * Update segments manually
	 */
	async UpdateSegments(
		docID: string,
		request: UpdateSegmentsRequest
	): Promise<ApiResponse<UpdateSegmentsResponse>> {
		return this.api.Put<UpdateSegmentsResponse>(`/kb/documents/${docID}/segments`, request)
	}

	/**
	 * Remove segments by IDs
	 */
	async RemoveSegments(segmentIDs: string[]): Promise<ApiResponse<RemoveSegmentsResponse>> {
		const queryParams = new URLSearchParams({
			segment_ids: segmentIDs.join(',')
		})
		return this.api.Delete<RemoveSegmentsResponse>(`/kb/segments?${queryParams.toString()}`)
	}

	/**
	 * Remove all segments of a document
	 */
	async RemoveSegmentsByDocID(docID: string): Promise<ApiResponse<RemoveSegmentsByDocIDResponse>> {
		return this.api.Delete<RemoveSegmentsByDocIDResponse>(`/kb/documents/${docID}/segments`)
	}

	/**
	 * Update weights for segments
	 */
	async UpdateWeight(request: UpdateWeightRequest): Promise<ApiResponse<UpdateWeightResponse>> {
		return this.api.Put<UpdateWeightResponse>('/kb/segments/weight', request)
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
