import { KnowledgeBase, Document } from '../types'

// 模拟API延迟
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock数据
export const mockKnowledgeBase: KnowledgeBase = {
	id: '1',
	collection_id: 'kb_001',
	name: 'AI技术资料库',
	description: '收集了关于人工智能、机器学习、深度学习等相关技术文档和研究论文',
	uid: 'user123',
	public: true,
	readonly: false,
	system: false,
	sort: 1,
	cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
	document_count: 128,
	created_at: '2024-01-15T10:30:00Z',
	updated_at: '2024-01-20T14:22:00Z'
}

export const mockDocument: Document = {
	id: '1',
	doc_id: 'doc_001',
	collection_id: 'kb_001',
	name: 'AI技术发展趋势报告.pdf',
	description: '详细分析了人工智能技术的发展现状、主要趋势和未来展望',
	uid: 'user123',
	cover: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop',
	knowledge_base_name: 'AI技术资料库',
	chunk_count: 45,
	status: 'ready',
	file_size: 2485760, // 2.4MB
	content: `# AI技术发展趋势报告

## 摘要

人工智能（AI）技术正在快速发展，从机器学习到深度学习，从自然语言处理到计算机视觉，AI正在改变我们的生活和工作方式。本报告深入分析了当前AI技术的发展状况，探讨了主要的技术趋势，并对未来的发展方向进行了预测。

## 1. 引言

人工智能作为21世纪最重要的技术之一，正在各个领域产生深远的影响。从智能助手到自动驾驶，从医疗诊断到金融分析，AI技术的应用范围在不断扩展。

## 2. 当前技术状况

### 2.1 机器学习

机器学习是AI的核心技术之一，包括监督学习、无监督学习和强化学习。当前主要的发展方向包括：

- 深度学习网络的优化
- 联邦学习技术的推广
- AutoML的普及应用

### 2.2 自然语言处理

大语言模型（LLM）的出现标志着NLP技术的重大突破：

- GPT系列模型的演进
- 多模态大模型的发展
- 专业领域模型的定制化

### 2.3 计算机视觉

计算机视觉技术在精度和效率上都有显著提升：

- 目标检测算法的优化
- 图像生成技术的突破
- 3D视觉理解的进步

## 3. 主要发展趋势

### 3.1 技术民主化

AI技术正在变得更加易用和普及：

- 低代码/无代码AI平台
- Pre-trained模型的广泛应用
- 开源AI工具的丰富

### 3.2 边缘计算

AI计算正在从云端向边缘迁移：

- 模型轻量化技术
- 边缘设备的AI芯片
- 实时处理能力的提升

### 3.3 可解释性AI

随着AI应用的深入，可解释性变得越来越重要：

- XAI技术的发展
- AI决策过程的透明化
- 伦理AI的实践

## 4. 未来展望

### 4.1 通用人工智能（AGI）

虽然还有很长的路要走，但AGI仍然是AI研究的终极目标：

- 多任务学习能力的提升
- 常识推理能力的增强
- 自主学习机制的完善

### 4.2 人机协作

未来的AI将更多地与人类协作，而不是替代：

- 人机交互界面的改进
- 协作工作流的优化
- 人类创造力的增强

### 4.3 产业变革

AI将继续推动各行各业的数字化转型：

- 智能制造的普及
- 精准医疗的发展
- 智慧城市的建设

## 5. 结论

AI技术的发展正在加速，我们正处于一个充满机遇和挑战的时代。掌握AI技术，理解其发展趋势，对于个人和企业都至关重要。

未来，我们需要在技术创新的同时，关注AI的伦理问题，确保AI技术能够真正造福人类社会。`,
	created_at: '2024-01-15T10:30:00Z',
	updated_at: '2024-01-20T14:22:00Z'
}

// Mock API 函数
export const mockFetchKnowledgeBase = async (collectionId: string): Promise<KnowledgeBase> => {
	await delay(300)
	return mockKnowledgeBase
}

export const mockFetchDocument = async (docId: string): Promise<Document> => {
	await delay(300)
	// 添加模拟文件大小（随机生成）
	return {
		...mockDocument,
		file_size: Math.floor(Math.random() * 10000000) + 100000 // 100KB 到 10MB
	}
}

export const mockFetchDocumentContent = async (docId: string): Promise<string> => {
	await delay(300)
	return mockDocument.content
}

// 原始文档Mock数据
export const mockOriginalData = Array.from({ length: 50 }, (_, index) => ({
	id: `original_${index + 1}`,
	title: `原始文档内容项 ${index + 1}`,
	content: `这是原始文档的第 ${index + 1} 个内容项，包含了完整的文档内容...`,
	type: 'original'
}))

// 内容分段Mock数据
export const mockChunksData = Array.from({ length: 50 }, (_, index) => ({
	id: `chunk_${index + 1}`,
	title: `内容分段 ${index + 1}`,
	content: `这是经过分段处理的第 ${index + 1} 个内容块，便于检索和理解...`,
	type: 'chunk',
	chunkIndex: index + 1,
	tokens: Math.floor(Math.random() * 500) + 100, // 随机token数量
	similarity: Math.random() * 0.3 + 0.7 // 随机相似度
}))
