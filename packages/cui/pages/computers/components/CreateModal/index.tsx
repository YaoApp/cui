import { useState, useEffect } from 'react'
import { Modal, Input, Spin } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { mockApi } from '../../mockData'
import type { PoolInfo } from '../../types'
import styles from './index.less'

interface NodeConfigModalProps {
	open: boolean
	onCancel: () => void
}

const NodeConfigModal = ({ open, onCancel }: NodeConfigModalProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [pools, setPools] = useState<PoolInfo[]>([])
	const [loading, setLoading] = useState(false)
	const [showAdd, setShowAdd] = useState(false)
	const [newName, setNewName] = useState('')
	const [newAddr, setNewAddr] = useState('tai://')
	const [testing, setTesting] = useState(false)
	const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null)

	useEffect(() => {
		if (!open) return
		setShowAdd(false)
		setNewName('')
		setNewAddr('tai://')
		setTestResult(null)
		setLoading(true)
		mockApi.getPools().then((data) => {
			setPools(data)
			setLoading(false)
		})
	}, [open])

	const handleTest = async () => {
		if (!newAddr.trim() || newAddr.trim() === 'tai://') return
		setTesting(true)
		setTestResult(null)
		try {
			await mockApi.testNode(newAddr.trim())
			setTestResult('success')
		} catch {
			setTestResult('fail')
		} finally {
			setTesting(false)
		}
	}

	const handleAdd = async () => {
		if (!newName.trim() || !newAddr.trim() || newAddr.trim() === 'tai://') return
		if (testResult !== 'success') return
		setPools((prev) => [
			...prev,
			{
				name: newName.trim(),
				addr: newAddr.trim(),
				connected: true,
				boxes: 0,
				max_per_user: 0,
				max_total: 20,
				idle_timeout: 3600000,
				max_lifetime: 0
			}
		])
		setShowAdd(false)
		setNewName('')
		setNewAddr('tai://')
		setTestResult(null)
	}

	const handleRemove = (name: string) => {
		Modal.confirm({
			title: is_cn ? '删除节点' : 'Remove Node',
			content: is_cn
				? `确定删除节点「${name}」？该节点上的算力和工作空间将不可用。`
				: `Remove node "${name}"? Compute resources and workspaces on this node will become unavailable.`,
			okText: is_cn ? '删除' : 'Remove',
			cancelText: is_cn ? '取消' : 'Cancel',
			okButtonProps: { danger: true },
			onOk: () => {
				setPools((prev) => prev.filter((p) => p.name !== name))
			}
		})
	}

	return (
		<Modal
			open={open}
			onCancel={onCancel}
			footer={null}
			width={600}
			destroyOnClose
			style={{ top: '12vh' }}
			className={styles.modal}
		>
			<div className={styles.wrapper}>
				<div className={styles.formHeader}>
					<div className={styles.formIcon}>
						<Icon name='material-dns' size={24} />
					</div>
					<div>
						<h3 className={styles.formTitle}>
							{is_cn ? '节点管理' : 'Node Management'}
						</h3>
						<p className={styles.formDesc}>
							{is_cn
								? '管理 Tai 计算节点，添加远程节点以扩展算力'
								: 'Manage Tai compute nodes, add remote nodes to scale capacity'}
						</p>
					</div>
				</div>

				<div className={styles.nodeList}>
					{loading ? (
						<div className={styles.nodeLoading}><Spin size='small' /></div>
					) : pools.length === 0 ? (
						<div className={styles.nodeEmpty}>
							{is_cn ? '暂无节点' : 'No nodes configured'}
						</div>
					) : (
						pools.map((pool) => (
							<div key={pool.name} className={styles.nodeItem}>
								<div className={styles.nodeLeft}>
									<span className={`${styles.nodeDot} ${pool.connected ? styles.online : styles.offline}`} />
									<div className={styles.nodeInfo}>
										<span className={styles.nodeName}>{pool.name}</span>
										<span className={styles.nodeAddr}>{pool.addr}</span>
									</div>
								</div>
								<div className={styles.nodeRight}>
									<span className={styles.nodeStat}>
										{pool.boxes}/{pool.max_total || '∞'}
									</span>
									{pool.addr !== 'local' && (
										<span
											className={styles.nodeDelete}
											onClick={() => handleRemove(pool.name)}
											title={is_cn ? '删除节点' : 'Remove node'}
										>
											<Icon name='material-close' size={14} />
										</span>
									)}
								</div>
							</div>
						))
					)}
				</div>

				{showAdd ? (
					<div className={styles.addForm}>
						<div className={styles.addRow}>
							<div className={styles.addField}>
								<label>{is_cn ? '名称' : 'Name'}</label>
								<Input
									placeholder={is_cn ? '节点名称' : 'Node name'}
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
								/>
							</div>
							<div className={styles.addFieldWide}>
								<label>{is_cn ? '地址' : 'Address'}</label>
								<Input
									placeholder='tai://10.0.1.10'
									value={newAddr}
									onChange={(e) => { setNewAddr(e.target.value); setTestResult(null) }}
								/>
							</div>
						</div>
						<div className={styles.addActions}>
							<div className={styles.testArea}>
								<Button
									size='small'
									icon={<Icon name='material-speed' size={12} />}
									onClick={handleTest}
									loading={testing}
									disabled={!newAddr.trim() || newAddr.trim() === 'tai://'}
								>
									{is_cn ? '测试连接' : 'Test'}
								</Button>
								{testResult === 'success' && (
									<span className={styles.testOk}>
										<Icon name='material-check_circle' size={14} />
										{is_cn ? '连接成功' : 'Connected'}
									</span>
								)}
								{testResult === 'fail' && (
									<span className={styles.testFail}>
										<Icon name='material-error' size={14} />
										{is_cn ? '连接失败' : 'Failed'}
									</span>
								)}
							</div>
							<div className={styles.addBtns}>
								<Button size='small' onClick={() => { setShowAdd(false); setTestResult(null) }}>
									{is_cn ? '取消' : 'Cancel'}
								</Button>
								<Button
									type='primary'
									size='small'
									onClick={handleAdd}
									disabled={!newName.trim() || testResult !== 'success'}
								>
									{is_cn ? '添加' : 'Add'}
								</Button>
							</div>
						</div>
					</div>
				) : (
					<div className={styles.addEntry}>
						<Button
							size='small'
							icon={<Icon name='material-add' size={12} />}
							onClick={() => setShowAdd(true)}
						>
							{is_cn ? '添加节点' : 'Add Node'}
						</Button>
					</div>
				)}
			</div>
		</Modal>
	)
}

export default NodeConfigModal
