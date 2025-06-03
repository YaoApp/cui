import { Collections, Files } from './types'

// Mock 知识库集合数据
export const mockCollections: Collections[] = [
	{
		id: 'tech_docs',
		cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop',
		name: '技术文档',
		description: '包含技术规范、API文档、开发指南等技术相关的知识库内容',
		total: 5
	},
	{
		id: 'product_manuals',
		cover: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=400&h=200&fit=crop',
		name: '产品手册',
		description: '产品使用手册、操作指南、常见问题解答等产品相关文档',
		total: 4
	},
	{
		id: 'business_docs',
		cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
		name: '商务文档',
		description: '合同模板、商务流程、政策法规等商务相关的知识库',
		total: 3
	},
	{
		id: 'training_materials',
		cover: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop',
		name: '培训资料',
		description: '员工培训、技能提升、学习资料等培训相关的知识库内容',
		total: 4
	},
	{
		id: 'research_papers',
		cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop',
		name: '研究论文',
		description: '学术论文、研究报告、行业分析等研究相关的知识库',
		total: 5
	},
	{
		id: 'legal_documents',
		cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=200&fit=crop',
		name: '法律文档',
		description: '法律条文、合规文件、知识产权等法律相关的文档资料',
		total: 6
	},
	{
		id: 'financial_reports',
		cover: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=200&fit=crop',
		name: '财务报表',
		description: '财务报告、预算文档、审计材料等财务相关的知识库',
		total: 3
	},
	{
		id: 'marketing_materials',
		cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
		name: '营销资料',
		description: '营销方案、推广素材、品牌指南等市场营销相关的文档',
		total: 7
	},
	{
		id: 'hr_documents',
		cover: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=200&fit=crop',
		name: '人事档案',
		description: '员工手册、招聘文档、薪酬制度等人力资源相关的知识库',
		total: 4
	},
	{
		id: 'project_docs',
		cover: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=200&fit=crop',
		name: '项目文档',
		description: '项目计划、需求文档、设计方案等项目管理相关的文档',
		total: 8
	}
]

