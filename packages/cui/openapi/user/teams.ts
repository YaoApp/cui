import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { BuildURL } from '../lib/utils'
import { UserAuth } from './auth'
import {
	UserTeam,
	UserTeamDetail,
	CreateTeamRequest,
	UpdateTeamRequest,
	SelectTeamRequest,
	SelectTeamResponse,
	TeamListResponse,
	TeamMember,
	TeamMemberDetail,
	CreateRobotMemberRequest,
	UpdateMemberRequest,
	UpdateMemberProfileRequest,
	UpdateRobotMemberRequest,
	MemberListOptions,
	MemberListResponse,
	TeamInvitation,
	TeamInvitationDetail,
	CreateInvitationRequest,
	InvitationListResponse,
	TeamConfig,
	PublicInvitationResponse,
	AcceptInvitationRequest
} from './types'

/**
 * User Team Management API
 * Provides CRUD operations for user teams
 */
export class UserTeams {
	constructor(private api: OpenAPI, private auth: UserAuth) {}

	// ===== Team Configuration =====

	/**
	 * Get team configuration (requires authentication)
	 * @param locale Optional locale for localized configuration (defaults to "en")
	 */
	async GetConfig(locale?: string): Promise<ApiResponse<TeamConfig>> {
		const params = new URLSearchParams()
		if (locale) params.append('locale', locale)

		return this.api.Get<TeamConfig>(BuildURL('/user/teams/config', params))
	}

	// ===== Team CRUD =====

	/**
	 * Get all user teams (all teams where the user is a member)
	 * Returns a simple list with role information for each team
	 */
	async GetTeams(): Promise<ApiResponse<TeamListResponse>> {
		return this.api.Get<TeamListResponse>('/user/teams')
	}

