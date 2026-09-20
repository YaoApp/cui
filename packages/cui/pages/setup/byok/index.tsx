import { useState, useEffect, useCallback } from 'react'
import { history, getLocale } from '@umijs/max'
import { message, Modal, Spin } from 'antd'
import Icon from '@/widgets/Icon'
import { Setting } from '@/openapi/setting'
import type { ModelsPageData, ProviderConfig } from '@/pages/settings/types'
import ProviderCard from '@/pages/settings/components/Models/ProviderCard'
import ProviderModal from '@/pages/settings/components/Models/ProviderModal'
import SetupLayout from '../components/SetupLayout'
import styles from '../index.less'

function getSettingAPI(): Setting | null {
	if (!window.$app?.openapi) return null
	return new Setting(window.$app.openapi)
}

const ByokProviders = () => {
	const is_cn = getLocale() === 'zh-CN'

	const byokSteps = [
		{ label: is_cn ? '模型服务' : 'Providers' },
		{ label: is_cn ? '角色分配' : 'Roles' },
		{ label: is_cn ? '搜索配置' : 'Search' }
	]

	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<ModelsPageData | null>(null)

	const [modalOpen, setModalOpen] = useState(false)
	const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
	const [editProvider, setEditProvider] = useState<ProviderConfig | null>(null)

	const loadData = useCallback(async () => {
		const api = getSettingAPI()
		if (!api) return
		const resp = await api.GetLLMConfig()
		if (resp.error || !resp.data) return
		setData(resp.data as unknown as ModelsPageData)
		setLoading(false)
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

	const hasProvider = (data?.providers.length ?? 0) > 0

	const handleOpenAdd = () => {
		setModalMode('add')
		setEditProvider(null)
		setModalOpen(true)
	}

	const handleOpenEdit = (provider: ProviderConfig) => {
		setModalMode('edit')
		setEditProvider(provider)
		setModalOpen(true)
	}

	const handleDelete = (key: string) => {
		const provider = data?.providers.find((p) => p.key === key)
		Modal.confirm({
			title: is_cn ? '确认删除' : 'Confirm Delete',
			content: is_cn
				? `确定要删除「${provider?.name || key}」吗？此操作不可撤销。`
				: `Are you sure you want to delete "${provider?.name || key}"? This cannot be undone.`,
			okText: is_cn ? '删除' : 'Delete',
			cancelText: is_cn ? '取消' : 'Cancel',
			okType: 'danger',
			onOk: async () => {
				const api = getSettingAPI()
				if (!api) return
				const resp = await api.DeleteProvider(key)
				if (resp.error) {
					message.error(resp.error?.error_description || (is_cn ? '删除失败' : 'Delete failed'))
					return
				}
				await loadData()
				message.success(is_cn ? '已删除' : 'Deleted')
				window.$app?.Event?.emit('models/changed')
			}
		})
	}

	const handleModalDone = async () => {
		setModalOpen(false)
		await loadData()
		window.$app?.Event?.emit('models/changed')
	}

	const handleNext = () => {
		if (!hasProvider) return
		history.push('/setup/byok/models')
	}

	return (
		<SetupLayout
			showBack
			backLabel={is_cn ? '切换使用 Tao Service' : 'Switch to Tao Service'}
			onBack={() => history.push('/setup/tao')}
			steps={byokSteps}
			currentStep={0}
		>
			<div className={styles.byokCard}>
				<h2 className={styles.byokTitle}>
					{is_cn ? '配置 AI 模型服务' : 'Configure AI Model Providers'}
				</h2>
				<p className={styles.byokSubtitle}>
					{is_cn
						? '添加至少一个 AI 模型服务才能开始使用'
						: 'Add at least one AI model provider to get started'}
				</p>

				{loading ? (
					<div className={styles.loadingWrap}>
						<Spin size='small' />
					</div>
				) : (
					<>
						{data && data.providers.length > 0 ? (
							<div className={styles.byokProviderList}>
								{data.providers.map((p) => (
									<ProviderCard
										key={p.key}
										provider={p}
										onEdit={handleOpenEdit}
										onDelete={handleDelete}
									/>
								))}
							</div>
						) : (
							<div className={styles.byokEmpty}>
								<Icon name='material-dns' size={32} />
								<span>
									{is_cn
										? '暂无模型服务，请点击下方按钮添加'
										: 'No providers yet. Click below to add one.'}
								</span>
							</div>
						)}

						<div className={styles.byokAddBtn} onClick={handleOpenAdd}>
							<Icon name='material-add' size={18} />
							<span>{is_cn ? '添加模型服务' : 'Add Model Provider'}</span>
						</div>

						<div className={styles.byokFooter}>
							<div />
							<button
								className={styles.byokNextBtn}
								type='button'
								disabled={!hasProvider}
								onClick={handleNext}
							>
								{is_cn ? '下一步 →' : 'Next →'}
							</button>
						</div>
					</>
				)}
			</div>

			{data && (
				<ProviderModal
					open={modalOpen}
					mode={modalMode}
					presets={data.preset_providers.filter((p) => !p.is_cloud)}
					editProvider={editProvider}
					onClose={() => setModalOpen(false)}
					onDone={handleModalDone}
				/>
			)}
		</SetupLayout>
	)
}

export default ByokProviders
