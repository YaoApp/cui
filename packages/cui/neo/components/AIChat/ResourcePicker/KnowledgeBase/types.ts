// Files
export type Files = {
	name: string // File Name
	file_id: string // File ID
	public: boolean // is public
	status: 'uploaded' | 'indexing' | 'indexed' | 'upload_failed' | 'index_failed'
	content_type: string // Content Type
	bytes: number // File Size in Bytes
	created_at: string // Created At
	updated_at: string // Updated At
}

// Collections
export type Collections = {
	id: string
	cover: string // Cover Image URL
	name: string // Collection Name
	description: string // Collection Description
	total: number // Total number of files in collection
}
