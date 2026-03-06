import { useState, useEffect } from 'react'
import { Modal, Input, Select } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { mockApi } from '../../mockData'
import type { NodeInfo } from '../../types'
import styles from './index.less'

interface CreateModalProps {
	open: boolean
	onSubmit: (opts: { name: string; node: string; labels?: Record<string, string> }) => void
	onCancel: () => void
}

const CreateModal = ({ open, onSubmit, onCancel }: CreateModalProps) => {
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
		if (!open) return
		setName('')
		setNode('')
		setLabels([])
		setLabelKey('')
		setLabelVal('')
		mockApi.getNodes().then((data) => {
			setNodes(data)
			const onlineNode = data.find((n) => n.online)
			if (onlineNode) setNode(onlineNode.name)
		})
	}, [open])

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
		<Modal
			open={open}
			onCancel={onCancel}
			footer={null}
			width={520}
			destroyOnClose
			style={{ top: '12vh' }}
			className={styles.modal}
		>
			<div className={styles.wrapper}>
				<div className={styles.formHeader}>
					<div className={styles.formIcon}>
						<Icon name='material-add_circle' size={24} />
					</div>
					<div>
						<h3 className={styles.formTitle}>
							{is_cn ? '创建工作空间' : 'Create Workspace'}
						</h3>
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
							placeholder={is_cn ? '输入工作空间名称...' : 'Enter workspace name...'}
							value={name}
							onChange={(e) => setName(e.target.value)}
							onPressEnter={() => isValid && !submitting && handleSubmit()}
						/>
					</div>

					<div className={styles.field}>
						<label className={styles.fieldLabel}>
							{is_cn ? '目标节点' : 'Target Node'} <span>*</span>
						</label>
						<Select
							value={node || undefined}
							onChange={setNode}
							placeholder={is_cn ? '选择节点...' : 'Select a node...'}
							style={{ width: '100%' }}
							options={nodes.map((n) => ({
								value: n.name,
								label: (
									<div className={styles.nodeOption}>
										<span className={`${styles.nodeStatus} ${n.online ? styles.online : styles.offline}`} />
										<span>{n.name}</span>
										<span className={styles.nodeAddr}>{n.addr}</span>
									</div>
								),
								disabled: !n.online
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
								onPressEnter={addLabel}
								style={{ flex: 1 }}
							/>
							<Input
								placeholder={is_cn ? '值' : 'Value'}
								value={labelVal}
								onChange={(e) => setLabelVal(e.target.value)}
								onPressEnter={addLabel}
								style={{ flex: 1 }}
							/>
							<Button
								size='small'
								icon={<Icon name='material-add' size={12} />}
								onClick={addLabel}
							/>
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
					<Button
						size='small'
						icon={<Icon name='icon-x' size={12} />}
						onClick={onCancel}
					>
						{is_cn ? '取消' : 'Cancel'}
					</Button>
					<Button
						type='primary'
						size='small'
						icon={<Icon name='material-add_circle' size={12} />}
						onClick={handleSubmit}
						disabled={!isValid}
						loading={submitting}
					>
						{is_cn ? '创建空间' : 'Create Workspace'}
					</Button>
				</div>
			</div>
		</Modal>
	)
}

export default CreateModal
