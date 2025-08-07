import React from 'react'
import { Select, InputNumber, Switch, Input, Slider } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { AddDocumentData } from '../../index'
import styles from '../../index.less'

interface AdvancedTabProps {
	data: AddDocumentData
	options: any
	onOptionsChange: (options: any) => void
}

const AdvancedTab: React.FC<AdvancedTabProps> = ({ data, options, onOptionsChange }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const embeddingModels = [
		{ value: 'text-embedding-ada-002', label: 'OpenAI Ada-002' },
		{ value: 'text-embedding-3-small', label: 'OpenAI Embedding-3-Small' },
		{ value: 'text-embedding-3-large', label: 'OpenAI Embedding-3-Large' },
		{ value: 'bge-large-zh', label: 'BGE Large Chinese' },
		{ value: 'bge-base-en', label: 'BGE Base English' }
	]

	const preprocessingOptions = [
		{ value: 'clean_html', label: is_cn ? '清理HTML标签' : 'Clean HTML Tags' },
		{ value: 'remove_urls', label: is_cn ? '移除URL链接' : 'Remove URLs' },
		{ value: 'normalize_whitespace', label: is_cn ? '标准化空白字符' : 'Normalize Whitespace' },
		{ value: 'remove_duplicates', label: is_cn ? '去除重复内容' : 'Remove Duplicates' }
	]

	return (
		<div className={styles.advancedTab}>
			{/* 向量化配置 */}
			<div className={styles.configSection}>
				<div className={styles.sectionTitle}>
					<Icon name='material-psychology' size={14} />
					<span>{is_cn ? '向量化配置' : 'Vectorization Configuration'}</span>
				</div>

				<div className={styles.configGrid}>
					<div className={styles.configItem}>
						<div className={styles.configLabel}>{is_cn ? '嵌入模型' : 'Embedding Model'}</div>
						<div className={styles.configDescription}>
							{is_cn
								? '选择用于生成文本向量的模型'
								: 'Choose the model for generating text embeddings'}
						</div>
						<Select
							value={options.embeddingModel || 'text-embedding-ada-002'}
							onChange={(value) => onOptionsChange({ embeddingModel: value })}
							style={{ width: '100%' }}
							options={embeddingModels}
						/>
					</div>

					<div className={styles.configItem}>
						<div className={styles.configLabel}>{is_cn ? '向量维度' : 'Vector Dimensions'}</div>
						<div className={styles.configDescription}>
							{is_cn ? '嵌入向量的维度大小' : 'The dimension size of embedding vectors'}
						</div>
						<InputNumber
							value={options.vectorDimensions || 1536}
							onChange={(value) => onOptionsChange({ vectorDimensions: value })}
							min={128}
							max={4096}
							step={128}
							style={{ width: '100%' }}
						/>
					</div>
				</div>
			</div>

			{/* 预处理配置 */}
			<div className={styles.configSection}>
				<div className={styles.sectionTitle}>
					<Icon name='material-auto_fix_high' size={14} />
					<span>{is_cn ? '预处理配置' : 'Preprocessing Configuration'}</span>
				</div>

				<div className={styles.configGrid}>
					<div className={styles.configItem}>
						<div className={styles.configLabel}>
							{is_cn ? '文本清理选项' : 'Text Cleaning Options'}
						</div>
						<div className={styles.configDescription}>
							{is_cn
								? '选择要应用的文本预处理操作'
								: 'Select text preprocessing operations to apply'}
						</div>
						<Select
							mode='multiple'
							value={options.preprocessing || []}
							onChange={(value) => onOptionsChange({ preprocessing: value })}
							style={{ width: '100%' }}
							options={preprocessingOptions}
							placeholder={is_cn ? '选择预处理选项' : 'Select preprocessing options'}
						/>
					</div>

					<div className={styles.configItem}>
						<div className={styles.configLabel}>
							{is_cn ? '最小文本长度' : 'Minimum Text Length'}
						</div>
						<div className={styles.configDescription}>
							{is_cn
								? '忽略小于此长度的文本块'
								: 'Ignore text chunks shorter than this length'}
						</div>
						<InputNumber
							value={options.minTextLength || 50}
							onChange={(value) => onOptionsChange({ minTextLength: value })}
							min={10}
							max={1000}
							step={10}
							style={{ width: '100%' }}
						/>
					</div>
				</div>
			</div>

			{/* 索引配置 */}
			<div className={styles.configSection}>
				<div className={styles.sectionTitle}>
					<Icon name='material-storage' size={14} />
					<span>{is_cn ? '索引配置' : 'Index Configuration'}</span>
				</div>

				<div className={styles.configGrid}>
					<div className={styles.configItem}>
						<div className={styles.configLabel}>
							{is_cn ? '相似度阈值' : 'Similarity Threshold'}
						</div>
						<div className={styles.configDescription}>
							{is_cn
								? '用于检索的最小相似度分数'
								: 'Minimum similarity score for retrieval'}
						</div>
						<Slider
							value={options.similarityThreshold || 0.7}
							onChange={(value) => onOptionsChange({ similarityThreshold: value })}
							min={0.1}
							max={1.0}
							step={0.05}
							marks={{
								0.1: '0.1',
								0.5: '0.5',
								0.9: '0.9'
							}}
						/>
					</div>

					<div className={styles.configItem}>
						<div className={styles.configLabel}>{is_cn ? '批处理大小' : 'Batch Size'}</div>
						<div className={styles.configDescription}>
							{is_cn
								? '每批处理的文本块数量'
								: 'Number of text chunks to process per batch'}
						</div>
						<InputNumber
							value={options.batchSize || 32}
							onChange={(value) => onOptionsChange({ batchSize: value })}
							min={1}
							max={128}
							step={8}
							style={{ width: '100%' }}
						/>
					</div>
				</div>
			</div>

			{/* 元数据配置 */}
			<div className={styles.configSection}>
				<div className={styles.sectionTitle}>
					<Icon name='material-label' size={14} />
					<span>{is_cn ? '元数据配置' : 'Metadata Configuration'}</span>
				</div>

				<div className={styles.configGrid}>
					<div className={styles.configItem}>
						<div className={styles.configLabel}>{is_cn ? '自定义标签' : 'Custom Tags'}</div>
						<div className={styles.configDescription}>
							{is_cn
								? '为此文档添加自定义标签（用逗号分隔）'
								: 'Add custom tags for this document (comma-separated)'}
						</div>
						<Input
							value={options.customTags || ''}
							onChange={(e) => onOptionsChange({ customTags: e.target.value })}
							placeholder={is_cn ? '标签1, 标签2, 标签3' : 'tag1, tag2, tag3'}
							style={{ width: '100%' }}
						/>
					</div>

					<div className={styles.configItem}>
						<div className={styles.configLabel}>
							{is_cn ? '保留原始格式' : 'Preserve Original Format'}
						</div>
						<div className={styles.configDescription}>
							{is_cn
								? '是否保留文档的原始格式信息'
								: 'Whether to preserve the original format information of the document'}
						</div>
						<Switch
							checked={options.preserveFormat !== false}
							onChange={(checked) => onOptionsChange({ preserveFormat: checked })}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AdvancedTab
