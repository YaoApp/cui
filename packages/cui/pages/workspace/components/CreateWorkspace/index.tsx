import { useState, useEffect } from 'react'
import { Input, Select } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { NodesAPI } from '@/openapi/nodes'
import { nodeName, nodeDetail, type NodeInfo } from '../../types'
import styles from './index.less'

interface CreateWorkspaceProps {
	onSubmit: (opts: { name: string; node: string; labels?: Record<string, string> }) => void
	onCancel: () => void
}

const CreateWorkspace = ({ onSubmit, onCancel }: CreateWorkspaceProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [name, setName] = useState('')
	const [node, setNode] = useState('')
	const [nodes, setNodes] = useState<NodeInfo[]>([])
	const [labelKey, setLabelKey] = useState('')
	const [labelVal, setLabelVal] = useState('')
	const [labels, setLabels] = useState<Array<{ key: string; value: string }>>([])
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		const api = window.$app?.openapi ? new NodesAPI(window.$app.openapi) : null
		if (!api) return
		api.List().then((resp) => {
			if (!window.$app.openapi.IsError(resp)) {
				const data = window.$app.openapi.GetData(resp) || []
				setNodes(data)
				const onlineNode = data.find((n) => n.status === 'online')
				if (onlineNode) setNode(onlineNode.tai_id)
			}
		})
	}, [])

	const addLabel = () => {
		if (!labelKey.trim() || !labelVal.trim()) return
		if (labels.some((l) => l.key === labelKey.trim())) return
		setLabels((prev) => [...prev, { key: labelKey.trim(), value: labelVal.trim() }])
		setLabelKey('')
		setLabelVal('')
	}

	const removeLabel = (key: string) => {
		setLabels((prev) => prev.filter((l) => l.key !== key))
	}

	const handleSubmit = async () => {
		if (!name.trim() || !node) return
		setSubmitting(true)
		try {
			const labelMap: Record<string, string> = {}
			labels.forEach((l) => {
				labelMap[l.key] = l.value
			})
			await onSubmit({ name: name.trim(), node, labels: labelMap })
		} finally {
			setSubmitting(false)
		}
	}

	const isValid = name.trim().length > 0 && node.length > 0

	return (
		<div className={styles.wrapper}>
			<div className={styles.formHeader}>
				<div className={styles.formIcon}>
					<Icon name='material-add_circle' size={28} />
				</div>
				<div>
					<h2 className={styles.formTitle}>
						{is_cn ? '创建工作空间' : 'Create Workspace'}
					</h2>
					<p className={styles.formDesc}>
						{is_cn
							? '在指定节点上创建一个新的隔离工作空间'
							: 'Create a new isolated workspace on a target node'}
					</p>
				</div>
			</div>

			<div className={styles.formBody}>
				<div className={styles.field}>
					<label className={styles.fieldLabel}>
						{is_cn ? '空间名称' : 'Workspace Name'} <span>*</span>
					</label>
					<Input
						size='large'
						placeholder={is_cn ? '输入工作空间名称...' : 'Enter workspace name...'}
						value={name}
						onChange={(e) => setName(e.target.value)}
						className={styles.input}
					/>
				</div>

				<div className={styles.field}>
					<label className={styles.fieldLabel}>
						{is_cn ? '目标节点' : 'Target Node'} <span>*</span>
					</label>
					<Select
						size='large'
						value={node || undefined}
						onChange={setNode}
						placeholder={is_cn ? '选择节点...' : 'Select a node...'}
						className={styles.select}
						options={nodes.map((n) => ({
							value: n.tai_id,
							label: (
								<div className={styles.nodeOption}>
									<span className={`${styles.nodeStatus} ${n.status === 'online' ? styles.online : styles.offline}`} />
									<span>{nodeName(n)}</span>
									<span className={styles.nodeAddr}>{nodeDetail(n)}</span>
								</div>
							),
							disabled: n.status !== 'online'
						}))}
					/>
				</div>

				<div className={styles.field}>
					<label className={styles.fieldLabel}>{is_cn ? '标签' : 'Labels'}</label>
					<div className={styles.labelInput}>
						<Input
							placeholder={is_cn ? '键' : 'Key'}
							value={labelKey}
							onChange={(e) => setLabelKey(e.target.value)}
							className={styles.labelKeyInput}
							onPressEnter={addLabel}
						/>
						<Input
							placeholder={is_cn ? '值' : 'Value'}
							value={labelVal}
							onChange={(e) => setLabelVal(e.target.value)}
							className={styles.labelValInput}
							onPressEnter={addLabel}
						/>
						<div className={styles.addLabelBtn} onClick={addLabel}>
							<Icon name='material-add' size={16} />
						</div>
					</div>
					{labels.length > 0 && (
						<div className={styles.labelTags}>
							{labels.map((l) => (
								<span key={l.key} className={styles.labelTag}>
									<span className={styles.labelTagKey}>{l.key}</span>
									<span className={styles.labelTagVal}>{l.value}</span>
									<span className={styles.labelTagRemove} onClick={() => removeLabel(l.key)}>
										<Icon name='material-close' size={10} />
									</span>
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			<div className={styles.formFooter}>
				<div className={styles.cancelBtn} onClick={onCancel}>
					{is_cn ? '取消' : 'Cancel'}
				</div>
				<div
					className={`${styles.submitBtn} ${!isValid || submitting ? styles.disabled : ''}`}
					onClick={() => isValid && !submitting && handleSubmit()}
				>
					{submitting
						? is_cn ? '创建中...' : 'Creating...'
						: is_cn ? '创建空间' : 'Create Workspace'}
				</div>
			</div>
		</div>
	)
}

export default CreateWorkspace
