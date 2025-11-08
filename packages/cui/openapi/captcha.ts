import { OpenAPI } from './openapi'
import { ApiResponse, ErrorResponse } from './types'
import { BuildURL } from './lib/utils'

/**
 * Captcha options for generating captcha
 */
export interface CaptchaOption {
	height?: number
	width?: number
	length?: number
	lang?: string
	background?: string
}

/**
 * Captcha response data
 */
export interface CaptchaResponse {
	id: string
	data: string // Base64 encoded image/audio data
}

/**
 * Captcha API client
 * Handles image and audio captcha generation
 */
export class Captcha {
	constructor(private api: OpenAPI) {}

	/**
	 * Get image captcha
	 */
	async GetImageCaptcha(options?: CaptchaOption): Promise<ApiResponse<CaptchaResponse>> {
		const params = new URLSearchParams()

		if (options) {
			Object.entries(options).forEach(([key, value]) => {
				if (value !== undefined) {
					params.append(key, value.toString())
				}
			})
		}

		return this.api.Get<CaptchaResponse>(BuildURL('/captcha/image', params))
	}

	/**
	 * Get audio captcha
	 */
	async GetAudioCaptcha(options?: CaptchaOption): Promise<ApiResponse<CaptchaResponse>> {
		const params = new URLSearchParams()

		if (options) {
			Object.entries(options).forEach(([key, value]) => {
				if (value !== undefined) {
					params.append(key, value.toString())
				}
			})
		}

		return this.api.Get<CaptchaResponse>(BuildURL('/captcha/audio', params))
	}

	/**
	 * Helper: Check if response contains an error
	 */
	IsError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { error: ErrorResponse } {
		return this.api.IsError(response)
	}

	/**
	 * Helper: Extract data from successful response
	 */
	GetData<T>(response: ApiResponse<T>): T | null {
		return this.api.GetData(response)
	}
}

export default Captcha
