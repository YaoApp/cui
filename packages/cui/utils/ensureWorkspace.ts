import { WorkspaceAPI } from '@/openapi/workspace'
import { NodesAPI } from '@/openapi/nodes'

/**
 * Ensure at least one workspace exists. If none, auto-create a default
 * workspace on the first online node.
 *
 * Name matches backend `defaultWorkspaceName` in sandbox/v2/manager.go.
 *
 * @returns true if a workspace already exists or was created successfully.
 */
export async function ensureWorkspace(is_cn: boolean): Promise<boolean> {
	const api = window.$app?.openapi
	if (!api) return false

	const wsApi = new WorkspaceAPI(api)
	const wsResp = await wsApi.List()
	if (api.IsError(wsResp)) return false

	const workspaces = api.GetData(wsResp) || []
	if (workspaces.length > 0) return true

	const nodesApi = new NodesAPI(api)
	const nodesResp = await nodesApi.List()
	if (api.IsError(nodesResp)) return false

	const nodes = api.GetData(nodesResp) || []
	const onlineNode = nodes.find((n: any) => n.status === 'online')
	if (!onlineNode) return false

	const createResp = await wsApi.Create({
		name: is_cn ? '默认工作区' : 'Default Workspace',
		node: onlineNode.tai_id
	})
	return !api.IsError(createResp)
}
