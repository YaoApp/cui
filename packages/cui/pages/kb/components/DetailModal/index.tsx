import React, { useState } from 'react'
import { Modal, Button, Tooltip, Typography, Tag, Space, Collapse, Row, Col, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { DetailModalProps, DetailField, DetailSection } from './types'
import styles from './index.less'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

// JSON 高亮渲染组件
const JSONCode: React.FC<{ data: any }> = ({ data }) => {
	const jsonString = JSON.stringify(data, null, 2)

	const highlightedJSON = jsonString
		.replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
		.replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
		.replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
		.replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
		.replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')

	return (
		<div className={styles.jsonCode}>
			<pre dangerouslySetInnerHTML={{ __html: highlightedJSON }} />
		</div>
	)
}

// 渲染字段值
const renderFieldValue = (field: DetailField, record: any) => {
	const { value, type = 'text', render, copyable } = field

	if (render) {
		return render(value, record)
	}

	let content: React.ReactNode = value

	switch (type) {
		case 'tag':
			content = <Tag className={styles.fieldTag}>{value}</Tag>
			break
		case 'time':
			content = value ? new Date(value).toLocaleString() : '-'
			break
		case 'json':
			content = <JSONCode data={value} />
			break
		case 'text':
		default:
			content = value || '-'
			break
	}

	if (copyable && type !== 'json') {
		return (
			<Paragraph copyable={{ text: String(value) }} className={styles.copyableText}>
				{content}
			</Paragraph>
		)
	}

	return content
}

function DetailModal<T extends Record<string, any>>({
	visible,
	onClose,
	title,
	width = '90%',
	height,
	data,
	loading = false,
	sections = [],
	actions = [],
	size = 'middle',
	bodyStyle,
	children,
	onRefresh
}: DetailModalProps<T>) {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [collapsedPanels, setCollapsedPanels] = useState<string[]>([])

	// 处理操作按钮点击
	const handleAction = (action: any) => {
		if (action.disabled && action.disabled(data)) {
			return
		}
		action.onClick?.(data)
	}

	// 渲染操作按钮
	const renderActions = () => {
		if (actions.length === 0) return null

		const visibleActions = actions.filter((action) => (action.visible ? action.visible(data) : true))

		if (visibleActions.length === 0) return null

		return (
			<>
				{visibleActions.map((action) => (
					<Tooltip key={action.key} title={action.label}>
						<Button
							type='text'
							icon={action.icon}
							danger={action.danger}
							disabled={action.disabled ? action.disabled(data) : false}
							onClick={() => handleAction(action)}
							size='small'
							className={styles.headerButton}
						/>
					</Tooltip>
				))}
			</>
		)
	}

	// 渲染字段
	const renderFields = (fields: DetailField[]) => {
		return (
			<Row gutter={[16, 12]}>
				{fields.map((field) => (
					<Col key={field.key} span={field.span || 12}>
						{field.type === 'json' ? (
							// JSON类型直接显示内容，不显示Label和边框
							<div className={styles.jsonFieldItem}>{renderFieldValue(field, data)}</div>
						) : (
							// 其他类型显示Label和边框
							<div className={styles.fieldItem}>
								<div className={styles.fieldLabel}>{field.label}</div>
								<div className={styles.fieldValue}>{renderFieldValue(field, data)}</div>
							</div>
						)}
					</Col>
				))}
			</Row>
		)
	}

	// 渲染内容区域
	const renderContent = () => {
		if (loading) {
			return (
				<div className={styles.loadingContainer}>
					<Icon name='material-hourglass_empty' size={32} />
					<Text type='secondary'>{is_cn ? '加载中...' : 'Loading...'}</Text>
				</div>
			)
		}

		if (!data) {
			return (
				<div className={styles.emptyContainer}>
					<Text type='secondary'>{is_cn ? '暂无数据' : 'No data available'}</Text>
				</div>
			)
		}

		// 如果有自定义内容，优先显示
		if (children) {
			return <div className={styles.customContent}>{children}</div>
		}

		// 渲染配置的sections
		if (sections.length === 0) {
			return (
				<div className={styles.emptyContainer}>
					<Text type='secondary'>{is_cn ? '未配置显示内容' : 'No content configured'}</Text>
				</div>
			)
		}

		return (
			<div className={styles.sectionsContainer}>
				{sections.map((section, index) => {
					if (section.collapsible) {
						return (
							<Collapse
								key={index}
								defaultActiveKey={section.defaultCollapsed ? [] : ['panel']}
								className={styles.sectionCollapse}
							>
								<Panel
									header={
										section.title ||
										`${is_cn ? '部分' : 'Section'} ${index + 1}`
									}
									key='panel'
								>
									{renderFields(section.fields)}
								</Panel>
							</Collapse>
						)
					}

					return (
						<div key={index} className={styles.section}>
							{section.title && <div className={styles.sectionTitle}>{section.title}</div>}
							<div className={styles.sectionContent}>{renderFields(section.fields)}</div>
						</div>
					)
				})}
			</div>
		)
	}

	// 计算弹窗样式 - 自适应内容高度，但限制最大高度
	const modalStyle: React.CSSProperties = {
		top: '5vh',
		paddingBottom: 0,
		maxWidth: 'none',
		maxHeight: '90vh' // 设置Modal最大高度
	}

	const modalBodyStyle: React.CSSProperties = {
		padding: 0,
		overflow: 'hidden',
		...bodyStyle
	}

	return (
		<Modal
			open={visible}
			onCancel={onClose}
			title={null}
			width={width}
			footer={null}
			className={`${styles.detailModal} ${styles[size]}`}
			style={modalStyle}
			bodyStyle={modalBodyStyle}
			closable={false}
			destroyOnClose
		>
			<div className={styles.modalContent}>
				{/* 自定义头部 */}
				<div className={styles.header}>
					<div className={styles.headerLeft}>
						<h1 className={styles.title}>{title || (is_cn ? '详情' : 'Details')}</h1>
					</div>
					<div className={styles.headerRight}>
						{renderActions()}
						{onRefresh && (
							<Tooltip title={is_cn ? '刷新' : 'Refresh'}>
								<Button
									type='text'
									icon={<Icon name='material-refresh' size={16} />}
									onClick={onRefresh}
									className={styles.headerButton}
								/>
							</Tooltip>
						)}
						<Button
							type='text'
							icon={<Icon name='material-close' size={16} />}
							className={styles.closeButton}
							onClick={onClose}
						/>
					</div>
				</div>

				{/* 内容区域 */}
				<div className={styles.content}>
					<div className={styles.modalBody}>{renderContent()}</div>
				</div>
			</div>
		</Modal>
	)
}

export default DetailModal
