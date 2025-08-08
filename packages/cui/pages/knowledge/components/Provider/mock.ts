import { Provider, ProviderAndSchemaResponse, ProviderSchema, ProviderSchemaSummary } from './types'

const structuredProvider: Provider = {
	id: '__yao.structured',
	label: 'Document Structure',
	description: 'Split text by document structure (headings, paragraphs)',
	options: [
		{
			label: 'Fine-grained (Detailed)',
			value: 'fine-grained',
			description: 'Small chunks for precise search and detailed analysis',
			properties: { size: 100, overlap: 10, max_depth: 2 }
		},
		{
			label: 'Standard (Recommended)',
			value: 'standard',
			default: true,
			description: 'Medium-sized chunks perfect for most use cases',
			properties: { size: 300, overlap: 50, max_depth: 3 }
		},
		{
			label: 'Large (Context-rich)',
			value: 'context-rich',
			description: 'Large chunks preserving more context for complex documents',
			properties: { size: 600, overlap: 100, max_depth: 4 }
		}
	]
}

const structuredSchema: ProviderSchema = {
	id: '__yao.structured',
	title: 'Structured Chunking Options',
	description: 'Configure deterministic chunking by document structure. Safe defaults are provided.',
	required: ['size', 'overlap', 'max_depth'],
	properties: {
		size: {
			type: 'integer',
			title: 'Chunk Size',
			description: 'Target characters per chunk.',
			default: 300,
			minimum: 50,
			maximum: 4000,
			component: 'InputNumber',
			width: 'half',
			order: 1
		},
		overlap: {
			type: 'integer',
			title: 'Overlap',
			description: 'Overlapping characters between adjacent chunks.',
			default: 20,
			minimum: 0,
			maximum: 1000,
			component: 'InputNumber',
			width: 'half',
			order: 2
		},
		max_depth: {
			type: 'integer',
			title: 'Max Depth',
			description: 'Maximum hierarchy depth to traverse for splitting.',
			default: 3,
			minimum: 1,
			maximum: 10,
			component: 'InputNumber',
			width: 'half',
			order: 3
		},
		size_multiplier: {
			type: 'integer',
			title: 'Size Multiplier',
			description: 'Multiplier to adjust effective size at deeper levels.',
			default: 3,
			minimum: 1,
			maximum: 10,
			component: 'InputNumber',
			width: 'half',
			order: 4
		},
		max_concurrent: {
			type: 'integer',
			title: 'Max Concurrent',
			description: 'Parallelism when chunking documents.',
			default: 10,
			minimum: 1,
			maximum: 100,
			component: 'InputNumber',
			width: 'half',
			order: 5
		}
	}
}

const semanticProvider: Provider = {
	id: '__yao.semantic',
	label: 'Smart Splitting',
	description: 'AI-powered intelligent text splitting based on meaning',
	default: true,
	options: [
		{
			label: 'GPT-4o Mini (Recommended)',
			value: 'gpt-4o-mini',
			default: true,
			description: 'Best balance of speed and quality - ideal for most documents',
			properties: {
				connector: 'openai.gpt-4o-mini',
				size: 300,
				overlap: 50,
				max_depth: 3,
				toolcall: true
			}
		},
		{
			label: 'GPT-4o (Premium)',
			value: 'gpt-4o',
			description: 'Highest quality AI splitting for complex documents',
			properties: {
				connector: 'openai.gpt-4o',
				size: 300,
				overlap: 50,
				max_depth: 3,
				toolcall: true
			}
		},
		{
			label: 'Deepseek V3 (Alternative)',
			value: 'deepseek-v3',
			description: 'Cost-effective alternative with good performance',
			properties: {
				connector: 'deepseek.v3',
				size: 300,
				overlap: 50,
				max_depth: 3,
				toolcall: false
			}
		}
	]
}

