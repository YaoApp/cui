import { useState } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import type { SandboxImage } from '../../types'
import { mockApi } from '../../mockApi'
import styles from './index.less'

interface ImageListProps {
	nodeId: string
	nodeName?: string
	images: SandboxImage[]
	onReload: () => void
}

function formatSize(mb: number): string {
	return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

function formatAssistants(names: string[], is_cn: boolean): string {
	if (names.length <= 3) return names.join('、')
	const first3 = names.slice(0, 3).join('、')
	return is_cn ? `${first3} 等 ${names.length} 个` : `${first3} +${names.length - 3} more`
}

export default function ImageList({ nodeId, nodeName, images, onReload }: ImageListProps) {
	const is_cn = getLocale() === 'zh-CN'
	const [pulling, setPulling] = useState<Record<string, boolean>>({})
	const [removing, setRemoving] = useState<Record<string, boolean>>({})
	const [pullingAll, setPullingAll] = useState(false)

	const notDownloaded = images.filter((i) => i.status === 'not_downloaded')
	const totalSizeMb = notDownloaded.reduce((acc, i) => acc + i.size_mb, 0)

	const handlePull = async (imageId: string) => {
		setPulling((prev) => ({ ...prev, [imageId]: true }))
		try {
			await mockApi.pullImage(nodeId, imageId)
			onReload()
		} finally {
			setPulling((prev) => ({ ...prev, [imageId]: false }))
		}
	}

	const handleRemove = (imageId: string, imageName: string) => {
		Modal.confirm({
			title: is_cn ? '确认删除' : 'Confirm Delete',
			content: is_cn
				? `确定要删除镜像 "${imageName}" 吗？删除后需要重新下载。`
				: `Delete image "${imageName}"? You will need to re-download it.`,
			okText: is_cn ? '删除' : 'Delete',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: async () => {
				setRemoving((prev) => ({ ...prev, [imageId]: true }))
				try {
					await mockApi.removeImage(nodeId, imageId)
					message.success(is_cn ? '已删除' : 'Deleted')
					onReload()
				} finally {
					setRemoving((prev) => ({ ...prev, [imageId]: false }))
				}
			}
		})
	}

	const handlePullAll = async () => {
		setPullingAll(true)
		try {
			await mockApi.pullAllImages(nodeId)
			onReload()
		} finally {
			setPullingAll(false)
		}
	}

	const title = nodeName
		? (is_cn ? `沙箱镜像（${nodeName}）` : `Sandbox Images (${nodeName})`)
		: (is_cn ? '沙箱镜像' : 'Sandbox Images')

	return (
		<div className={styles.imageSection}>
			<div className={styles.imageSectionHeader}>
				<div>
					<h3 className={styles.sectionTitle}>{title}</h3>
					<p className={styles.imageHint}>
						{is_cn
							? '以下镜像由系统中的助手使用，请确保所需镜像已下载'
							: 'These images are used by assistants. Please ensure required images are downloaded.'}
					</p>
				</div>
				{notDownloaded.length > 0 && (
					<Button type='primary' size='small' loading={pullingAll} onClick={handlePullAll}>
						{is_cn ? `全部下载（${formatSize(totalSizeMb)}）` : `Download All (${formatSize(totalSizeMb)})`}
					</Button>
				)}
			</div>

			<div className={styles.imageList}>
				{images.map((img) => (
					<div key={img.id} className={styles.imageRow}>
						<div className={styles.imageInfo}>
							<span className={styles.imageName}>{formatAssistants(img.assistant_names, is_cn)}</span>
							<span className={styles.imageTag}>{img.image_name}:{img.tag}</span>
						</div>
						<div className={styles.imageStatus}>
							{img.status === 'downloaded' && (
								<span className={styles.statusDownloaded}>
									<Icon name='material-check_circle' size={13} />
									{is_cn ? '已下载' : 'Downloaded'}
								</span>
							)}
							{img.status === 'not_downloaded' && (
								<span className={styles.statusNotDownloaded}>
									{is_cn ? '未下载' : 'Not downloaded'}
								</span>
							)}
							{img.status === 'downloading' && (
								<div className={styles.downloadProgress}>
									<div className={styles.progressBar}>
										<div className={styles.progressFill} style={{ width: `${img.progress || 0}%` }} />
									</div>
									<span className={styles.progressText}>{img.progress || 0}%</span>
								</div>
							)}
						</div>
						<span className={styles.imageSize}>{formatSize(img.size_mb)}</span>
						<div className={styles.imageActions}>
							{img.status === 'not_downloaded' && (
								<Button
									type='default'
									size='small'
									loading={pulling[img.id]}
									onClick={() => handlePull(img.id)}
								>
									{is_cn ? '下载' : 'Pull'}
								</Button>
							)}
							{img.status === 'downloaded' && (
								<button
									className={styles.deleteIconBtn}
									disabled={removing[img.id]}
									onClick={() => handleRemove(img.id, `${img.image_name}:${img.tag}`)}
									title={is_cn ? '删除' : 'Delete'}
								>
									<Icon name='material-delete_outline' size={15} />
								</button>
							)}
							{img.status === 'downloading' && (
								<span className={styles.pullingLabel}>
									{is_cn ? '下载中...' : 'Pulling...'}
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
