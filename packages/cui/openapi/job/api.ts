import OpenAPI from '../openapi'
import { ApiResponse } from '../types'
import {
	Job,
	Category,
	Execution,
	Log,
	ListJobsRequest,
	ListJobsResponse,
	ListExecutionsRequest,
	ListExecutionsResponse,
	ListLogsRequest,
	ListLogsResponse,
	ListCategoriesRequest,
	ListCategoriesResponse,
	JobProgressResponse,
	ExecutionProgressResponse,
	JobStatsResponse,
	StopJobRequest,
	StopJobResponse,
	StopExecutionRequest,
	StopExecutionResponse,
	JobError
} from './types'

/**
 * Job Management API
 */
export class JobAPI {
	private api: OpenAPI

	constructor(api: OpenAPI) {
		this.api = api
	}

	// ===== Job Management =====

	/**
	 * List jobs with pagination and filtering
	 */
	async ListJobs(request?: ListJobsRequest): Promise<ApiResponse<ListJobsResponse>> {
		const params: Record<string, string> = {}

		if (request) {
			if (request.page !== undefined) {
				params.page = request.page.toString()
			}
			if (request.pagesize !== undefined) {
				params.pagesize = request.pagesize.toString()
			}
			if (request.status) {
				params.status = request.status
			}
			if (request.category_id) {
				params.category_id = request.category_id
			}
			if (request.enabled !== undefined) {
				params.enabled = request.enabled.toString()
			}
			if (request.system !== undefined) {
				params.system = request.system.toString()
			}
			if (request.keywords) {
				params.keywords = request.keywords
			}
			if (request.sort) {
				params.sort = request.sort
			}
		}

		return this.api.Get<ListJobsResponse>('/job/jobs', params)
	}

	/**
	 * Get job by ID
	 */
	async GetJob(jobID: string): Promise<ApiResponse<Job>> {
		return this.api.Get<Job>(`/job/jobs/${jobID}`)
	}

	/**
	 * Stop a running job
	 */
	async StopJob(jobID: string): Promise<ApiResponse<StopJobResponse>> {
		return this.api.Post<StopJobResponse>(`/job/jobs/${jobID}/stop`, {})
	}

	/**
	 * Get job progress information
	 */
	async GetJobProgress(jobID: string): Promise<ApiResponse<JobProgressResponse>> {
		return this.api.Get<JobProgressResponse>(`/job/jobs/${jobID}/progress`)
	}

	/**
	 * Get system statistics
	 */
	async GetStats(): Promise<ApiResponse<JobStatsResponse>> {
		return this.api.Get<JobStatsResponse>('/job/stats')
	}

	// ===== Execution Management =====

	/**
	 * List executions for a specific job
	 */
	async ListExecutions(request: ListExecutionsRequest): Promise<ApiResponse<ListExecutionsResponse>> {
		const params: Record<string, string> = {}

		if (request.page !== undefined) {
			params.page = request.page.toString()
		}
		if (request.pagesize !== undefined) {
			params.pagesize = request.pagesize.toString()
		}
		if (request.status) {
			params.status = request.status
		}

		return this.api.Get<ListExecutionsResponse>(`/job/jobs/${request.job_id}/executions`, params)
	}

	/**
	 * Get execution by ID
	 */
	async GetExecution(executionID: string): Promise<ApiResponse<Execution>> {
		return this.api.Get<Execution>(`/job/executions/${executionID}`)
	}

	/**
	 * Stop a running execution
	 */
	async StopExecution(executionID: string): Promise<ApiResponse<StopExecutionResponse>> {
		return this.api.Post<StopExecutionResponse>(`/job/executions/${executionID}/stop`, {})
	}

	/**
	 * Get execution progress information
	 */
	async GetExecutionProgress(executionID: string): Promise<ApiResponse<ExecutionProgressResponse>> {
		return this.api.Get<ExecutionProgressResponse>(`/job/executions/${executionID}/progress`)
	}

	// ===== Log Management =====

	/**
	 * List logs for a specific job
	 */
	async ListJobLogs(request: ListLogsRequest & { job_id: string }): Promise<ApiResponse<ListLogsResponse>> {
		const params: Record<string, string> = {}

		if (request.page !== undefined) {
			params.page = request.page.toString()
		}
		if (request.pagesize !== undefined) {
			params.pagesize = request.pagesize.toString()
		}
		if (request.level) {
			params.level = request.level
		}
		if (request.execution_id) {
			params.execution_id = request.execution_id
		}

		return this.api.Get<ListLogsResponse>(`/job/jobs/${request.job_id}/logs`, params)
	}

	/**
	 * List logs for a specific execution
	 */
	async ListExecutionLogs(
		request: ListLogsRequest & { execution_id: string }
	): Promise<ApiResponse<ListLogsResponse>> {
		const params: Record<string, string> = {}

		if (request.page !== undefined) {
			params.page = request.page.toString()
		}
		if (request.pagesize !== undefined) {
			params.pagesize = request.pagesize.toString()
		}
		if (request.level) {
			params.level = request.level
		}

		return this.api.Get<ListLogsResponse>(`/job/executions/${request.execution_id}/logs`, params)
	}

	// ===== Category Management =====

	/**
	 * List job categories
	 */
	async ListCategories(request?: ListCategoriesRequest): Promise<ApiResponse<ListCategoriesResponse>> {
		const params: Record<string, string> = {}

		if (request) {
			if (request.enabled !== undefined) {
				params.enabled = request.enabled.toString()
			}
			if (request.system !== undefined) {
				params.system = request.system.toString()
			}
		}

		return this.api.Get<ListCategoriesResponse>('/job/categories', params)
	}

	/**
	 * Get category by ID
	 */
	async GetCategory(categoryID: string): Promise<ApiResponse<Category>> {
		return this.api.Get<Category>(`/job/categories/${categoryID}`)
	}

	// ===== Utility Methods =====

	/**
	 * Check if a job is running
	 */
	isJobRunning(job: Job): boolean {
		return job.status === 'running'
	}

	/**
	 * Check if a job can be stopped
	 */
	canStopJob(job: Job): boolean {
		return job.status === 'running' || job.status === 'ready'
	}

	/**
	 * Check if an execution is running
	 */
	isExecutionRunning(execution: Execution): boolean {
		return execution.status === 'running'
	}

	/**
	 * Check if an execution can be stopped
	 */
	canStopExecution(execution: Execution): boolean {
		return execution.status === 'running' || execution.status === 'queued'
	}

	/**
	 * Format job duration from milliseconds to human readable string
	 */
	formatDuration(milliseconds?: number): string {
		if (!milliseconds) return '-'

		const seconds = Math.floor(milliseconds / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m ${seconds % 60}s`
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`
		} else {
			return `${seconds}s`
		}
	}

	/**
	 * Get status color for UI display
	 */
	getStatusColor(status: string): string {
		switch (status) {
			case 'running':
				return 'blue'
			case 'completed':
				return 'green'
			case 'failed':
				return 'red'
			case 'ready':
				return 'orange'
			case 'disabled':
				return 'gray'
			case 'queued':
				return 'purple'
			case 'cancelled':
				return 'gray'
			default:
				return 'default'
		}
	}

	/**
	 * Get progress percentage
	 */
	getProgressPercentage(progress: number): number {
		return Math.max(0, Math.min(100, progress))
	}
}
