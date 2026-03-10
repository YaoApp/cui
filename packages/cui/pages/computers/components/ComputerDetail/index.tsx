import { useState } from 'react'
import { Popconfirm, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Sandbox } from '@/openapi/sandbox'
import { brandIcons } from '@/assets/icons/brands'
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

const formatMemory = (bytes?: number): string => {
	if (!bytes) return '—'
	const gb = bytes / (1024 * 1024 * 1024)
	if (gb >= 1) return `${gb.toFixed(1)} GB`
	const mb = bytes / (1024 * 1024)
	return `${mb.toFixed(0)} MB`
}

const ComputerDetail = ({ box, onBack, onRemove, onRefresh }: ComputerDetailProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [vncUrl, setVncUrl] = useState<string | null>(null)

	const isOneShot = box.policy === 'oneshot'
	const isHost = box.kind === 'host'
	const policy = box.policy ? (policyLabels[box.policy] || policyLabels.session) : null
	const status = statusLabels[box.status] || statusLabels.stopped
	const labelEntries = Object.entries(box.labels || {})
	const sys = box.system
	const os = (sys?.os || '').toLowerCase()
	const osSvg = box.kind === 'box' ? brandIcons['linux'] : (brandIcons[os] || null)
	const kindIcon = isHost ? 'material-computer' : 'material-memory'

	const handleVNC = async () => {
		if (!window.$app?.openapi) return
		const api = new Sandbox(window.$app.openapi)
		const url = api.GetViewerURL(box.id)
		setVncUrl(url)
		window.open(url, '_blank')
	}

	return (
		<div className={styles.wrapper}>
			<div className={styles.detailHeader}>
				<div className={styles.headerLeft}>
					<div className={styles.backBtn} onClick={onBack}>
						<Icon name='material-arrow_back' size={16} />
					</div>
					<div className={styles.boxIcon}>
						{osSvg
							? <img className={styles.brandIcon} src={osSvg} />
							: <Icon name={kindIcon} size={24} />
						}
					</div>
					<div className={styles.boxInfo}>
						<h2 className={styles.boxId}>{box.display_name}</h2>
						<span className={styles.containerId}>ID: {box.id}</span>
					</div>
				</div>
				<div className={styles.headerRight}>
					{!isOneShot && !isHost && (
						<>
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
				{policy && (
					<span className={styles.statusPolicy}>
						{is_cn ? policy.cn : policy.en}
					</span>
				)}
				{box.process_count > 0 && (
					<span className={styles.statusProcess}>
						<Icon name='material-terminal' size={12} />
						{box.process_count} {is_cn ? '进程' : 'processes'}
					</span>
				)}
			</div>

			<div className={styles.infoCards}>
				{box.image && (
					<div className={styles.infoCard}>
						<div className={styles.infoLabel}>{is_cn ? '镜像' : 'Image'}</div>
						<div className={styles.infoValue}>
							<Icon name='material-layers' size={14} />
							<span className={styles.monoText}>{box.image}</span>
						</div>
					</div>
				)}
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '节点' : 'Node'}</div>
					<div className={styles.infoValue}>
						<Icon name='material-bolt' size={14} />
						<span className={styles.monoText}>{box.addr || box.node_id}</span>
					</div>
				</div>
				{box.container_id && (
					<div className={styles.infoCard}>
						<div className={styles.infoLabel}>{is_cn ? '容器' : 'Container'}</div>
						<div className={styles.infoValue}>
							<Icon name='material-widgets' size={14} />
							<span className={styles.monoText}>{box.container_id}</span>
						</div>
					</div>
				)}
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '创建时间' : 'Created'}</div>
					<div className={styles.infoValue}>
						<span>{box.created_at ? new Date(box.created_at).toLocaleString() : '—'}</span>
					</div>
				</div>
				<div className={styles.infoCard}>
					<div className={styles.infoLabel}>{is_cn ? '最后活跃' : 'Last Active'}</div>
					<div className={styles.infoValue}>
						<span>{box.last_active ? new Date(box.last_active).toLocaleString() : '—'}</span>
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

			{sys && (sys.os || sys.hostname) && (
				<div className={styles.labelsSection}>
					<div className={styles.sectionTitle}>{is_cn ? '系统信息' : 'System Info'}</div>
					<div className={styles.infoCards}>
						{sys.os && (
							<div className={styles.infoCard}>
								<div className={styles.infoLabel}>OS</div>
								<div className={styles.infoValue}>
									{osSvg
										? <img className={styles.osIcon} src={osSvg} />
										: <Icon name='material-computer' size={14} />
									}
									<span>{sys.os} / {sys.arch}</span>
								</div>
							</div>
						)}
						{sys.hostname && (
							<div className={styles.infoCard}>
								<div className={styles.infoLabel}>Hostname</div>
								<div className={styles.infoValue}>
									<Icon name='material-dns' size={14} />
									<span>{sys.hostname}</span>
								</div>
							</div>
						)}
						{sys.num_cpu > 0 && (
							<div className={styles.infoCard}>
								<div className={styles.infoLabel}>CPU</div>
								<div className={styles.infoValue}>
									<Icon name='material-memory' size={14} />
									<span>{sys.num_cpu} {is_cn ? '核' : 'cores'}</span>
								</div>
							</div>
						)}
						{sys.total_mem && sys.total_mem > 0 && (
							<div className={styles.infoCard}>
								<div className={styles.infoLabel}>{is_cn ? '内存' : 'Memory'}</div>
								<div className={styles.infoValue}>
									<Icon name='material-sd_card' size={14} />
									<span>{formatMemory(sys.total_mem)}</span>
								</div>
							</div>
						)}
						{sys.shell && (
							<div className={styles.infoCard}>
								<div className={styles.infoLabel}>Shell</div>
								<div className={styles.infoValue}>
									<Icon name='material-terminal' size={14} />
									<span className={styles.monoText}>{sys.shell}</span>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

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
