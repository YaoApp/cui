import { useState } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { mockApi } from '../../mockApi'
import styles from './index.less'

interface DockerMissingProps {
	nodeId: string
	onDockerDetected: (version: string) => void
}

const DOWNLOAD_LINKS = {
	mac: 'https://docs.docker.com/desktop/install/mac-install/',
	windows: 'https://docs.docker.com/desktop/install/windows-install/',
	linux: 'https://docs.docker.com/engine/install/'
}

export default function DockerMissing({ nodeId, onDockerDetected }: DockerMissingProps) {
	const is_cn = getLocale() === 'zh-CN'
	const [checking, setChecking] = useState(false)

	const handleRecheck = async () => {
		setChecking(true)
		try {
			const result = await mockApi.checkDocker(nodeId)
			if (result.docker_version) {
				onDockerDetected(result.docker_version)
			}
		} finally {
			setChecking(false)
		}
	}

	return (
		<div className={styles.dockerMissingBlock}>
			<div className={styles.dockerMissingIcon}>
				<Icon name='material-warning' size={40} />
			</div>
			<h3>
				{is_cn ? 'Docker 未安装' : 'Docker Not Installed'}
			</h3>
			<p>
				{is_cn
					? '运行沙箱环境需要 Docker。请先安装 Docker，然后点击重新检测。'
					: 'Docker is required for sandbox environments. Please install Docker and click re-check.'}
			</p>
			<div className={styles.dockerDownloadLinks}>
				<a href={DOWNLOAD_LINKS.mac} target='_blank' rel='noopener noreferrer'>
					<Icon name='material-laptop_mac' size={14} />
					macOS
				</a>
				<a href={DOWNLOAD_LINKS.windows} target='_blank' rel='noopener noreferrer'>
					<Icon name='material-desktop_windows' size={14} />
					Windows
				</a>
				<a href={DOWNLOAD_LINKS.linux} target='_blank' rel='noopener noreferrer'>
					<Icon name='material-terminal' size={14} />
					Linux
				</a>
			</div>
			<Button type='primary' loading={checking} onClick={handleRecheck}>
				{is_cn ? '重新检测' : 'Re-check'}
			</Button>
		</div>
	)
}
