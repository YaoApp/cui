import React from 'react'
import { Card, Descriptions, Tag, Divider } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from '../detail.less'
import localStyles from './index.less'

interface ScoreFormulaProps {
	chunkId: string
}

const ScoreFormula: React.FC<ScoreFormulaProps> = ({ chunkId }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 模拟当前chunk的得分数据
	const scoreData = {
		finalScore: 0.89,
		semanticScore: 0.92,
		keywordScore: 0.86,
		positionScore: 0.91,
		lengthScore: 0.87,
		frequencyScore: 0.9,
		voteScore: 0.85,
		hitScore: 0.93,
		parameters: {
			semanticWeight: 0.4,
			keywordWeight: 0.2,
			positionWeight: 0.15,
			lengthWeight: 0.1,
			frequencyWeight: 0.05,
			voteWeight: 0.05,
			hitWeight: 0.05
		}
	}

	const formulaItems = [
		{
			title: is_cn ? '语义相似度得分' : 'Semantic Similarity Score',
			score: scoreData.semanticScore,
			weight: scoreData.parameters.semanticWeight,
			formula: is_cn
				? 'cosine_similarity(query_embedding, chunk_embedding)'
				: 'cosine_similarity(query_embedding, chunk_embedding)',
			description: is_cn
				? '基于查询和文本块的向量表示计算余弦相似度'
				: 'Cosine similarity between query and chunk embeddings'
		},
		{
			title: is_cn ? '关键词匹配得分' : 'Keyword Match Score',
			score: scoreData.keywordScore,
			weight: scoreData.parameters.keywordWeight,
			formula: is_cn ? 'TF-IDF(keywords) × BM25(query, chunk)' : 'TF-IDF(keywords) × BM25(query, chunk)',
			description: is_cn
				? '基于TF-IDF和BM25算法的关键词匹配得分'
				: 'Keyword matching score based on TF-IDF and BM25'
		},
		{
			title: is_cn ? '位置权重得分' : 'Position Weight Score',
			score: scoreData.positionScore,
			weight: scoreData.parameters.positionWeight,
			formula: is_cn ? '1 / (1 + log(position_index))' : '1 / (1 + log(position_index))',
			description: is_cn ? '根据文本块在文档中的位置计算权重' : 'Weight based on chunk position in document'
		},
		{
			title: is_cn ? '长度归一化得分' : 'Length Normalization Score',
			score: scoreData.lengthScore,
			weight: scoreData.parameters.lengthWeight,
			formula: is_cn
				? 'min(chunk_length / optimal_length, 1.0)'
				: 'min(chunk_length / optimal_length, 1.0)',
			description: is_cn ? '基于文本块长度的归一化得分' : 'Normalized score based on chunk length'
		},
		{
			title: is_cn ? '频率得分' : 'Frequency Score',
			score: scoreData.frequencyScore,
			weight: scoreData.parameters.frequencyWeight,
			formula: is_cn
				? 'log(1 + hit_frequency) / log(max_frequency)'
				: 'log(1 + hit_frequency) / log(max_frequency)',
			description: is_cn ? '基于命中频率的对数归一化得分' : 'Log-normalized score based on hit frequency'
		},
		{
			title: is_cn ? '用户投票得分' : 'User Vote Score',
			score: scoreData.voteScore,
			weight: scoreData.parameters.voteWeight,
			formula: is_cn
				? '(upvotes - downvotes) / (upvotes + downvotes + 1)'
				: '(upvotes - downvotes) / (upvotes + downvotes + 1)',
			description: is_cn ? '基于用户投票的得分' : 'Score based on user votes'
		},
		{
			title: is_cn ? '命中成功率得分' : 'Hit Success Score',
			score: scoreData.hitScore,
			weight: scoreData.parameters.hitWeight,
			formula: is_cn ? 'successful_hits / total_hits' : 'successful_hits / total_hits',
			description: is_cn ? '基于命中成功率的得分' : 'Score based on hit success rate'
		}
	]

	const getScoreColor = (score: number) => {
		if (score >= 0.9) return 'success'
		if (score >= 0.7) return 'warning'
		return 'error'
	}

	return (
		<div className={styles.tabContent}>
			<div className={styles.tabHeader}>
				<div className={styles.tabTitle}>
					<Icon name='material-calculate' size={16} />
					<span>{is_cn ? '得分计算公式' : 'Score Calculation Formula'}</span>
				</div>
			</div>

			<div className={localStyles.scoreFormulaContainer}>
				{/* 最终得分 */}
				<Card
					size='small'
					className={localStyles.finalScoreCard}
					title={
						<div className={styles.cardTitle}>
							<Icon name='material-trending_up' size={16} />
							<span>{is_cn ? '最终得分' : 'Final Score'}</span>
						</div>
					}
				>
					<div className={localStyles.finalScoreContent}>
						<div className={styles.scoreValue}>
							<span className={localStyles.scoreNumber}>
								{(scoreData.finalScore * 100).toFixed(1)}%
							</span>
							<Tag
								color={getScoreColor(scoreData.finalScore)}
								className={localStyles.scoreTag}
							>
								{scoreData.finalScore >= 0.9
									? is_cn
										? '优秀'
										: 'Excellent'
									: scoreData.finalScore >= 0.7
									? is_cn
										? '良好'
										: 'Good'
									: is_cn
									? '一般'
									: 'Fair'}
							</Tag>
						</div>
						<div className={localStyles.formulaText}>
							<strong>{is_cn ? '计算公式：' : 'Formula:'}</strong>
							<code className={localStyles.formula}>
								Final_Score = Σ (component_score × weight)
							</code>
						</div>
					</div>
				</Card>

				<Divider>{is_cn ? '得分组成' : 'Score Components'}</Divider>

				{/* 各项得分详情 */}
				<div className={localStyles.scoreComponents}>
					{formulaItems.map((item, index) => (
						<Card
							key={index}
							size='small'
							className={localStyles.componentCard}
							title={
								<div className={localStyles.componentTitle}>
									<span>{item.title}</span>
									<div className={localStyles.componentScore}>
										<Tag color={getScoreColor(item.score)}>
											{(item.score * 100).toFixed(1)}%
										</Tag>
										<span className={localStyles.weightText}>
											{is_cn ? '权重' : 'Weight'}:{' '}
											{(item.weight * 100).toFixed(1)}%
										</span>
									</div>
								</div>
							}
						>
							<Descriptions column={1} size='small'>
								<Descriptions.Item label={is_cn ? '计算公式' : 'Formula'}>
									<code className={localStyles.componentFormula}>
										{item.formula}
									</code>
								</Descriptions.Item>
								<Descriptions.Item label={is_cn ? '说明' : 'Description'}>
									{item.description}
								</Descriptions.Item>
								<Descriptions.Item label={is_cn ? '权重贡献' : 'Weighted Contribution'}>
									<span className={localStyles.contribution}>
										{(item.score * item.weight * 100).toFixed(2)}%
									</span>
								</Descriptions.Item>
							</Descriptions>
						</Card>
					))}
				</div>

				<Divider>{is_cn ? '参数配置' : 'Parameter Configuration'}</Divider>

				{/* 权重配置 */}
				<Card
					size='small'
					title={
						<div className={styles.cardTitle}>
							<Icon name='material-tune' size={16} />
							<span>{is_cn ? '权重配置' : 'Weight Configuration'}</span>
						</div>
					}
				>
					<div className={localStyles.weightConfig}>
						{Object.entries(scoreData.parameters).map(([key, weight]) => {
							const labelMap: Record<string, string> = {
								semanticWeight: is_cn ? '语义相似度' : 'Semantic Similarity',
								keywordWeight: is_cn ? '关键词匹配' : 'Keyword Match',
								positionWeight: is_cn ? '位置权重' : 'Position Weight',
								lengthWeight: is_cn ? '长度归一化' : 'Length Normalization',
								frequencyWeight: is_cn ? '频率得分' : 'Frequency Score',
								voteWeight: is_cn ? '用户投票' : 'User Vote',
								hitWeight: is_cn ? '命中成功率' : 'Hit Success'
							}

							return (
								<div key={key} className={localStyles.weightItem}>
									<span className={localStyles.weightLabel}>{labelMap[key]}:</span>
									<div className={localStyles.weightBar}>
										<div
											className={localStyles.weightFill}
											style={{ width: `${weight * 100}%` }}
										/>
									</div>
									<span className={localStyles.weightValue}>
										{(weight * 100).toFixed(1)}%
									</span>
								</div>
							)
						})}
					</div>
				</Card>

				{/* 计算说明 */}
				<Card
					size='small'
					className={localStyles.explanationCard}
					title={
						<div className={styles.cardTitle}>
							<Icon name='material-info' size={16} />
							<span>{is_cn ? '计算说明' : 'Calculation Notes'}</span>
						</div>
					}
				>
					<div className={localStyles.explanationContent}>
						<ul className={localStyles.explanationList}>
							<li>
								{is_cn
									? '所有单项得分都经过归一化处理，范围在0-1之间'
									: 'All component scores are normalized to 0-1 range'}
							</li>
							<li>
								{is_cn
									? '权重之和等于1，确保最终得分在合理范围内'
									: 'Weights sum to 1, ensuring final score is in reasonable range'}
							</li>
							<li>
								{is_cn
									? '语义相似度占主导地位，体现内容相关性的重要性'
									: 'Semantic similarity dominates, reflecting importance of content relevance'}
							</li>
							<li>
								{is_cn
									? '用户行为（投票、命中）提供额外的质量信号'
									: 'User behavior (votes, hits) provides additional quality signals'}
							</li>
							<li>
								{is_cn
									? '位置和长度因素确保结果的多样性和完整性'
									: 'Position and length factors ensure result diversity and completeness'}
							</li>
						</ul>
					</div>
				</Card>
			</div>
		</div>
	)
}

export default ScoreFormula
