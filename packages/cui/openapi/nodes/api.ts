import { OpenAPI } from '../openapi'
import type { ApiResponse } from '../types'
import type { NodeInfo } from '../../pages/workspace/types'

export class NodesAPI {
	constructor(private api: OpenAPI) {}

	async List(): Promise<ApiResponse<NodeInfo[]>> {
		return this.api.Get<NodeInfo[]>('/nodes')
	}

	async Get(id: string): Promise<ApiResponse<NodeInfo>> {
		return this.api.Get<NodeInfo>(`/nodes/${id}`)
	}
}