// Mock 文件数据
export const mockFiles: Record<string, Files[]> = {
	tech_docs: [
		{
			name: 'API接口文档.pdf',
			file_id: 'file_tech_001',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 2048576,
			created_at: '2024-01-15T10:30:00Z',
			updated_at: '2024-01-15T10:30:00Z'
		},
		{
			name: '数据库设计规范.docx',
			file_id: 'file_tech_002',
			public: false,
			status: 'indexing',
			content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			bytes: 1536000,
			created_at: '2024-01-14T15:20:00Z',
			updated_at: '2024-01-14T15:20:00Z'
		},
		{
			name: '前端开发指南.md',
			file_id: 'file_tech_003',
			public: true,
			status: 'indexed',
			content_type: 'text/markdown',
			bytes: 512000,
			created_at: '2024-01-13T09:15:00Z',
			updated_at: '2024-01-13T09:15:00Z'
		},
		{
			name: '系统架构图.png',
			file_id: 'file_tech_004',
			public: true,
			status: 'uploaded',
			content_type: 'image/png',
			bytes: 3072000,
			created_at: '2024-01-12T14:45:00Z',
			updated_at: '2024-01-12T14:45:00Z'
		},
		{
			name: '代码规范检查清单.xlsx',
			file_id: 'file_tech_005',
			public: false,
			status: 'upload_failed',
			content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			bytes: 256000,
			created_at: '2024-01-11T11:30:00Z',
			updated_at: '2024-01-11T11:30:00Z'
		}
	],
	product_manuals: [
		{
			name: '用户操作手册.pdf',
			file_id: 'file_product_001',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 4096000,
			created_at: '2024-01-10T16:00:00Z',
			updated_at: '2024-01-10T16:00:00Z'
		},
		{
			name: '产品功能介绍.pptx',
			file_id: 'file_product_002',
			public: true,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			bytes: 8192000,
			created_at: '2024-01-09T13:20:00Z',
			updated_at: '2024-01-09T13:20:00Z'
		},
		{
			name: '常见问题FAQ.txt',
			file_id: 'file_product_003',
			public: true,
			status: 'indexing',
			content_type: 'text/plain',
			bytes: 128000,
			created_at: '2024-01-08T10:10:00Z',
			updated_at: '2024-01-08T10:10:00Z'
		},
		{
			name: '产品更新日志.json',
			file_id: 'file_product_004',
			public: false,
			status: 'index_failed',
			content_type: 'application/json',
			bytes: 64000,
			created_at: '2024-01-07T14:30:00Z',
			updated_at: '2024-01-07T14:30:00Z'
		}
	],
	business_docs: [
		{
			name: '合作协议模板.docx',
			file_id: 'file_business_001',
			public: false,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			bytes: 1024000,
			created_at: '2024-01-06T09:00:00Z',
			updated_at: '2024-01-06T09:00:00Z'
		},
		{
			name: '商务流程图.pdf',
			file_id: 'file_business_002',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 2560000,
			created_at: '2024-01-05T11:45:00Z',
			updated_at: '2024-01-05T11:45:00Z'
		},
		{
			name: '法律法规汇编.pdf',
			file_id: 'file_business_003',
			public: true,
			status: 'uploaded',
			content_type: 'application/pdf',
			bytes: 16384000,
			created_at: '2024-01-04T15:20:00Z',
			updated_at: '2024-01-04T15:20:00Z'
		}
	],
	training_materials: [
		{
			name: '新员工入职培训.pptx',
			file_id: 'file_training_001',
			public: true,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			bytes: 12288000,
			created_at: '2024-01-03T08:30:00Z',
			updated_at: '2024-01-03T08:30:00Z'
		},
		{
			name: '技能提升课程大纲.xlsx',
			file_id: 'file_training_002',
			public: false,
			status: 'indexing',
			content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			bytes: 512000,
			created_at: '2024-01-02T12:15:00Z',
			updated_at: '2024-01-02T12:15:00Z'
		},
		{
			name: '培训考核评估表.pdf',
			file_id: 'file_training_003',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 768000,
			created_at: '2024-01-01T16:40:00Z',
			updated_at: '2024-01-01T16:40:00Z'
		},
		{
			name: '在线学习资源链接.txt',
			file_id: 'file_training_004',
			public: true,
			status: 'uploaded',
			content_type: 'text/plain',
			bytes: 32000,
			created_at: '2023-12-31T14:00:00Z',
			updated_at: '2023-12-31T14:00:00Z'
		}
	],
	research_papers: [
		{
			name: '人工智能发展趋势报告.pdf',
			file_id: 'file_research_001',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 32768000,
			created_at: '2023-12-30T10:20:00Z',
			updated_at: '2023-12-30T10:20:00Z'
		},
		{
			name: '市场调研数据分析.xlsx',
			file_id: 'file_research_002',
			public: false,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			bytes: 4096000,
			created_at: '2023-12-29T13:50:00Z',
			updated_at: '2023-12-29T13:50:00Z'
		},
		{
			name: '行业白皮书.docx',
			file_id: 'file_research_003',
			public: true,
			status: 'indexing',
			content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			bytes: 6144000,
			created_at: '2023-12-28T09:30:00Z',
			updated_at: '2023-12-28T09:30:00Z'
		},
		{
			name: '学术论文合集.zip',
			file_id: 'file_research_004',
			public: false,
			status: 'upload_failed',
			content_type: 'application/zip',
			bytes: 67108864,
			created_at: '2023-12-27T17:10:00Z',
			updated_at: '2023-12-27T17:10:00Z'
		},
		{
			name: '技术创新分析报告.pdf',
			file_id: 'file_research_005',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 8192000,
			created_at: '2023-12-26T11:25:00Z',
			updated_at: '2023-12-26T11:25:00Z'
		}
	],
	legal_documents: [
		{
			name: '公司章程.pdf',
			file_id: 'file_legal_001',
			public: false,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 1024000,
			created_at: '2023-12-25T09:00:00Z',
			updated_at: '2023-12-25T09:00:00Z'
		},
		{
			name: '劳动合同模板.docx',
			file_id: 'file_legal_002',
			public: true,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			bytes: 512000,
			created_at: '2023-12-24T14:30:00Z',
			updated_at: '2023-12-24T14:30:00Z'
		},
		{
			name: '知识产权申请书.pdf',
			file_id: 'file_legal_003',
			public: false,
			status: 'indexing',
			content_type: 'application/pdf',
			bytes: 2048000,
			created_at: '2023-12-23T11:20:00Z',
			updated_at: '2023-12-23T11:20:00Z'
		},
		{
			name: '法规政策汇编.pdf',
			file_id: 'file_legal_004',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 16777216,
			created_at: '2023-12-22T16:45:00Z',
			updated_at: '2023-12-22T16:45:00Z'
		},
		{
			name: '合规检查清单.xlsx',
			file_id: 'file_legal_005',
			public: false,
			status: 'uploaded',
			content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			bytes: 256000,
			created_at: '2023-12-21T13:15:00Z',
			updated_at: '2023-12-21T13:15:00Z'
		},
		{
			name: '保密协议模板.docx',
			file_id: 'file_legal_006',
			public: true,
			status: 'index_failed',
			content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			bytes: 128000,
			created_at: '2023-12-20T10:40:00Z',
			updated_at: '2023-12-20T10:40:00Z'
		}
	],
	financial_reports: [
		{
			name: '年度财务报告.pdf',
			file_id: 'file_financial_001',
			public: false,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 8388608,
			created_at: '2023-12-19T15:30:00Z',
			updated_at: '2023-12-19T15:30:00Z'
		},
		{
			name: '预算分析表.xlsx',
			file_id: 'file_financial_002',
			public: true,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			bytes: 2097152,
			created_at: '2023-12-18T10:20:00Z',
			updated_at: '2023-12-18T10:20:00Z'
		},
		{
			name: '审计报告.pdf',
			file_id: 'file_financial_003',
			public: false,
			status: 'uploaded',
			content_type: 'application/pdf',
			bytes: 4194304,
			created_at: '2023-12-17T14:50:00Z',
			updated_at: '2023-12-17T14:50:00Z'
		}
	],
	marketing_materials: [
		{
			name: '品牌设计指南.pdf',
			file_id: 'file_marketing_001',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 16777216,
			created_at: '2023-12-16T09:00:00Z',
			updated_at: '2023-12-16T09:00:00Z'
		},
		{
			name: '营销活动方案.pptx',
			file_id: 'file_marketing_002',
			public: true,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			bytes: 33554432,
			created_at: '2023-12-15T13:20:00Z',
			updated_at: '2023-12-15T13:20:00Z'
		},
		{
			name: '客户案例集.pdf',
			file_id: 'file_marketing_003',
			public: true,
			status: 'indexing',
			content_type: 'application/pdf',
			bytes: 12582912,
			created_at: '2023-12-14T16:30:00Z',
			updated_at: '2023-12-14T16:30:00Z'
		},
		{
			name: '宣传视频脚本.docx',
			file_id: 'file_marketing_004',
			public: false,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			bytes: 524288,
			created_at: '2023-12-13T11:45:00Z',
			updated_at: '2023-12-13T11:45:00Z'
		},
		{
			name: '社交媒体素材包.zip',
			file_id: 'file_marketing_005',
			public: true,
			status: 'indexed',
			content_type: 'application/zip',
			bytes: 134217728,
			created_at: '2023-12-12T14:15:00Z',
			updated_at: '2023-12-12T14:15:00Z'
		},
		{
			name: '竞品分析报告.xlsx',
			file_id: 'file_marketing_006',
			public: false,
			status: 'uploaded',
			content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			bytes: 1048576,
			created_at: '2023-12-11T10:30:00Z',
			updated_at: '2023-12-11T10:30:00Z'
		},
		{
			name: '广告投放数据.json',
			file_id: 'file_marketing_007',
			public: true,
			status: 'upload_failed',
			content_type: 'application/json',
			bytes: 262144,
			created_at: '2023-12-10T15:20:00Z',
			updated_at: '2023-12-10T15:20:00Z'
		}
	],
	hr_documents: [
		{
			name: '员工手册.pdf',
			file_id: 'file_hr_001',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 4194304,
			created_at: '2023-12-09T08:30:00Z',
			updated_at: '2023-12-09T08:30:00Z'
		},
		{
			name: '薪酬福利制度.docx',
			file_id: 'file_hr_002',
			public: false,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			bytes: 1048576,
			created_at: '2023-12-08T12:40:00Z',
			updated_at: '2023-12-08T12:40:00Z'
		},
		{
			name: '招聘流程指南.pptx',
			file_id: 'file_hr_003',
			public: true,
			status: 'indexing',
			content_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			bytes: 8388608,
			created_at: '2023-12-07T15:10:00Z',
			updated_at: '2023-12-07T15:10:00Z'
		},
		{
			name: '绩效考核表模板.xlsx',
			file_id: 'file_hr_004',
			public: false,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			bytes: 512000,
			created_at: '2023-12-06T09:50:00Z',
			updated_at: '2023-12-06T09:50:00Z'
		}
	],
	project_docs: [
		{
			name: '项目需求规格书.docx',
			file_id: 'file_project_001',
			public: true,
			status: 'indexed',
			content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			bytes: 2097152,
			created_at: '2023-12-05T10:00:00Z',
			updated_at: '2023-12-05T10:00:00Z'
		},
		{
			name: '系统设计文档.pdf',
			file_id: 'file_project_002',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 8388608,
			created_at: '2023-12-04T13:30:00Z',
			updated_at: '2023-12-04T13:30:00Z'
		},
		{
			name: '测试计划.xlsx',
			file_id: 'file_project_003',
			public: false,
			status: 'indexing',
			content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			bytes: 1048576,
			created_at: '2023-12-03T16:20:00Z',
			updated_at: '2023-12-03T16:20:00Z'
		},
		{
			name: '用户故事地图.png',
			file_id: 'file_project_004',
			public: true,
			status: 'indexed',
			content_type: 'image/png',
			bytes: 4194304,
			created_at: '2023-12-02T11:45:00Z',
			updated_at: '2023-12-02T11:45:00Z'
		},
		{
			name: '项目里程碑计划.pptx',
			file_id: 'file_project_005',
			public: true,
			status: 'uploaded',
			content_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			bytes: 16777216,
			created_at: '2023-12-01T14:25:00Z',
			updated_at: '2023-12-01T14:25:00Z'
		},
		{
			name: '风险评估报告.pdf',
			file_id: 'file_project_006',
			public: false,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 3145728,
			created_at: '2023-11-30T09:15:00Z',
			updated_at: '2023-11-30T09:15:00Z'
		},
		{
			name: '会议纪要汇总.docx',
			file_id: 'file_project_007',
			public: true,
			status: 'index_failed',
			content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			bytes: 1572864,
			created_at: '2023-11-29T17:40:00Z',
			updated_at: '2023-11-29T17:40:00Z'
		},
		{
			name: '项目总结报告.pdf',
			file_id: 'file_project_008',
			public: true,
			status: 'indexed',
			content_type: 'application/pdf',
			bytes: 6291456,
			created_at: '2023-11-28T12:20:00Z',
			updated_at: '2023-11-28T12:20:00Z'
		}
	]
}

// 模拟API调用：获取集合列表
export const mockFetchCollections = (): Promise<Collections[]> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(mockCollections)
		}, 300) // 模拟300ms延迟
	})
}

// 模拟API调用：获取文件列表
export const mockFetchFiles = (collectionId: string): Promise<Files[]> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			const files = mockFiles[collectionId] || []
			resolve(files)
		}, 300) // 模拟300ms延迟
	})
}
