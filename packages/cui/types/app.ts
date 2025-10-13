import { OpenAPIConfig } from '@/openapi'
import type { Action, Common } from '@/types'

export declare namespace App {
	/**
	 * Layout type 布局类型
	 * - Chat: AI Chat Interface (AI 对话界面)
	 *   Button text: "Chat" / "对话"
	 * - Admin: Admin Dashboard (管理后台)
	 *   Button text: "Admin" / "后台"
	 */
	type Layout = 'Chat' | 'Admin'

	type Theme = 'light' | 'dark'

	type Developer = {
		id?: string
		name?: string
		info?: string
		email?: string
		homepage?: string
	}

	/** Global Neo Context */
	type Neo = { assistant_id?: string; chat_id?: string; placeholder?: ChatPlaceholder }

	type ChatMessageType =
		| 'text'
		| 'plan'
		| 'image'
		| 'audio'
		| 'video'
		| 'file'
		| 'link'
		| 'error'
		| 'progress'
		| 'page'
		| 'widget'
		| 'tool'
		| 'think'
		| 'loading'
		| 'result'
		| 'action'

	type ChatCmd = {
		id: string
		name: string
		request: string
	}

	type ChatCommand = {
		use: string
		name: string
		description: string
	}

	/** Assistant related types */
	interface Assistant {
		assistant_id: string
		name: string
		type: string
		tags?: string[]
		built_in?: boolean
		readonly?: boolean
		mentionable?: boolean
		automated?: boolean
		avatar?: string
		connector?: string
		[key: string]: any
	}

	interface AssistantSummary {
		assistant_id?: string
		assistant_name?: string
		assistant_avatar?: string
		assistant_deleteable?: boolean
		placeholder?: ChatPlaceholder
	}

	type AgentStorageType = 'chat' | 'assets' | 'knowledge'
	type AgentStorages = { [key in AgentStorageType]?: AgentStorage }

	interface AgentStorage {
		max_size?: number
		chunk_size?: number
		allowed_types?: string[]
		gzip?: boolean
	}

	interface UploadOption {
		compress_image?: boolean
		compress_size?: number
		gzip?: boolean
		knowledge?: boolean
		chat_id?: string
		assistant_id?: string
	}

	interface Connectors {
		options: Array<{ label: string; value: string }>
		mapping: Record<string, string>
	}

	interface AssistantFilter {
		keywords?: string
		tags?: string[]
		connector?: string
		select?: string[]
		mentionable?: boolean
		automated?: boolean
		page?: number
		pagesize?: number
	}

	interface AssistantResponse {
		data: Assistant[]
		page: number
		pagesize: number
		total: number
		last_page: number
		pagecnt?: number
		next?: number
		prev?: number
	}

	type ChatAI = {
		is_neo: boolean
		new: boolean
		text: string
		id?: string
		tool_id?: string // tool_id for the message
		begin?: number // begin for the message
		end?: number // end for the message
		type?: ChatMessageType
		function?: string
		arguments?: string
		props?: Record<string, any>
		assistant_id?: string
		assistant_name?: string
		assistant_avatar?: string
		previous_assistant_id?: string // previous assistant_id for the message
		// actions?: Array<Action.ActionParams>
		done: boolean // Whether the message is done
		delta?: boolean // Whether the message is a delta message
	}

	type ChatHuman = {
		is_neo: boolean
		text: string
		attachments?: ChatAttachment[]
		assistant_id?: string
		context?: {
			namespace: string
			stack: string
			pathname: string
			formdata: any
			field?: Omit<Field, 'config'>
			config?: Common.FieldDetail
			signal?: ChatContext['signal']
			chat_id?: string
			assistant_id?: string
			theme?: 'light' | 'dark'
			locale?: string
			is_cn?: boolean
		}
	}

	type ChatInfo = ChatHuman | ChatAI

