import { OpenAPI } from '@/openapi'

interface $App {
	api_prefix: string
	openapi: OpenAPI
	kb: any // TODO: add Knowledge Base Config
	memo: <T>(el: (props: T) => JSX.Element | null) => React.MemoExoticComponent<(props: T) => JSX.Element | null>
	sleep: (time: number) => Promise<unknown>
	Handle: typeof Handle
	Event: Emittery
}
