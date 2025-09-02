import OpenAPI from '../openapi'
import { ApiResponse } from '../types'
import {
	Collection,
	CreateCollectionRequest,
	CreateCollectionResponse,
	RemoveCollectionResponse,
	CollectionExistsResponse,
	GetCollectionsRequest,
	ListCollectionsRequest,
	ListCollectionsResponse,
	UpdateCollectionMetadataRequest,
	UpdateCollectionMetadataResponse,
	Provider,
	ProviderSchema,
	GetProvidersRequest,
	GetProviderSchemaRequest,
	AddFileRequest,
	AddFileResponse,
	AddTextRequest,
	AddTextResponse,
	AddURLRequest,
	AddURLResponse,
	JobOptions,
	AsyncOperationResponse,
	ListDocumentsRequest,
	ListDocumentsResponse,
	GetDocumentRequest,
	GetDocumentResponse,
	RemoveDocsResponse,
	Segment,
	GetSegmentResponse,
	GetSegmentParentsRequest,
	GetSegmentParentsResponse,
	ListSegmentsRequest,
	ListSegmentsResponse,
	ScrollSegmentsRequest,
	ScrollSegmentsResponse,
	UpdateSegmentsRequest,
	UpdateSegmentsResponse,
	RemoveSegmentsResponse,
	RemoveSegmentsByDocIDResponse,
	SegmentGraphResponse,
	SegmentEntitiesResponse,
	SegmentRelationshipsResponse,
	ExtractSegmentGraphRequest,
	ExtractSegmentGraphResponse,
	UpdateWeightRequest,
	UpdateWeightResponse,
	UpdateWeightsRequest,
	UpdateWeightsResponse,
	UpdateScoresRequest,
	UpdateScoresResponse,
	ScrollVotesRequest,
	VoteScrollResult,
	GetVoteResponse,
	AddVotesRequest,
	AddVotesResponse,
	RemoveVotesResponse,
	ScrollHitsRequest,
	HitScrollResult,
	GetHitResponse,
	AddHitsRequest,
	AddHitsResponse,
	RemoveHitsResponse
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
	 * List collections with pagination
	 */
	async ListCollections(request?: ListCollectionsRequest): Promise<ApiResponse<ListCollectionsResponse>> {
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
			if (request.status) {
				params.status = request.status
			}
			if (request.system !== undefined) {
				params.system = request.system.toString()
			}
			if (request.embedding_provider_id) {
				params.embedding_provider_id = request.embedding_provider_id
			}
			if (request.sort) {
				params.sort = request.sort
			}
		}

		return this.api.Get<ListCollectionsResponse>('/kb/collections', params)
	}

	/**
	 * Get collections list (deprecated - use ListCollections instead)
	 * @deprecated Use ListCollections for better pagination support
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
	 * Add file to collection synchronously
	 */
	async AddFile(collectionID: string, request: AddFileRequest): Promise<ApiResponse<AddFileResponse>> {
		return this.api.Post<AddFileResponse>(`/kb/collections/${collectionID}/documents/file`, request)
	}

	/**
	 * Add text to collection synchronously
	 */
	async AddText(collectionID: string, request: AddTextRequest): Promise<ApiResponse<AddTextResponse>> {
		return this.api.Post<AddTextResponse>(`/kb/collections/${collectionID}/documents/text`, request)
	}

	/**
	 * Add URL to collection synchronously
	 */
	async AddURL(collectionID: string, request: AddURLRequest): Promise<ApiResponse<AddURLResponse>> {
		return this.api.Post<AddURLResponse>(`/kb/collections/${collectionID}/documents/url`, request)
	}

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

	/**
	 * Remove documents by IDs
	 */
	async RemoveDocs(documentIDs: string[]): Promise<ApiResponse<RemoveDocsResponse>> {
		const queryParams = new URLSearchParams({
			document_ids: documentIDs.join(',')
		})
		return this.api.Delete<RemoveDocsResponse>(`/kb/documents?${queryParams.toString()}`)
	}

	// ===== Segment Management =====

	/**
	 * Get a single segment by ID
	 */
	async GetSegment(docID: string, segmentID: string): Promise<ApiResponse<GetSegmentResponse>> {
		return this.api.Get<GetSegmentResponse>(`/kb/documents/${docID}/segments/${segmentID}`)
	}

	/**
	 * Get parent segments for a specific segment
	 */
	async GetSegmentParents(
		docID: string,
		segmentID: string,
		request?: GetSegmentParentsRequest
	): Promise<ApiResponse<GetSegmentParentsResponse>> {
		const params: Record<string, string> = {}

		if (request) {
			if (request.include_metadata !== undefined) {
				params.include_metadata = request.include_metadata.toString()
			}
		}

		return this.api.Get<GetSegmentParentsResponse>(
			`/kb/documents/${docID}/segments/${segmentID}/parents`,
			params
		)
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
	async RemoveSegments(docID: string, segmentIDs: string[]): Promise<ApiResponse<RemoveSegmentsResponse>> {
		const queryParams = new URLSearchParams({
			segment_ids: segmentIDs.join(',')
		})
		return this.api.Delete<RemoveSegmentsResponse>(`/kb/documents/${docID}/segments?${queryParams.toString()}`)
	}

	/**
	 * Remove all segments of a document
	 */
	async RemoveSegmentsByDocID(docID: string): Promise<ApiResponse<RemoveSegmentsByDocIDResponse>> {
		return this.api.Delete<RemoveSegmentsByDocIDResponse>(`/kb/documents/${docID}/segments`)
	}

	// ===== Segment Graph Management =====

	/**
	 * Get segment graph information (entities and relationships)
	 */
	async GetSegmentGraph(
		docID: string,
		segmentID: string,
		options?: {
			include_entities?: boolean
			include_relationships?: boolean
		}
	): Promise<ApiResponse<SegmentGraphResponse>> {
		const params: Record<string, string> = {}

		if (options?.include_entities !== undefined) {
			params.include_entities = options.include_entities.toString()
		}
		if (options?.include_relationships !== undefined) {
			params.include_relationships = options.include_relationships.toString()
		}

		return this.api.Get<SegmentGraphResponse>(`/kb/documents/${docID}/segments/${segmentID}/graph`, params)
	}

	/**
	 * Get segment entities
	 */
	async GetSegmentEntities(docID: string, segmentID: string): Promise<ApiResponse<SegmentEntitiesResponse>> {
		return this.api.Get<SegmentEntitiesResponse>(`/kb/documents/${docID}/segments/${segmentID}/entities`)
	}

	/**
	 * Get segment relationships
	 */
	async GetSegmentRelationships(
		docID: string,
		segmentID: string
	): Promise<ApiResponse<SegmentRelationshipsResponse>> {
		return this.api.Get<SegmentRelationshipsResponse>(
			`/kb/documents/${docID}/segments/${segmentID}/relationships`
		)
	}

	/**
	 * Extract segment graph (synchronous) - re-extract entities and relationships
	 */
	async ExtractSegmentGraph(
		docID: string,
		segmentID: string,
		options?: ExtractSegmentGraphRequest
	): Promise<ApiResponse<ExtractSegmentGraphResponse>> {
		return this.api.Post<ExtractSegmentGraphResponse>(
			`/kb/documents/${docID}/segments/${segmentID}/extract`,
			options || {}
		)
	}

	/**
	 * Extract segment graph (asynchronous) - re-extract entities and relationships
	 */
	async ExtractSegmentGraphAsync(
		docID: string,
		segmentID: string,
		options?: ExtractSegmentGraphRequest
	): Promise<ApiResponse<AsyncOperationResponse>> {
		return this.api.Post<AsyncOperationResponse>(
			`/kb/documents/${docID}/segments/${segmentID}/extract/async`,
			options || {}
		)
	}

	/**
	 * Update weights for segments (single segment weight update)
	 * @deprecated Use UpdateWeights for batch updates
	 */
	async UpdateWeight(request: UpdateWeightRequest): Promise<ApiResponse<UpdateWeightResponse>> {
		return this.api.Put<UpdateWeightResponse>('/kb/segments/weight', request)
	}

	/**
	 * Update weights for multiple segments in batch
	 */
	async UpdateWeights(docID: string, request: UpdateWeightsRequest): Promise<ApiResponse<UpdateWeightsResponse>> {
		return this.api.Put<UpdateWeightsResponse>(`/kb/documents/${docID}/segments/weights`, request)
	}

	/**
	 * Update scores for multiple segments in batch
	 */
	async UpdateScores(docID: string, request: UpdateScoresRequest): Promise<ApiResponse<UpdateScoresResponse>> {
		return this.api.Put<UpdateScoresResponse>(`/kb/documents/${docID}/segments/scores`, request)
	}

	// ===== Vote Management =====

	/**
	 * Scroll votes for a specific segment with pagination
	 */
	async ScrollVotes(
		docID: string,
		segmentID: string,
		request?: ScrollVotesRequest
	): Promise<ApiResponse<VoteScrollResult>> {
		const params: Record<string, string> = {}

		if (request) {
			if (request.limit !== undefined) {
				params.limit = request.limit.toString()
			}
			if (request.scroll_id) {
				params.scroll_id = request.scroll_id
			}
			if (request.vote_type) {
				params.vote_type = request.vote_type
			}
			if (request.source) {
				params.source = request.source
			}
			if (request.scenario) {
				params.scenario = request.scenario
			}
		}

		return this.api.Get<VoteScrollResult>(`/kb/documents/${docID}/segments/${segmentID}/votes`, params)
	}

	/**
	 * Get a specific vote by ID
	 */
	async GetVote(docID: string, segmentID: string, voteID: string): Promise<ApiResponse<GetVoteResponse>> {
		return this.api.Get<GetVoteResponse>(`/kb/documents/${docID}/segments/${segmentID}/votes/${voteID}`)
	}

	/**
	 * Add votes to a segment
	 */
	async AddVotes(
		docID: string,
		segmentID: string,
		request: AddVotesRequest
	): Promise<ApiResponse<AddVotesResponse>> {
		return this.api.Post<AddVotesResponse>(`/kb/documents/${docID}/segments/${segmentID}/votes`, request)
	}

	/**
	 * Remove votes from a segment
	 */
	async RemoveVotes(
		docID: string,
		segmentID: string,
		voteIDs: string[]
	): Promise<ApiResponse<RemoveVotesResponse>> {
		const queryParams = new URLSearchParams({
			vote_ids: voteIDs.join(',')
		})
		return this.api.Delete<RemoveVotesResponse>(
			`/kb/documents/${docID}/segments/${segmentID}/votes?${queryParams.toString()}`
		)
	}

	// ===== Hit Management =====

	/**
	 * Scroll hits for a specific segment with pagination
	 */
	async ScrollHits(
		docID: string,
		segmentID: string,
		request?: ScrollHitsRequest
	): Promise<ApiResponse<HitScrollResult>> {
		const params: Record<string, string> = {}

		if (request) {
			if (request.limit !== undefined) {
				params.limit = request.limit.toString()
			}
			if (request.scroll_id) {
				params.scroll_id = request.scroll_id
			}
			if (request.source) {
				params.source = request.source
			}
			if (request.scenario) {
				params.scenario = request.scenario
			}
		}

		return this.api.Get<HitScrollResult>(`/kb/documents/${docID}/segments/${segmentID}/hits`, params)
	}

	/**
	 * Get a specific hit by ID
	 */
	async GetHit(docID: string, segmentID: string, hitID: string): Promise<ApiResponse<GetHitResponse>> {
		return this.api.Get<GetHitResponse>(`/kb/documents/${docID}/segments/${segmentID}/hits/${hitID}`)
	}

	/**
	 * Add hits to a segment
	 */
	async AddHits(docID: string, segmentID: string, request: AddHitsRequest): Promise<ApiResponse<AddHitsResponse>> {
		return this.api.Post<AddHitsResponse>(`/kb/documents/${docID}/segments/${segmentID}/hits`, request)
	}

	/**
	 * Remove hits from a segment
	 */
	async RemoveHits(docID: string, segmentID: string, hitIDs: string[]): Promise<ApiResponse<RemoveHitsResponse>> {
		const queryParams = new URLSearchParams({
			hit_ids: hitIDs.join(',')
		})
		return this.api.Delete<RemoveHitsResponse>(
			`/kb/documents/${docID}/segments/${segmentID}/hits?${queryParams.toString()}`
		)
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