	/** Chat detail with history */
	interface ChatDetail {
		chat: {
			assistant_id?: string
			assistant_name?: string
			assistant_avatar?: string
			assistant_deleteable?: boolean
			placeholder?: ChatPlaceholder

			[key: string]: any
		}
		history: Array<{
			role: string
			content: string
			assistant_id?: string
			assistant_name?: string
			assistant_avatar?: string
			[key: string]: any
		}>
	}

	type ChatHistory = {
		command?: ChatCmd
		data: Array<{
			content: string
			role: 'user' | 'assistant' | 'system'
			assistant_id?: string
			assistant_name?: string
			assistant_avatar?: string
		}>
	}

	interface ChatContext {
		placeholder: string
		signal: any
	}

	interface Context {
		namespace: string
		primary: string
		data_item: any
	}

	interface Field {
		name: string
		bind: string
		config: Common.FieldDetail
	}

	type Role = {
		captcha: string
		login: string
		/** Configure login page brand and cover */
		layout?: {
			/** login page cover image */
			cover?: string
			/** default is 'Make Your Dream With Yao App Engine' */
			slogan?: string
			/** default is yaoapps.com */
			site?: string
		}
		thirdPartyLogin?: Array<{
			/** button text */
			title: string
			/** third party login href text */
			href: string
			/** button prefix icon */
			icon?: string
			/** set whether the target of the a tag is _blank */
			blank?: boolean
		}>
	}

	/**
	 * Knowledge Base Configuration
	 */
	type KBConfig = {
		/** Available features based on current configuration */
		features: KBFeatures
		/** Text splitting providers (Required - at least one) */
		chunkings: string[]
		/** Text vectorization providers (Required - at least one) */
		embeddings: string[]
		/** File processing converters (Optional) */
		converters: string[]
		/** Entity and relationship extractions (Optional) */
		extractions: string[]
		/** File fetchers (Optional) */
		fetchers: string[]
		/** Search providers (Optional) */
		searchers: string[]
		/** Reranking providers (Optional) */
		rerankers: string[]
		/** Voting providers (Optional) */
		votes: string[]
		/** Weighting providers (Optional) */
		weights: string[]
		/** Scoring providers (Optional) */
		scores: string[]
		/** File uploader configuration (Default: "__yao.attachment") */
		uploader: string
	}

	/**
	 * Knowledge Base Features - represents available features based on current configuration
	 */
	type KBFeatures = {
		// Core features
		/** Graph database support (neo4j) */
		GraphDatabase: boolean
		/** PDF text extraction capability */
		PDFProcessing: boolean
		/** Video/audio processing capability (ffmpeg) */
		VideoProcessing: boolean

		// File format support (based on converters)
		/** Plain text files support (.txt, .md) */
		PlainText: boolean
		/** Office documents support (.docx, .pptx, .xlsx) */
		OfficeDocuments: boolean
		/** Text recognition from images and PDFs (OCR) */
		OCRProcessing: boolean
		/** Audio transcription capability */
		AudioTranscript: boolean
		/** Image content analysis capability */
		ImageAnalysis: boolean

		// Advanced features
		/** Entity and relationship extraction */
		EntityExtraction: boolean
		/** Web URL fetching capability */
		WebFetching: boolean
		/** Custom search providers support */
		CustomSearch: boolean
		/** Search result reranking capability */
		ResultReranking: boolean
		/** Segment voting system */
		SegmentVoting: boolean
		/** Segment weighting system */
		SegmentWeighting: boolean
		/** Segment scoring system */
		SegmentScoring: boolean
	}

	interface Info {
		/** Application Name */
		name: string

		/** Application version */
		version?: string

		openapi?: OpenAPIConfig

		kb?: KBConfig

		/** Yao version */
		yao?: {
			version?: string
			prversion?: string
		}

		/** CUI version */
		cui?: {
			version?: string
			prversion?: string
		}

		/** Application developer */
		developer?: Developer

