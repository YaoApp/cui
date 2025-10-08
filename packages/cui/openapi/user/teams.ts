import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import {
	UserTeam,
	UserTeamDetail,
	CreateTeamRequest,
	UpdateTeamRequest,
	TeamListResponse,
	TeamMember,
	TeamMemberDetail,
	CreateMemberRequest,
	UpdateMemberRequest,
	MemberListResponse,
	TeamInvitation,
	TeamInvitationDetail,
	CreateInvitationRequest,
	InvitationListResponse,
	TeamConfig
} from './types'

/**
 * User Team Management API
 * Provides CRUD operations for user teams
 */
export class UserTeams {
	constructor(private api: OpenAPI) {}

	// ===== Team Configuration =====

	/**
	 * Get team configuration (requires authentication)
	 * @param locale Optional locale for localized configuration (defaults to "en")
	 */
	async GetConfig(locale?: string): Promise<ApiResponse<TeamConfig>> {
		const params = new URLSearchParams()
		if (locale) params.append('locale', locale)

		const queryString = params.toString()
		const url = queryString ? `/user/teams/config?${queryString}` : '/user/teams/config'

		return this.api.Get<TeamConfig>(url)
	}

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

	// ===== Team Member Management =====

	/**
	 * Get team members with pagination and filtering
	 * @param teamId Team ID to get members from
	 * @param options Query parameters for pagination and filtering
	 */
	async GetMembers(
		teamId: string,
		options?: {
			page?: number
			pagesize?: number
			status?: string
		}
	): Promise<ApiResponse<MemberListResponse>> {
		const params = new URLSearchParams()
		if (options?.page) params.append('page', options.page.toString())
		if (options?.pagesize) params.append('pagesize', options.pagesize.toString())
		if (options?.status) params.append('status', options.status)

		const queryString = params.toString()
		const url = queryString ? `/user/teams/${teamId}/members?${queryString}` : `/user/teams/${teamId}/members`

		return this.api.Get<MemberListResponse>(url)
	}

	/**
	 * Get team member details by member_id
	 * @param teamId Team ID
	 * @param memberId Member ID to retrieve
	 */
	async GetMember(teamId: string, memberId: string): Promise<ApiResponse<TeamMemberDetail>> {
		return this.api.Get<TeamMemberDetail>(`/user/teams/${teamId}/members/${memberId}`)
	}

	/**
	 * Add a new team member directly (without invitation)
	 * @param teamId Team ID to add member to
	 * @param member Member data to create
	 */
	async CreateMember(teamId: string, member: CreateMemberRequest): Promise<ApiResponse<TeamMember>> {
		return this.api.Post<TeamMember>(`/user/teams/${teamId}/members`, member)
	}

	/**
	 * Update team member by member_id
	 * @param teamId Team ID
	 * @param memberId Member ID to update
	 * @param member Updated member data
	 */
	async UpdateMember(
		teamId: string,
		memberId: string,
		member: UpdateMemberRequest
	): Promise<ApiResponse<TeamMember>> {
		return this.api.Put<TeamMember>(`/user/teams/${teamId}/members/${memberId}`, member)
	}

	/**
	 * Remove team member by member_id
	 * @param teamId Team ID
	 * @param memberId Member ID to delete
	 */
	async DeleteMember(teamId: string, memberId: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Delete<{ message: string }>(`/user/teams/${teamId}/members/${memberId}`)
	}

	// ===== Team Invitation Management =====

	/**
	 * Get team invitations with pagination and filtering
	 * @param teamId Team ID to get invitations from
	 * @param options Query parameters for pagination and filtering
	 */
	async GetInvitations(
		teamId: string,
		options?: {
			page?: number
			pagesize?: number
			status?: string
		}
	): Promise<ApiResponse<InvitationListResponse>> {
		const params = new URLSearchParams()
		if (options?.page) params.append('page', options.page.toString())
		if (options?.pagesize) params.append('pagesize', options.pagesize.toString())
		if (options?.status) params.append('status', options.status)

		const queryString = params.toString()
		const url = queryString
			? `/user/teams/${teamId}/invitations?${queryString}`
			: `/user/teams/${teamId}/invitations`

		return this.api.Get<InvitationListResponse>(url)
	}

	/**
	 * Get team invitation details by invitation_id
	 * @param teamId Team ID
	 * @param invitationId Invitation ID to retrieve
	 */
	async GetInvitation(teamId: string, invitationId: string): Promise<ApiResponse<TeamInvitationDetail>> {
		return this.api.Get<TeamInvitationDetail>(`/user/teams/${teamId}/invitations/${invitationId}`)
	}

	/**
	 * Send a new team invitation
	 * @param teamId Team ID to send invitation for
	 * @param invitation Invitation data to create
	 */
	async CreateInvitation(
		teamId: string,
		invitation: CreateInvitationRequest
	): Promise<ApiResponse<TeamInvitation>> {
		return this.api.Post<TeamInvitation>(`/user/teams/${teamId}/invitations`, invitation)
	}

	/**
	 * Resend team invitation by invitation_id
	 * @param teamId Team ID
	 * @param invitationId Invitation ID to resend
	 */
	async ResendInvitation(teamId: string, invitationId: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Put<{ message: string }>(`/user/teams/${teamId}/invitations/${invitationId}/resend`, {})
	}

	/**
	 * Cancel team invitation by invitation_id
	 * @param teamId Team ID
	 * @param invitationId Invitation ID to cancel
	 */
	async DeleteInvitation(teamId: string, invitationId: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Delete<{ message: string }>(`/user/teams/${teamId}/invitations/${invitationId}`)
	}
}
