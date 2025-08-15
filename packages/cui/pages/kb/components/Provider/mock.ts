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
		separator: {
			type: 'string',
			title: 'Custom Separator',
			description: 'Custom separator pattern (regex supported).',
			default: '',
			placeholder: 'e.g. \\n\\n, ---',
			component: 'Input',
			width: 'half',
			order: 4
		},
		enable_debug: {
			type: 'boolean',
			title: 'Enable Debug Mode',
			description: 'Output detailed chunking information for debugging.',
			default: false,
			component: 'Switch',
			width: 'half',
			order: 5
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
			order: 6
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
			order: 7
		},
		api_key: {
			type: 'string',
			title: 'API Key',
			description: 'Optional API key for enhanced processing.',
			default: '',
			placeholder: 'Enter your API key',
			component: 'InputPassword',
			width: 'full',
			order: 8
		},
		custom_rules: {
			type: 'string',
			title: 'Custom Rules',
			description: 'Advanced chunking rules in JSON format.',
			default: '{\n  "preserve_tables": true,\n  "merge_short_lines": false\n}',
			component: 'CodeEditor',
			width: 'full',
			order: 9
		},
		notes: {
			type: 'string',
			title: 'Processing Notes',
			description: 'Additional notes or instructions for processing.',
			default: '',
			placeholder: 'Enter any special instructions...',
			component: 'TextArea',
			width: 'full',
			order: 10
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
	if (id === '__yao.test') {
		return { provider: testProvider, schema: testSchema }
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
			{ id: semanticSchema.id, title: semanticSchema.title, description: semanticSchema.description },
			{ id: testSchema.id, title: testSchema.title, description: testSchema.description }
		]
	}

	// Unknown types return empty array
	return []
}

// 测试 Provider - 展示所有组件类型
const testProvider: Provider = {
	id: '__yao.test',
	label: 'Component Test Suite',
	description: 'Test all available input components',
	options: [
		{
			label: 'Default Configuration',
			value: 'default',
			default: true,
			description: 'Test configuration with sample values',
			properties: {}
		}
	]
}

