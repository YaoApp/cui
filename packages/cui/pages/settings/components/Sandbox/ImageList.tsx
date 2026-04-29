import { useState, useEffect, useRef, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import { message, Modal } from 'antd'
import Icon from '@/widgets/Icon'
import Button from '@/components/ui/Button'
import { Setting } from '@/openapi/setting/api'
import type { SandboxImage } from '@/openapi/setting/types'
import styles from './index.less'

interface ImageListProps {
	nodeId: string
	nodeName?: string
	images: SandboxImage[]
	onReload: () => Promise<void> | void
	onOptimisticUpdate?: (imageId: string, status: string) => void
}

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

function formatSize(mb: number): string {
	return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

function formatAssistants(names: string[] | null | undefined, is_cn: boolean): string {
	if (!names || names.length === 0) return '-'
	if (names.length <= 3) return names.join('、')
	const first3 = names.slice(0, 3).join('、')
	return is_cn ? `${first3} 等 ${names.length} 个` : `${first3} +${names.length - 3} more`
}

export default function ImageList({ nodeId, nodeName, images, onReload, onOptimisticUpdate }: ImageListProps) {
	const is_cn = getLocale() === 'zh-CN'
	const [pulling, setPulling] = useState<Record<string, boolean>>({})
	const [removing, setRemoving] = useState<Record<string, boolean>>({})
	const [pullingAll, setPullingAll] = useState(false)
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const onReloadRef = useRef(onReload)
	useEffect(() => { onReloadRef.current = onReload })

	const statusOrder: Record<string, number> = { downloaded: 0, downloading: 1, error: 2, not_downloaded: 3 }
	const sortedImages = useMemo(
		() =>
			[...images].sort((a, b) => {
				const sa = statusOrder[a.status] ?? 4
				const sb = statusOrder[b.status] ?? 4
				if (sa !== sb) return sa - sb
				return `${a.image_name}:${a.tag}`.localeCompare(`${b.image_name}:${b.tag}`)
			}),
		[images]
	)

	const hasDownloading = sortedImages.some((i) => i.status === 'downloading')

	useEffect(() => {
		if (hasDownloading && !pollRef.current) {
			pollRef.current = setInterval(() => onReloadRef.current(), 3000)
		} else if (!hasDownloading && pollRef.current) {
			clearInterval(pollRef.current)
			pollRef.current = null
			onReloadRef.current()
		}
		return () => {
			if (pollRef.current) {
				clearInterval(pollRef.current)
				pollRef.current = null
			}
		}
	}, [hasDownloading])

	const needPull = sortedImages.filter((i) => i.status === 'not_downloaded' || i.status === 'error')
	const totalSizeMb = needPull.reduce((acc, i) => acc + i.size_mb, 0)

	const handlePull = async (imageId: string) => {
		const api = getSettingAPI()
		if (!api) return
		setPulling((prev) => ({ ...prev, [imageId]: true }))
		try {
			const resp = await api.PullSandboxImage(nodeId, imageId)
			if (resp.error) {
				message.error(resp.error.error_description || (is_cn ? '下载失败' : 'Pull failed'))
			} else {
				onOptimisticUpdate?.(imageId, 'downloading')
			}
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
				const api = getSettingAPI()
				if (!api) return
				setRemoving((prev) => ({ ...prev, [imageId]: true }))
				try {
					const resp = await api.RemoveSandboxImage(nodeId, imageId)
					if (resp.error) {
						message.error(resp.error.error_description || (is_cn ? '删除失败' : 'Failed to delete'))
					} else {
						message.success(is_cn ? '已删除' : 'Deleted')
					}
					await onReload()
				} finally {
					setRemoving((prev) => ({ ...prev, [imageId]: false }))
				}
			}
		})
	}

	const handlePullAll = async () => {
		const api = getSettingAPI()
		if (!api) return
		const locale = getLocale().toLowerCase()
		setPullingAll(true)
		try {
			const resp = await api.PullAllSandboxImages(nodeId, locale)
			if (resp.error) {
				message.error(resp.error.error_description || (is_cn ? '下载失败' : 'Pull failed'))
			} else {
			sortedImages.forEach((img) => {
				if (img.status === 'not_downloaded' || img.status === 'error') {
					onOptimisticUpdate?.(img.id, 'downloading')
				}
				})
			}
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
				{needPull.length > 0 && (
					<Button type='primary' size='small' loading={pullingAll} onClick={handlePullAll}>
						{totalSizeMb > 0
							? (is_cn ? `全部下载（${formatSize(totalSizeMb)}）` : `Download All (${formatSize(totalSizeMb)})`)
							: (is_cn ? '全部下载' : 'Download All')}
					</Button>
				)}
			</div>

			<div className={styles.imageList}>
				{sortedImages.map((img) => (
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
							{img.status === 'error' && (
								<span className={styles.statusError} title={img.error_message}>
									<Icon name='material-error_outline' size={13} />
									{img.error_message || (is_cn ? '下载失败' : 'Pull failed')}
								</span>
							)}
						</div>
						<span className={styles.imageSize}>{img.size_mb > 0 ? formatSize(img.size_mb) : '-'}</span>
						<div className={styles.imageActions}>
							{(img.status === 'not_downloaded' || img.status === 'error') && (
								<Button
									type='default'
									size='small'
									loading={pulling[img.id]}
									onClick={() => handlePull(img.id)}
								>
									{img.status === 'error' ? (is_cn ? '重试' : 'Retry') : (is_cn ? '下载' : 'Pull')}
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
								<Icon name='material-sync' size={14} className={styles.spinIcon} />
								{is_cn ? '下载中' : 'Pulling'}
							</span>
						)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
