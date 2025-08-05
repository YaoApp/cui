import OpenAPI from './openapi'
import { ApiResponse } from './types'

interface HelloWorldResponse {
	[key: string]: any
}

export class HelloWorld {
	constructor(private api: OpenAPI) {}

	async Public(): Promise<ApiResponse<HelloWorldResponse>> {
		const ts = new Date().toISOString()
		return this.api.Get<HelloWorldResponse>('/helloworld/public', { foo: 'bar', ts })
	}

	async Protected(): Promise<ApiResponse<HelloWorldResponse>> {
		const ts = new Date().toISOString()
		return this.api.Get<HelloWorldResponse>('/helloworld/protected', { foo: 'bar', ts })
	}

	async PostPublic(): Promise<ApiResponse<HelloWorldResponse>> {
		const ts = new Date().toISOString()
		return this.api.Post<HelloWorldResponse>('/helloworld/public', { foo: 'bar', ts })
	}

	async PostProtected(): Promise<ApiResponse<HelloWorldResponse>> {
		const ts = new Date().toISOString()
		return this.api.Post<HelloWorldResponse>('/helloworld/protected', { foo: 'bar', ts })
	}
}

export default HelloWorld
