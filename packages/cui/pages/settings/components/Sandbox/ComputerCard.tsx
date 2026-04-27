import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { ComputerNode } from '../../types'
import styles from './index.less'

interface ComputerCardProps {
	node: ComputerNode
	selected: boolean
	onClick: () => void
}

export default function ComputerCard({ node, selected, onClick }: ComputerCardProps) {
	const is_cn = getLocale() === 'zh-CN'

	const kindLabel = node.kind === 'host' ? (is_cn ? '本机' : 'Local') : (is_cn ? '远程' : 'Remote')
	const sysInfo = `${node.os} ${node.arch} · ${node.cpu} CPU · ${node.memory_gb} GB`

	return (
		<div
			className={`${styles.computerCard} ${selected ? styles.computerCardSelected : ''} ${!node.online ? styles.computerCardOffline : ''}`}
			onClick={onClick}
		>
			<div className={styles.computerCardHeader}>
				<div className={styles.computerCardName}>
					<Icon name={node.kind === 'host' ? 'material-computer' : 'material-dns'} size={16} />
					<span>{node.display_name}</span>
				</div>
				<span className={`${styles.kindTag} ${node.kind === 'host' ? styles.kindHost : styles.kindNode}`}>
					{kindLabel}
				</span>
			</div>
			<div className={styles.computerCardInfo}>{sysInfo}</div>
			<div className={styles.computerCardFooter}>
				{node.docker_version ? (
					<span className={styles.dockerOk}>
						<Icon name='material-check_circle' size={12} />
						Docker {node.docker_version}
					</span>
				) : (
					<span className={styles.dockerMissing}>
						<Icon name='material-error_outline' size={12} />
						{is_cn ? 'Docker 未安装' : 'Docker not installed'}
					</span>
				)}
				<span className={styles.sandboxCount}>
					{node.running_sandboxes} {is_cn ? '个沙箱运行中' : 'running'}
				</span>
			</div>
			{!node.online && (
				<div className={styles.offlineBadge}>{is_cn ? '离线' : 'Offline'}</div>
			)}
		</div>
	)
}
