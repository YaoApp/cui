import { useState } from 'react'
import { Popconfirm, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { mockApi } from '../../mockData'
import type { BoxInfo } from '../../types'
import styles from './index.less'

interface ComputerDetailProps {
	box: BoxInfo
	onBack: () => void
	onRemove: () => void
	onRefresh: () => void
}

const policyLabels: Record<string, { cn: string; en: string }> = {
	persistent: { cn: '持久', en: 'Persistent' },
	longrunning: { cn: '长程', en: 'Long-running' },
	session: { cn: '会话', en: 'Session' },
	oneshot: { cn: '一次性', en: 'One-shot' }
}

const statusLabels: Record<string, { cn: string; en: string }> = {
	running: { cn: '运行中', en: 'Running' },
	stopped: { cn: '已停止', en: 'Stopped' },
	creating: { cn: '创建中', en: 'Creating' }
}

const ComputerDetail = ({ box, onBack, onRemove, onRefresh }: ComputerDetailProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [starting, setStarting] = useState(false)
	const [stopping, setStopping] = useState(false)
	const [vncUrl, setVncUrl] = useState<string | null>(null)

	const isOneShot = box.policy === 'oneshot'
	const policy = policyLabels[box.policy] || policyLabels.session
	const status = statusLabels[box.status] || statusLabels.stopped
	const labelEntries = Object.entries(box.labels)

	const handleStart = async () => {
		setStarting(true)
		try {
			await mockApi.startBox(box.id)
			message.success(is_cn ? '启动成功' : 'Started successfully')
			onRefresh()
		} catch {
			message.error(is_cn ? '启动失败' : 'Start failed')
		} finally {
			setStarting(false)
		}
	}

	const handleStop = async () => {
		setStopping(true)
		try {
			await mockApi.stopBox(box.id)
			message.success(is_cn ? '停止成功' : 'Stopped successfully')
			onRefresh()
		} catch {
			message.error(is_cn ? '停止失败' : 'Stop failed')
		} finally {
			setStopping(false)
		}
	}

	const handleVNC = async () => {
		try {
			const url = await mockApi.getVNCUrl(box.id)
			setVncUrl(url)
			window.open(url, '_blank')
		} catch {
			message.error(is_cn ? '获取 VNC 链接失败' : 'Failed to get VNC URL')
		}
	}

	return (
		<div className={styles.wrapper}>
			<div className={styles.detailHeader}>
				<div className={styles.headerLeft}>
					<div className={styles.backBtn} onClick={onBack}>
						<Icon name='material-arrow_back' size={16} />
					</div>
					<div className={styles.boxIcon}>
						<Icon name='material-computer' size={24} />
					</div>
					<div className={styles.boxInfo}>
						<h2 className={styles.boxId}>{box.id}</h2>
						<span className={styles.containerId}>
							{is_cn ? '容器' : 'Container'}: {box.container_id}
						</span>
					</div>
				</div>
				<div className={styles.headerRight}>
					{!isOneShot && (
						<>
							{box.status === 'stopped' ? (
								<Button
									type='primary'
									size='small'
									icon={<Icon name='material-play_arrow' size={12} />}
									onClick={handleStart}
									loading={starting}
								>
									{is_cn ? '启动' : 'Start'}
								</Button>
							) : box.status === 'running' ? (
								<Button
									size='small'
									icon={<Icon name='material-stop' size={12} />}
									onClick={handleStop}
									loading={stopping}
								>
									{is_cn ? '停止' : 'Stop'}
								</Button>
							) : null}
							{box.vnc && box.status === 'running' && (
								<Button
									type='primary'
									size='small'
									icon={<Icon name='material-desktop_windows' size={12} />}
									onClick={handleVNC}
								>
									{is_cn ? '打开桌面' : 'Open Desktop'}
								</Button>
							)}
							<Popconfirm
								title={
									is_cn
										? '确定要删除这台电脑吗？此操作不可恢复！'
										: 'Delete this computer? This action cannot be undone!'
								}
								onConfirm={onRemove}
								okText={is_cn ? '确认' : 'Confirm'}
								cancelText={is_cn ? '取消' : 'Cancel'}
							>
								<Button
									type='danger'
									size='small'
									icon={<Icon name='material-delete' size={12} />}
								>
									{is_cn ? '删除' : 'Delete'}
								</Button>
							</Popconfirm>
						</>
					)}
					{isOneShot && (
						<span className={styles.oneshotHint}>
							{is_cn ? '一次性电脑，仅供查看' : 'One-shot computer, view only'}
						</span>
					)}
				</div>
			</div>

			<div className={styles.statusBar}>
				<div className={`${styles.statusIndicator} ${styles[`status_${box.status}`]}`}>
					<span className={styles.statusDot} />
					<span>{is_cn ? status.cn : status.en}</span>
				</div>
				<span className={styles.statusPolicy}>
					{is_cn ? policy.cn : policy.en}
				</span>
				{box.process_count > 0 && (
					<span className={styles.statusProcess}>
						<Icon name='material-terminal' size={12} />
						{box.process_count} {is_cn ? '进程' : 'processes'}
					</span>
				)}
			</div>

			<div className={styles.infoCards}>
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '镜像' : 'Image'}</div>
					<div className={styles.infoValue}>
						<Icon name='material-layers' size={14} />
						<span className={styles.monoText}>{box.image}</span>
					</div>
				</div>
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '资源池' : 'Pool'}</div>
					<div className={styles.infoValue}>
						<Icon name='material-dns' size={14} />
						<span>{box.pool}</span>
					</div>
				</div>
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '创建时间' : 'Created'}</div>
					<div className={styles.infoValue}>
						<span>{new Date(box.created_at).toLocaleString()}</span>
					</div>
				</div>
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '最后活跃' : 'Last Active'}</div>
					<div className={styles.infoValue}>
						<span>{new Date(box.last_active).toLocaleString()}</span>
					</div>
				</div>
				{box.workspace_id && (
					<div className={styles.infoCard}>
						<div className={styles.infoLabel}>{is_cn ? '工作空间' : 'Workspace'}</div>
						<div className={styles.infoValue}>
							<Icon name='material-workspaces' size={14} />
							<span className={styles.monoText}>{box.workspace_id}</span>
						</div>
					</div>
				)}
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>VNC</div>
					<div className={styles.infoValue}>
						<span>{box.vnc ? (is_cn ? '已启用' : 'Enabled') : (is_cn ? '未启用' : 'Disabled')}</span>
					</div>
				</div>
			</div>

			{labelEntries.length > 0 && (
				<div className={styles.labelsSection}>
					<div className={styles.sectionTitle}>{is_cn ? '标签' : 'Labels'}</div>
					<div className={styles.labelList}>
						{labelEntries.map(([k, v]) => (
							<span key={k} className={styles.labelChip}>
								<span className={styles.labelKey}>{k}</span>
								<span className={styles.labelVal}>{v}</span>
							</span>
						))}
					</div>
				</div>
			)}

			{box.vnc && box.status === 'running' && (
				<div className={styles.vncSection}>
					<div className={styles.sectionTitle}>{is_cn ? '远程桌面' : 'Remote Desktop'}</div>
					<div className={styles.vncCard}>
						<div className={styles.vncPlaceholder}>
							<Icon name='material-desktop_windows' size={48} />
							<div className={styles.vncText}>
								{vncUrl
									? is_cn ? 'VNC 已连接' : 'VNC Connected'
									: is_cn ? '点击下方按钮打开远程桌面' : 'Click below to open remote desktop'}
							</div>
							{vncUrl && (
								<div className={styles.vncUrl}>
									<Icon name='material-link' size={12} />
									<span>{vncUrl}</span>
								</div>
							)}
							<Button
								type='primary'
								size='small'
								icon={<Icon name='material-open_in_new' size={12} />}
								onClick={handleVNC}
								style={{ marginTop: 12 }}
							>
								{is_cn ? '打开桌面' : 'Open Desktop'}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default ComputerDetail
