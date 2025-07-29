import { LoginConfig, ThirdPartyProvider, ApiResponse, FormValues, ResLogin } from '@/pages/login/types'

/**
 * Mock API service for login functionality
 * This simulates the backend API endpoints for login configuration and authentication
 */
export class LoginMockService {
	private mockDelay = (ms: number = 1000) => new Promise((resolve) => setTimeout(resolve, ms))

	/**
	 * Mock third-party providers configuration
	 */
	private mockThirdPartyProviders: ThirdPartyProvider[] = [
		{
			id: 'google',
			name: 'Google',
			icon: 'https://developers.google.com/identity/images/g-logo.png',
			url: '/auth/google',
			enabled: true,
			color: '#4285f4',
			textColor: '#ffffff'
		},
		{
			id: 'apple',
			name: 'Apple',
			icon: 'https://developer.apple.com/assets/elements/icons/sign-in-with-apple/sign-in-with-apple.svg',
			url: '/auth/apple',
			enabled: true,
			color: '#000000',
			textColor: '#ffffff'
		},
		{
			id: 'github',
			name: 'GitHub',
			icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
			url: '/auth/github',
			enabled: true,
			color: '#333333',
			textColor: '#ffffff'
		},
		{
			id: 'microsoft',
			name: 'Microsoft',
			icon: 'https://logincdn.msauth.net/shared/1.0/content/images/microsoft_logo_564db913a7fa0ca42727161c6d031bef.svg',
			url: '/auth/microsoft',
			enabled: false,
			color: '#0078d4',
			textColor: '#ffffff'
		}
	]

	/**
	 * Mock login configuration
	 */
	private mockLoginConfig: LoginConfig = {
		username: {
			label: 'Username',
			placeholder: 'Email or phone number',
			type: 'both',
			required: true
		},
		password: {
			label: 'Password',
			placeholder: 'Enter your password',
			minLength: 6,
			required: true
		},
		captcha: {
			enabled: true,
			type: 'cloudflare',
			endpoint: '/api/captcha',
			siteKey: '0x4AAAAAABnC-kQ6f3bjrBsC'
		},
		thirdPartyProviders: this.mockThirdPartyProviders.filter((p) => p.enabled),
		page: {
			title: 'Welcome to YaoApp',
			subtitle: 'Please sign in to continue',
			backgroundImage:
				'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
			logo: '/api/__yao/app/icons/app.png',
			primaryColor: '#3371fc'
		},
		api: {
			login: '/api/auth/login',
			config: '/api/auth/config',
			thirdParty: '/api/auth/third-party'
		}
	}

	/**
	 * Mock user database for testing
	 */
	private mockUsers = [
		{
			id: 1,
			email: 'admin@example.com',
			mobile: '13800138000',
			password: 'admin123',
			name: 'Admin User',
			type: 'admin' as const
		},
		{
			id: 2,
			email: 'user@example.com',
			mobile: '13800138001',
			password: 'user123',
			name: 'Regular User',
			type: 'user' as const
		}
	]

	/**
	 * Get login page configuration
	 */
	async getLoginConfig(): Promise<ApiResponse<LoginConfig>> {
		await this.mockDelay(500)

		return {
			success: true,
			data: this.mockLoginConfig,
			message: 'Login configuration retrieved successfully'
		}
	}

	/**
	 * Get available third-party providers
	 */
	async getThirdPartyProviders(): Promise<ApiResponse<ThirdPartyProvider[]>> {
		await this.mockDelay(300)

		return {
			success: true,
			data: this.mockThirdPartyProviders.filter((p) => p.enabled),
			message: 'Third-party providers retrieved successfully'
		}
	}

	/**
	 * Authenticate user
	 */
	async login(credentials: FormValues): Promise<ApiResponse<ResLogin>> {
		await this.mockDelay(1500) // Simulate network delay

		const { mobile: username, password } = credentials

		// Find user by email or mobile
		const user = this.mockUsers.find((u) => u.email === username || u.mobile === username)

		if (!user) {
			return {
				success: false,
				message: 'User not found',
				errors: {
					username: ['User with this email or phone number does not exist']
				}
			}
		}

		if (user.password !== password) {
			return {
				success: false,
				message: 'Invalid password',
				errors: {
					password: ['Password is incorrect']
				}
			}
		}

		// Mock successful login response
		const loginResponse: ResLogin = {
			expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
			menus: {
				items: [{ id: 1, key: 'dashboard', path: '/dashboard', name: 'Dashboard', icon: 'dashboard' }],
				setting: [{ id: 2, key: 'settings', path: '/settings', name: 'Settings', icon: 'settings' }]
			},
			token: `mock_token_${user.id}_${Date.now()}`,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				mobile: user.mobile
			} as any,
			type: user.type,
			entry: '/dashboard'
		}

		return {
			success: true,
			data: loginResponse,
			message: 'Login successful'
		}
	}

	/**
	 * Handle third-party authentication
	 */
	async handleThirdPartyAuth(providerId: string): Promise<ApiResponse<{ url: string }>> {
		await this.mockDelay(500)

		const provider = this.mockThirdPartyProviders.find((p) => p.id === providerId)
		if (!provider || !provider.enabled) {
			return {
				success: false,
				message: 'Provider not available'
			}
		}

		// In a real implementation, this would generate OAuth URLs
		const mockAuthUrl = `${provider.url}?redirect_uri=${encodeURIComponent(
			window.location.origin
		)}/auth/callback&state=${Date.now()}`

		return {
			success: true,
			data: { url: mockAuthUrl },
			message: 'Authentication URL generated'
		}
	}

	/**
	 * Generate mock captcha
	 */
	async generateCaptcha(): Promise<ApiResponse<{ id: string; image: string }>> {
		await this.mockDelay(300)

		const captchaId = `captcha_${Date.now()}`
		// In a real implementation, this would be a base64 encoded captcha image
		const mockCaptchaImage = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><text x="10" y="25" font-family="Arial" font-size="20" fill="%23333">MOCK</text></svg>`

		return {
			success: true,
			data: {
				id: captchaId,
				image: mockCaptchaImage
			},
			message: 'Captcha generated successfully'
		}
	}

	/**
	 * Test credentials for demo purposes
	 */
	getTestCredentials() {
		return {
			admin: {
				username: 'admin@example.com',
				password: 'admin123'
			},
			user: {
				username: 'user@example.com',
				password: 'user123'
			}
		}
	}
}

// Export singleton instance
export const loginMockService = new LoginMockService()