	/**
	 * Get current user's team
	 * Returns 404 if the user doesn't have a team
	 */
	async GetCurrentTeam(): Promise<ApiResponse<UserTeamDetail>> {
		return this.api.Get<UserTeamDetail>('/user/teams/current')
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

	/**
	 * Select a team and get new tokens with team_id embedded
	 * This endpoint requires a temporary token with team_selection scope
	 * Returns new access_token, id_token, and refresh_token with team_id claim
	 * The ID token is automatically validated and user information is included in the response
	 * @param request Team selection request containing team_id
	 */
	async SelectTeam(request: SelectTeamRequest): Promise<ApiResponse<SelectTeamResponse>> {
		const response = await this.api.Post<SelectTeamResponse>('/user/teams/select', request)
		if (this.api.IsError(response)) {
			return response
		}

		// Validate ID Token and extract user information (similar to OAuthCallback)
		const userInfo = await this.auth.ValidateIDToken(response.data?.id_token || '')

		// Return response with user info embedded
		return {
			status: response.status,
			headers: response.headers,
			data: {
				...response.data!,
				user: userInfo
			}
		}
	}

	// ===== Team Member Management =====

	/**
	 * Get team members with pagination, filtering, sorting, and field selection
	 * @param teamId Team ID to get members from
	 * @param options Query options for listing members
	 */
	async GetMembers(teamId: string, options?: MemberListOptions): Promise<ApiResponse<MemberListResponse>> {
		const params: Record<string, string> = {}

		if (options?.page) params.page = options.page.toString()
		if (options?.pagesize) params.pagesize = options.pagesize.toString()
		if (options?.status) params.status = options.status
		if (options?.member_type) params.member_type = options.member_type
		if (options?.role_id) params.role_id = options.role_id
		if (options?.email) params.email = options.email
		if (options?.display_name) params.display_name = options.display_name
		if (options?.order) params.order = options.order
		if (options?.fields && options.fields.length > 0) {
			params.fields = options.fields.join(',')
		}
		if (options?.locale) params.locale = options.locale

		return this.api.Get<MemberListResponse>(`/user/teams/${teamId}/members`, params)
	}

	/**
	 * Check if robot email exists globally
	 * @param teamId Team ID (for access control)
	 * @param robotEmail Robot email to check
	 */
	async CheckRobotEmail(
		teamId: string,
		robotEmail: string
	): Promise<ApiResponse<{ exists: boolean; robot_email: string }>> {
		const query: Record<string, string> = {
			robot_email: robotEmail
		}
		return this.api.Get<{ exists: boolean; robot_email: string }>(
			`/user/teams/${teamId}/members/check-robot-email`,
			query
		)
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
	 * Create a new robot member for the team
	 * @param teamId Team ID to add robot member to
	 * @param robot Robot member data to create
	 */
	async CreateRobotMember(
		teamId: string,
		robot: CreateRobotMemberRequest
	): Promise<ApiResponse<{ member_id: number }>> {
		return this.api.Post<{ member_id: number }>(`/user/teams/${teamId}/members/robots`, robot)
	}

	/**
	 * Update team member by member_id (admin operation)
	 * Updates management fields like role_id and status
	 * @param teamId Team ID
	 * @param memberId Member ID to update
	 * @param member Updated member data
	 */
	async UpdateMember(
		teamId: string,
		memberId: string,
		member: UpdateMemberRequest
	): Promise<ApiResponse<{ message: string }>> {
		return this.api.Put<{ message: string }>(`/user/teams/${teamId}/members/${memberId}`, member)
	}

	/**
	 * Get member profile (self-read only)
	 * Allows members to read their own profile fields (display_name, bio, avatar, email)
	 * @param teamId Team ID
	 * @param userId User ID (must be the authenticated user's ID)
	 */
	async GetMemberProfile(
		teamId: string,
		userId: string
	): Promise<ApiResponse<UpdateMemberProfileRequest & { user_id: string; team_id: string }>> {
		return this.api.Get<UpdateMemberProfileRequest & { user_id: string; team_id: string }>(
			`/user/teams/${teamId}/members/${userId}/profile`
		)
	}

	/**
	 * Update member profile (self-update only)
	 * Allows members to update their own profile fields (display_name, bio, avatar, email)
	 * @param teamId Team ID
	 * @param userId User ID (must be the authenticated user's ID)
	 * @param profile Updated profile data
	 */
	async UpdateMemberProfile(
		teamId: string,
		userId: string,
		profile: UpdateMemberProfileRequest
	): Promise<ApiResponse<{ user_id: string; message: string }>> {
		return this.api.Put<{ user_id: string; message: string }>(
			`/user/teams/${teamId}/members/${userId}/profile`,
			profile
		)
	}

	/**
	 * Update robot member by member_id
	 * @param teamId Team ID
	 * @param memberId Member ID to update
	 * @param robot Updated robot member data
	 */
	async UpdateRobotMember(
		teamId: string,
		memberId: string,
		robot: UpdateRobotMemberRequest
	): Promise<ApiResponse<{ message: string }>> {
		return this.api.Put<{ message: string }>(`/user/teams/${teamId}/members/robots/${memberId}`, robot)
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
	 * Get public invitation details (no authentication required)
	 * This is for invitation recipients to view invitation details
	 * @param invitationId Invitation ID to retrieve
	 * @param locale Optional locale for localized role labels (e.g., "zh-CN", "en")
	 */
	async GetPublicInvitation(invitationId: string, locale?: string): Promise<ApiResponse<PublicInvitationResponse>> {
		const query: Record<string, string> = {}
		if (locale) {
			query.locale = locale
		}

		return this.api.Get<PublicInvitationResponse>(`/user/teams/invitations/${invitationId}`, query)
	}

	/**
	 * Get team invitations with pagination and filtering (requires authentication)
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

		return this.api.Get<InvitationListResponse>(BuildURL(`/user/teams/${teamId}/invitations`, params))
	}

	/**
	 * Get team invitation details by invitation_id (requires authentication, for team admins)
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
	 * @param locale Optional locale for email template (defaults to "en")
	 */
	async ResendInvitation(
		teamId: string,
		invitationId: string,
		locale?: string
	): Promise<ApiResponse<{ message: string }>> {
		const payload: Record<string, string> = {}
		if (locale) payload.locale = locale

		return this.api.Put<{ message: string }>(
			`/user/teams/${teamId}/invitations/${invitationId}/resend`,
			payload
		)
	}

	/**
	 * Cancel team invitation by invitation_id
	 * @param teamId Team ID
	 * @param invitationId Invitation ID to cancel
	 */
	async DeleteInvitation(teamId: string, invitationId: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Delete<{ message: string }>(`/user/teams/${teamId}/invitations/${invitationId}`)
	}

	/**
	 * Accept team invitation and login to the team
	 * This endpoint accepts an invitation and automatically logs the user into the team
	 * Returns new access_token, id_token, and refresh_token with team_id claim (same as SelectTeam)
	 * The ID token is automatically validated and user information is included in the response
	 * @param invitationId Invitation ID to accept
	 * @param request Request containing the invitation token
	 */
	async AcceptInvitation(
		invitationId: string,
		request: AcceptInvitationRequest
	): Promise<ApiResponse<SelectTeamResponse>> {
		const response = await this.api.Post<SelectTeamResponse>(
			`/user/teams/invitations/${invitationId}/accept`,
			request
		)
		if (this.api.IsError(response)) {
			return response
		}

		// Validate ID Token and extract user information (similar to SelectTeam)
		const userInfo = await this.auth.ValidateIDToken(response.data?.id_token || '')

		// Return response with user info embedded
		return {
			status: response.status,
			headers: response.headers,
			data: {
				...response.data!,
				user: userInfo
			}
		}
	}
}
