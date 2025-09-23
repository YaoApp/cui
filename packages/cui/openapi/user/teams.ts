import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { UserTeam, UserTeamDetail, CreateTeamRequest, UpdateTeamRequest, TeamListResponse } from './types'

/**
 * User Team Management API
 * Provides CRUD operations for user teams
 */
export class UserTeams {
	constructor(private api: OpenAPI) {}

	// ===== Team CRUD =====

	/**
	 * Get user teams with pagination and filtering
	 * @param options Query parameters for pagination and filtering
	 */
	async GetTeams(options?: {
		page?: number
		pagesize?: number
		status?: string
		name?: string
	}): Promise<ApiResponse<TeamListResponse>> {
		const params = new URLSearchParams()
		if (options?.page) params.append('page', options.page.toString())
		if (options?.pagesize) params.append('pagesize', options.pagesize.toString())
		if (options?.status) params.append('status', options.status)
		if (options?.name) params.append('name', options.name)

		const queryString = params.toString()
		const url = queryString ? `/user/teams?${queryString}` : '/user/teams'

		return this.api.Get<TeamListResponse>(url)
	}

	/**
	 * Get user team details by team_id
	 * @param teamId Team ID to retrieve
	 */
	async GetTeam(teamId: string): Promise<ApiResponse<UserTeamDetail>> {
		return this.api.Get<UserTeamDetail>(`/user/teams/${teamId}`)
	}

	/**
	 * Create a new user team
	 * @param team Team data to create
	 */
	async CreateTeam(team: CreateTeamRequest): Promise<ApiResponse<UserTeam>> {
		return this.api.Post<UserTeam>('/user/teams', team)
	}

	/**
	 * Update user team by team_id
	 * @param teamId Team ID to update
	 * @param team Updated team data
	 */
	async UpdateTeam(teamId: string, team: UpdateTeamRequest): Promise<ApiResponse<UserTeam>> {
		return this.api.Put<UserTeam>(`/user/teams/${teamId}`, team)
	}

	/**
	 * Delete user team by team_id
	 * @param teamId Team ID to delete
	 */
	async DeleteTeam(teamId: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Delete<{ message: string }>(`/user/teams/${teamId}`)
	}

	// TODO: Member Management APIs - To be implemented
	// TODO: Invitation Management APIs - To be implemented
}
