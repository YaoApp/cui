import React, { useState } from 'react'
import { Dropdown, Button, Modal, message, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { Document, CollectionInfo, KB } from '@/openapi'
import styles from './index.less'

interface ActionsProps {
	document: Document | null
	collectionInfo: CollectionInfo | null
	onDocumentDeleted?: () => void
	onDocumentUpdated?: () => void
}

const Actions: React.FC<ActionsProps> = ({ document, collectionInfo, onDocumentDeleted, onDocumentUpdated }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [loading, setLoading] = useState<string | null>(null)

	// 智能设置分段权重
	const handleSetSegmentWeights = async () => {
		if (!document) return

		Modal.confirm({
			title: is_cn ? '智能权重' : 'Smart Weighting',
			content: is_cn
				? '系统将基于内容重要性自动为所有分段设置权重，这将影响检索时的相关性排序。是否继续？'
				: 'The system will automatically set weights for all segments based on content importance, which will affect relevance ranking during retrieval. Continue?',
			icon: <ExclamationCircleOutlined />,
			onOk: async () => {
				setLoading('weights')
				try {
					// TODO: 调用智能设置权重API
					await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟API调用
					message.success(is_cn ? '分段权重设置完成' : 'Segment weights set successfully')
					onDocumentUpdated?.()
				} catch (error) {
					console.error('Failed to set segment weights:', error)
					message.error(is_cn ? '设置分段权重失败' : 'Failed to set segment weights')
				} finally {
					setLoading(null)
				}
			}
		})
	}

	// 智能评分评估
	const handleScoreEvaluation = async () => {
		if (!document) return

		Modal.confirm({
			title: is_cn ? '智能评分' : 'Smart Scoring',
			content: is_cn
				? '系统将对所有分段进行质量评估并打分，评估结果将用于优化检索效果。是否继续？'
				: 'The system will evaluate and score the quality of all segments. The evaluation results will be used to optimize retrieval performance. Continue?',
			icon: <ExclamationCircleOutlined />,
			onOk: async () => {
				setLoading('scoring')
				try {
					// TODO: 调用智能评分API
					await new Promise((resolve) => setTimeout(resolve, 1500)) // 模拟API调用
					message.success(is_cn ? '分段评分评估完成' : 'Segment scoring evaluation completed')
					onDocumentUpdated?.()
				} catch (error) {
					console.error('Failed to evaluate segment scores:', error)
					message.error(is_cn ? '评分评估失败' : 'Failed to evaluate segment scores')
				} finally {
					setLoading(null)
				}
			}
		})
	}

	// 重新分段
	const handleResegment = async () => {
		if (!document) return

		Modal.confirm({
			title: is_cn ? '重新分段' : 'Re-segment Document',
			content: is_cn
				? '重新分段将清除当前所有分段信息，并重新处理文档内容。此操作不可撤销，是否继续？'
				: 'Re-segmenting will clear all current segment information and reprocess the document content. This operation cannot be undone. Continue?',
			icon: <ExclamationCircleOutlined />,
			okType: 'danger',
			onOk: async () => {
				setLoading('resegment')
				try {
					// TODO: 调用重新分段API
					await new Promise((resolve) => setTimeout(resolve, 2000)) // 模拟API调用
					message.success(is_cn ? '文档重新分段已开始' : 'Document re-segmentation started')
					onDocumentUpdated?.()
				} catch (error) {
					console.error('Failed to resegment document:', error)
					message.error(is_cn ? '重新分段失败' : 'Failed to resegment document')
				} finally {
					setLoading(null)
				}
			}
		})
	}

	// 删除文档
	const handleDeleteDocument = async () => {
		if (!document) return

		Modal.confirm({
			title: is_cn ? '删除文档' : 'Delete Document',
			content: is_cn
				? `确定要删除文档"${document.name}"吗？此操作将同时删除所有相关的分段信息，且不可撤销。`
				: `Are you sure you want to delete document "${document.name}"? This will also delete all related segment information and cannot be undone.`,
			icon: <ExclamationCircleOutlined />,
			okType: 'danger',
			okText: is_cn ? '删除' : 'Delete',
			cancelText: is_cn ? '取消' : 'Cancel',
			onOk: async () => {
				setLoading('delete')
				try {
					const kb = new KB(window.$app.openapi)
					const response = await kb.RemoveDocs([document.document_id])

					if (window.$app.openapi.IsError(response)) {
						console.error('Failed to delete document:', response.error)
						message.error(is_cn ? '删除文档失败' : 'Failed to delete document')
						return
					}

					message.success(is_cn ? '文档删除成功' : 'Document deleted successfully')
					onDocumentDeleted?.()
				} catch (error) {
					console.error('Failed to delete document:', error)
					message.error(is_cn ? '删除文档失败' : 'Failed to delete document')
				} finally {
					setLoading(null)
				}
			}
		})
	}

	const menuItems: MenuProps['items'] = [
		{
			key: 'weights',
			label: is_cn ? '智能权重' : 'Smart Weighting',
			icon: <Icon name='material-tune' size={16} />,
			onClick: handleSetSegmentWeights,
			disabled: loading !== null
		},
		{
			key: 'scoring',
			label: is_cn ? '智能评分' : 'Smart Scoring',
			icon: <Icon name='material-assessment' size={16} />,
			onClick: handleScoreEvaluation,
			disabled: loading !== null
		},
		{
			type: 'divider'
		},
		{
			key: 'resegment',
			label: is_cn ? '重新分段' : 'Re-segment',
			icon: <Icon name='material-refresh' size={16} />,
			onClick: handleResegment,
			disabled: loading !== null
		},
		{
			type: 'divider'
		},
		{
			key: 'delete',
			label: <span style={{ color: 'var(--color_danger)' }}>{is_cn ? '删除文档' : 'Delete'}</span>,
			icon: <Icon name='material-delete' size={16} style={{ color: 'var(--color_danger)' }} />,
			onClick: handleDeleteDocument,
			disabled: loading !== null
		}
	]

	return (
		<Dropdown
			menu={{ items: menuItems }}
			trigger={['click']}
			placement='bottomRight'
			overlayStyle={{
				borderRadius: 'var(--radius)',
				border: '1px solid var(--color_neo_border_card)',
				boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
			}}
		>
			<Tooltip title={is_cn ? '更多操作' : 'More Actions'}>
				<Button
					type='text'
					icon={<Icon name='material-more_vert' size={16} />}
					className={styles.moreButton}
					loading={loading !== null}
				/>
			</Tooltip>
		</Dropdown>
	)
}

export default Actions