const semanticSchema: ProviderSchema = {
	id: '__yao.semantic',
	title: 'Semantic Chunking Options',
	description: 'Configure AI-assisted semantic chunking. Defaults mirror server-side behavior.',
	required: ['size', 'overlap', 'max_depth'],
	properties: {
		size: {
			type: 'integer',
			title: 'Chunk Size',
			description: 'Target characters per chunk.',
			default: 300,
			minimum: 50,
			maximum: 4000,
			component: 'InputNumber',
			width: 'half',
			order: 1
		},
		overlap: {
			type: 'integer',
			title: 'Overlap',
			description: 'Overlapping characters between adjacent chunks.',
			default: 50,
			minimum: 0,
			maximum: 1000,
			component: 'InputNumber',
			width: 'half',
			order: 2
		},
		max_depth: {
			type: 'integer',
			title: 'Max Depth',
			description: 'Maximum hierarchy depth to traverse for splitting.',
			default: 3,
			minimum: 1,
			maximum: 10,
			component: 'InputNumber',
			width: 'half',
			order: 3
		},
		size_multiplier: {
			type: 'integer',
			title: 'Size Multiplier',
			description: 'Multiplier to adjust effective size at deeper levels.',
			default: 3,
			minimum: 1,
			maximum: 10,
			component: 'InputNumber',
			width: 'half',
			order: 4
		},
		max_concurrent: {
			type: 'integer',
			title: 'Max Concurrent',
			description: 'Parallelism when chunking documents.',
			default: 10,
			minimum: 1,
			maximum: 100,
			component: 'InputNumber',
			width: 'half',
			order: 5
		},
		semantic: {
			type: 'object',
			title: 'Semantic Options',
			description: 'Advanced options for semantic model calls.',
			component: 'Nested',
			order: 6,
			required: false, // 对象本身可选
			requiredFields: ['connector', 'context_size'], // 但如果填写，这些字段必填
			properties: {
				connector: {
					type: 'string',
					title: 'Connector',
					description: 'Connector ID for the AI model (e.g. openai.gpt-4o-mini, deepseek.v3).',
					default: '',
					component: 'Select',
					enum: [
						{
							groupLabel: 'OpenAI Models',
							options: [
								{
									label: 'GPT-4o Mini',
									value: 'openai.gpt-4o-mini',
									description: 'Fast and cost-effective, best for most use cases',
									default: true
								},
								{
									label: 'GPT-4o',
									value: 'openai.gpt-4o',
									description: 'Highest quality AI splitting for complex documents'
								}
							]
						},
						{
							groupLabel: 'Alternative Models',
							options: [
								{
									label: 'Deepseek V3',
									value: 'deepseek.v3',
									description: 'Cost-effective alternative with good performance'
								},
								{
									label: 'Claude 3.5 Sonnet',
									value: 'anthropic.claude-3-5-sonnet',
									description: 'Excellent reasoning and context understanding'
								}
							]
						}
					],
					width: 'half',
					order: 1
				},
				toolcall: {
					type: 'boolean',
					title: 'Enable Tool Call',
					description: 'Allow tool calls during semantic analysis.',
					default: false,
					component: 'Switch',
					width: 'half',
					order: 2
				},
				context_size: {
					type: 'integer',
					title: 'Context Size',
					description:
						'Approximate characters provided to the model for context (defaults to size * 6).',
					default: 1800,
					minimum: 200,
					maximum: 32000,
					component: 'InputNumber',
					width: 'half',
					order: 3
				},
				options: {
					type: 'string',
					title: 'Model Options (JSON)',
					description: 'Optional model-specific options in JSON string.',
					default: '',
					component: 'CodeEditor',
					width: 'full',
					order: 4
				},
				prompt: {
					type: 'string',
					title: 'Custom Prompt',
					description: 'Override default prompting for semantic chunking.',
					default: '',
					component: 'TextArea',
					width: 'full',
					order: 5
				},
				max_retry: {
					type: 'integer',
					title: 'Max Retry',
					description: 'Maximum retries for model calls.',
					default: 3,
					minimum: 0,
					maximum: 10,
					component: 'InputNumber',
					width: 'half',
					order: 6
				},
				semantic_max_concurrent: {
					type: 'integer',
					title: 'Semantic Max Concurrent',
					description: 'Parallelism for semantic model calls.',
					default: 10,
					minimum: 1,
					maximum: 100,
					component: 'InputNumber',
					width: 'half',
					order: 7
				}
			}
		},
		user_profile: {
			type: 'object',
			title: 'User Profile',
			description: 'User identification information for personalized chunking.',
			component: 'Nested',
			order: 7,
			required: true, // 对象本身必填
			requiredFields: ['first_name'], // first_name 必填，last_name 可选
			properties: {
				first_name: {
					type: 'string',
					title: 'First Name',
					description: 'User first name for personalization.',
					default: '',
					component: 'Input',
					width: 'half',
					order: 1
				},
				last_name: {
					type: 'string',
					title: 'Last Name',
					description: 'User last name (optional).',
					default: '',
					component: 'Input',
					width: 'half',
					order: 2
				},
				email: {
					type: 'string',
					title: 'Email',
					description: 'Contact email for notifications.',
					default: '',
					component: 'Input',
					width: 'full',
					order: 3
				}
			}
		}
	}
}

export async function fetchProviderAndSchema(id: string): Promise<ProviderAndSchemaResponse> {
	// 200ms simulated network latency
	await new Promise((resolve) => setTimeout(resolve, 200))

	if (id === '__yao.structured') {
		return { provider: structuredProvider, schema: structuredSchema }
	}
	if (id === '__yao.semantic') {
		return { provider: semanticProvider, schema: semanticSchema }
	}

	// Fallback: default to semantic when unknown id is provided
	return { provider: semanticProvider, schema: semanticSchema }
}

/**
 * Fetch lightweight schema summaries by provider type.
 * Example: fetchProviderSchemaSummaries('chunkings') -> returns two schema summaries for structured and semantic.
 */
export async function fetchProviderSchemaSummaries(type: string): Promise<ProviderSchemaSummary[]> {
	// Simulate network latency
	await new Promise((resolve) => setTimeout(resolve, 200))

	if (type === 'chunkings') {
		return [
			{ id: structuredSchema.id, title: structuredSchema.title, description: structuredSchema.description },
			{ id: semanticSchema.id, title: semanticSchema.title, description: semanticSchema.description }
		]
	}

	// Unknown types return empty array
	return []
}