		/** Application description */
		description?: string
		/** api prefix, default is __yao */
		apiPrefix?: string
		/** brand logo, default is YAO */
		logo?: string
		/** favicon, default is YAO */
		favicon?: string
		/** login config */
		login: {
			/** Configure admin login setting */
			admin: Role
			/** Configure user login setting */
			user?: Role
			/** Configure the jump page after administrator and user login */
			entry: {
				admin: string
				user: string
			}
		}
		/** define token behavior, default is sessionStorage */
		token?: {
			/** way of token storage */
			storage: 'sessionStorage' | 'localStorage'
		}

		/** Application mode */
		mode?: 'development' | 'production' | 'test'

		/** default assistant */
		agent?: {
			default?: AssistantSummary
			connectors?: Array<{ label: string; value: string }>
			storages?: AgentStorages
		}

		optional?: {
			/** default layout */
			layout?: Layout

			/** remote api cache, default is true */
			remoteCache?: boolean
			/** neo config, for chatgpt service */
			neo?: {
				/** Neo stream API endpoint */
				api: string

				/**
				 * Dock position
				 * Options:
				 * - `right-bottom`: Floats at the bottom-right corner.（default）
				 * - `right-top`: Sticks to the top-right corner, clicking the button opens the chat window on the right side.
				 * - `right`: Docked to the right side.
				 */
				dock?: 'right-bottom' | 'right-top' | 'right'

				studio?: boolean // Will be deprecated

				// AI Chatbot Name
				name?: string
			}

			/** menu config, default is { layout:"2-columns", hide:false, showName:false }  */
			menu?: { layout: '1-column' | '2-columns'; hide?: boolean; showName?: boolean }

			/**
			 * Developer-specific controls.
			 */
			devControls?: {
				/**
				 * Determines whether to show xterm links.
				 * Default: `false`. Takes effect only in development mode.
				 */
				enableXterm?: boolean

				/**
				 * Enables the "Edit with AI" button.
				 * Default: `false`. Takes effect only in development mode.
				 */
				enableAIEdit?: boolean

				/**
				 * ?? Planning, not implemented yet
				 * Enables the "View Source Code" button.
				 * Default: `false`. Takes effect only in development mode.
				 */
				enableViewSourceCode?: boolean
			}
		}
	}

	interface User {
		id: number | string
		avatar?: string
		mobile?: any
		name: string
		type: string
		// Team information (if user selected a team)
		tenant_id?: string
		team_id?: string
		team?: {
			team_id?: string
			logo?: string
			name?: string
			owner_id?: string
			description?: string
		}
		is_owner?: boolean
		// User type information
		type_id?: string
		user_type?: {
			type_id?: string
			name?: string
			locale?: string
		}
	}

	interface Menu {
		id: number
		key: string
		name: string
		icon?: string | { name: string; size: number }
		path: string
		badge?: number
		dot?: boolean
		children?: Array<Menu>
	}

	interface Menus {
		items: Array<App.Menu> // Main menu
		setting: Array<App.Menu> // Setting menu
		quick?: Array<App.Menu> // Quick menu
	}

	interface ChatAttachment {
		name: string
		type: string
		url?: string
		status?: 'uploading' | 'done' | 'error'
		file_id?: string
		bytes?: number
		created_at?: number
		filename?: string
		content_type?: string
		chat_id?: string
		assistant_id?: string
		thumbUrl?: string
		blob?: Blob
		pinned?: boolean
		description?: string
	}

	/** Options for creating a new chat */
	interface NewChatOptions {
		content?: string
		chat_id?: string
		assistant?: AssistantSummary
		attachments?: ChatAttachment[]
		placeholder?: ChatPlaceholder
	}

	interface ChatPlaceholder {
		title?: string
		description?: string
		prompts?: string[]
	}

	// Add Mention interface near the top with other basic types
	interface Mention {
		id: string
		name: string
		avatar?: string
		type?: string
	}
}
