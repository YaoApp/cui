import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { UserTeam } from './types'

/**
 * User Team Management API
 */
export class UserTeams {
	constructor(private api: OpenAPI) {}

	// ===== Team CRUD =====

	/**
	 * Get user teams
	 */
	async GetTeams(): Promise<ApiResponse<UserTeam[]>> {
		return this.api.Get<UserTeam[]>('/user/teams')
	}

	/**
	 * Get user team details
	 */
	async GetTeam(teamId: string): Promise<ApiResponse<UserTeam>> {
		return this.api.Get<UserTeam>(`/user/teams/${teamId}`)
	}

	/**
	 * Create user team
	 */
	async CreateTeam(team: Partial<UserTeam>): Promise<ApiResponse<UserTeam>> {
		return this.api.Post<UserTeam>('/user/teams', team)
	}

	/**
	 * Update user team
	 */
	async UpdateTeam(teamId: string, team: Partial<UserTeam>): Promise<ApiResponse<UserTeam>> {
		return this.api.Put<UserTeam>(`/user/teams/${teamId}`, team)
	}

	/**
	 * Delete user team
	 */
	async DeleteTeam(teamId: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Delete<{ message: string }>(`/user/teams/${teamId}`)
	}

	// ===== Member Management =====

	/**
	 * Get team members
	 */
	async GetTeamMembers(teamId: string): Promise<ApiResponse<any[]>> {
		return this.api.Get<any[]>(`/user/teams/${teamId}/members`)
	}

	/**
	 * Get team member details
	 */
	async GetTeamMember(teamId: string, memberId: string): Promise<ApiResponse<any>> {
		return this.api.Get<any>(`/user/teams/${teamId}/members/${memberId}`)
	}

	/**
	 * Add member directly (for bots/system)
	 */
	async AddMemberDirect(teamId: string, member: any): Promise<ApiResponse<any>> {
		return this.api.Post<any>(`/user/teams/${teamId}/members/direct`, member)
	}

	/**
	 * Update team member
	 */
	async UpdateTeamMember(teamId: string, memberId: string, member: any): Promise<ApiResponse<any>> {
		return this.api.Put<any>(`/user/teams/${teamId}/members/${memberId}`, member)
	}

	/**
	 * Remove team member
	 */
	async RemoveTeamMember(teamId: string, memberId: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Delete<{ message: string }>(`/user/teams/${teamId}/members/${memberId}`)
	}

	// ===== Invitation Management =====

	/**
	 * Send team invitation
	 */
	async SendInvitation(teamId: string, invitation: {
		email: string
		role?: string
		message?: string
	}): Promise<ApiResponse<{ invitation_id: string; message: string }>> {
		return this.api.Post<{ invitation_id: string; message: string }>(`/user/teams/${teamId}/invitations`, invitation)
	}

	/**
	 * Get team invitations
	 */
	async GetInvitations(teamId: string): Promise<ApiResponse<any[]>> {
		return this.api.Get<any[]>(`/user/teams/${teamId}/invitations`)
	}

	/**
	 * Get invitation details
	 */
	async GetInvitation(teamId: string, invitationId: string): Promise<ApiResponse<any>> {
		return this.api.Get<any>(`/user/teams/${teamId}/invitations/${invitationId}`)
	}

	/**
	 * Resend invitation
	 */
	async ResendInvitation(teamId: string, invitationId: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Put<{ message: string }>(`/user/teams/${teamId}/invitations/${invitationId}/resend`, {})
	}

	/**
	 * Cancel invitation
	 */
	async CancelInvitation(teamId: string, invitationId: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Delete<{ message: string }>(`/user/teams/${teamId}/invitations/${invitationId}`)
	}

	// ===== Invitation Response (Cross-module) =====

	/**
	 * Get invitation info by token (public)
	 */
	async GetInvitationByToken(token: string): Promise<ApiResponse<any>> {
		return this.api.Get<any>(`/user/invitations/${token}`)
	}

	/**
	 * Accept invitation (requires login)
	 */
	async AcceptInvitation(token: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>(`/user/invitations/${token}/accept`, {})
	}

	/**
	 * Decline invitation (public)
	 */
	async DeclineInvitation(token: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>(`/user/invitations/${token}/decline`, {})
	}
}