const testSchema: ProviderSchema = {
	id: '__yao.test',
	title: 'Component Test Suite',
	description: 'Comprehensive test of all available input components for development and testing.',
	required: ['required_text', 'required_number'],
	properties: {
		// Text Input 组件
		required_text: {
			type: 'string',
			title: 'Required Text Input',
			description: 'A required text input field.',
			default: '',
			placeholder: 'Enter required text...',
			component: 'Input',
			width: 'half',
			order: 1
		},
		optional_text: {
			type: 'string',
			title: 'Optional Text Input',
			description: 'An optional text input with validation.',
			default: 'Default value',
			placeholder: 'Enter optional text...',
			minLength: 3,
			maxLength: 50,
			pattern: '^[A-Za-z0-9\\s]+$',
			component: 'Input',
			width: 'half',
			order: 2
		},

		// Input 组件 - 带验证的测试用例
		email_field: {
			type: 'string',
			title: 'Email Address',
			description: 'A required email input with pattern validation.',
			default: '',
			placeholder: 'user@example.com',
			required: true,
			pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$',
			component: 'Input',
			width: 'half',
			order: 2.5,
			errorMessages: {
				required: 'Email address is required',
				pattern: 'Please enter a valid email address'
			}
		},

		// Number Input 组件
		required_number: {
			type: 'integer',
			title: 'Required Number',
			description: 'A required integer input with constraints.',
			default: 100,
			minimum: 1,
			maximum: 1000,
			required: true,
			component: 'InputNumber',
			width: 'half',
			order: 3,
			errorMessages: {
				required: 'Please enter a number',
				minimum: 'Value must be at least {min}',
				maximum: 'Value cannot exceed {max}'
			}
		},
		float_number: {
			type: 'number',
			title: 'Float Number',
			description: 'A floating-point number input.',
			default: 3.14,
			minimum: 0.1,
			maximum: 999.99,
			component: 'InputNumber',
			width: 'half',
			order: 4
		},

		// Password Input 组件
		password_field: {
			type: 'string',
			title: 'Password Field',
			description: 'A password input with toggle visibility.',
			default: '',
			placeholder: 'Enter password...',
			minLength: 8,
			maxLength: 128,
			required: true,
			component: 'InputPassword',
			width: 'half',
			order: 5,
			errorMessages: {
				required: 'Password is required for authentication',
				minLength: 'Password must be at least {min} characters for security',
				maxLength: 'Password cannot exceed {max} characters'
			}
		},
		api_secret: {
			type: 'string',
			title: 'API Secret',
			description: 'Secret key for API authentication.',
			default: '',
			placeholder: 'sk-...',
			component: 'InputPassword',
			width: 'half',
			order: 6
		},

		// Switch 组件
		enable_feature: {
			type: 'boolean',
			title: 'Enable Feature',
			description: 'Toggle to enable or disable this feature.',
			default: true,
			component: 'Switch',
			width: 'half',
			order: 7
		},
		debug_mode: {
			type: 'boolean',
			title: 'Debug Mode',
			description: 'Enable verbose logging and debugging.',
			default: false,
			component: 'Switch',
			width: 'half',
			order: 8
		},

		// Select 组件 - 简单选项
		simple_select: {
			type: 'string',
			title: 'Simple Select',
			description: 'A dropdown with simple options.',
			default: 'medium',
			component: 'Select',
			enum: [
				{ label: 'Small', value: 'small', description: 'Small size option' },
				{ label: 'Medium', value: 'medium', description: 'Medium size option', default: true },
				{ label: 'Large', value: 'large', description: 'Large size option' }
			],
			width: 'half',
			order: 9
		},

		// Select 组件 - 分组选项
		grouped_select: {
			type: 'string',
			title: 'Grouped Select',
			description: 'A dropdown with grouped options.',
			default: 'gpt-4o-mini',
			component: 'Select',
			enum: [
				{
					groupLabel: 'OpenAI Models',
					options: [
						{
							label: 'GPT-4o Mini',
							value: 'gpt-4o-mini',
							description: 'Fast and efficient',
							default: true
						},
						{ label: 'GPT-4o', value: 'gpt-4o', description: 'Most capable model' }
					]
				},
				{
					groupLabel: 'Alternative Models',
					options: [
						{ label: 'Claude 3.5', value: 'claude-3.5', description: 'Anthropic model' },
						{ label: 'Gemini Pro', value: 'gemini-pro', description: 'Google model' }
					]
				}
			],
			width: 'half',
			order: 10
		},

		// TextArea 组件
		description_field: {
			type: 'string',
			title: 'Description',
			description: 'Multi-line text input for descriptions.',
			default: 'Enter your description here...\nMultiple lines are supported.',
			placeholder: 'Write a detailed description...',
			component: 'TextArea',
			width: 'full',
			order: 11
		},

		// TextArea 组件 - 带验证的测试用例
		required_description: {
			type: 'string',
			title: 'Required Description',
			description: 'A required multi-line text field with length constraints.',
			default: '',
			placeholder: 'Please provide a detailed description...',
			minLength: 20,
			maxLength: 500,
			required: true,
			component: 'TextArea',
			width: 'full',
			order: 11.5,
			errorMessages: {
				required: 'Description is required',
				minLength: 'Description must be at least {min} characters long',
				maxLength: 'Description cannot exceed {max} characters'
			}
		},

		// CodeEditor 组件
		json_config: {
			type: 'string',
			title: 'JSON Configuration',
			description: 'JSON configuration editor with syntax highlighting.',
			default: '{\n  "timeout": 30000,\n  "retries": 3,\n  "cache": true\n}',
			component: 'CodeEditor',
			width: 'full',
			order: 12
		},

		// CodeEditor 组件 - 带验证的测试用例
		required_script: {
			type: 'string',
			title: 'Required Script',
			description: 'A required code editor field for custom scripts.',
			default: '',
			placeholder: 'Enter your script here...',
			minLength: 10,
			required: true,
			component: 'CodeEditor',
			width: 'full',
			order: 12.5,
			errorMessages: {
				required: 'Script code is required',
				minLength: 'Script must be at least {min} characters long'
			}
		},

		// CheckboxGroup 组件 - 多选
		features: {
			type: 'array',
			title: 'Enabled Features',
			description: 'Select multiple features to enable.',
			default: ['caching', 'logging'],
			component: 'CheckboxGroup',
			enum: [
				{ label: 'Caching', value: 'caching', description: 'Enable result caching' },
				{ label: 'Logging', value: 'logging', description: 'Enable detailed logging' },
				{ label: 'Monitoring', value: 'monitoring', description: 'Enable performance monitoring' },
				{ label: 'Auto Retry', value: 'retry', description: 'Automatically retry failed requests' }
			],
			width: 'full',
			order: 12.5
		},

		// RadioGroup 组件 - 单选
		priority_level: {
			type: 'string',
			title: 'Priority Level',
			description: 'Select processing priority level.',
			default: 'normal',
			component: 'RadioGroup',
			enum: [
				{ label: 'Low', value: 'low', description: 'Background processing' },
				{ label: 'Normal', value: 'normal', description: 'Standard processing speed' },
				{ label: 'High', value: 'high', description: 'Faster processing with more resources' },
				{ label: 'Critical', value: 'critical', description: 'Highest priority processing' }
			],
			width: 'half',
			order: 12.7
		},

		// Nested Object 组件
		advanced_settings: {
			type: 'object',
			title: 'Advanced Settings',
			description: 'Optional advanced configuration settings.',
			component: 'Nested',
			order: 13,
			required: false,
			requiredFields: ['timeout', 'max_retries'],
			properties: {
				timeout: {
					type: 'integer',
					title: 'Timeout (ms)',
					description: 'Request timeout in milliseconds.',
					default: 30000,
					minimum: 1000,
					maximum: 300000,
					component: 'InputNumber',
					width: 'half',
					order: 1
				},
				max_retries: {
					type: 'integer',
					title: 'Max Retries',
					description: 'Maximum number of retry attempts.',
					default: 3,
					minimum: 0,
					maximum: 10,
					component: 'InputNumber',
					width: 'half',
					order: 2
				},
				enable_cache: {
					type: 'boolean',
					title: 'Enable Cache',
					description: 'Cache responses to improve performance.',
					default: true,
					component: 'Switch',
					width: 'half',
					order: 3
				},
				cache_key: {
					type: 'string',
					title: 'Cache Key',
					description: 'Custom cache key prefix (optional).',
					default: '',
					placeholder: 'e.g. myapp_cache_',
					component: 'Input',
					width: 'half',
					order: 4
				}
			}
		}
	}
}
