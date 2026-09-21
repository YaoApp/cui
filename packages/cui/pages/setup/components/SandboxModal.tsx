import { Modal } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { SetupStatus } from '@/openapi/setting/types'

interface SandboxModalProps {
	open: boolean
	onClose: () => void
	onGoSetup: () => void
}

/**
 * Whether sandbox setup is incomplete on a Docker-capable node.
 * The `sandbox_image` key is only present when the backend detected a Docker
 * node, so its existence confirms Docker availability. Checking only
 * `sandbox_image` avoids triggering the modal for nodes that have neither
 * Docker nor HostExec (where the modal text would be misleading).
 */
export function hasPendingSandboxWork(status: SetupStatus | null): boolean {
	if (!status?.checkpoints) return false
	const { sandbox_image } = status.checkpoints
	return sandbox_image?.status === 'fail'
}

const SandboxModal = ({ open, onClose, onGoSetup }: SandboxModalProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	return (
		<Modal
			open={open}
			title={null}
			footer={null}
			closable={false}
			centered
			width={420}
			maskClosable={false}
		>
			<div style={{ textAlign: 'center', padding: '16px 0' }}>
				<Icon name='material-deployed_code' size={48} style={{ color: 'var(--color_main)', marginBottom: 16 }} />
				<h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 500 }}>
					{is_cn ? '检测到 Docker 环境' : 'Docker Environment Detected'}
				</h3>
				<p style={{ margin: '0 0 24px', color: 'var(--color_neo_text_secondary)', fontSize: 14, lineHeight: 1.6 }}>
					{is_cn
						? '建议配置沙箱环境，为 AI 助手提供安全的代码执行能力。您也可以稍后在设置中配置。'
						: 'We recommend configuring the sandbox environment to enable secure code execution for AI assistants. You can also configure it later in Settings.'}
				</p>
				<div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
					<button
						onClick={onClose}
						style={{
							padding: '8px 20px',
							borderRadius: 'var(--radius)',
							border: '1px solid var(--color_neo_border_field)',
							background: 'none',
							color: 'var(--color_neo_text_secondary)',
							cursor: 'pointer',
							fontSize: 14
						}}
					>
						{is_cn ? '稍后设置' : 'Later'}
					</button>
					<button
						onClick={onGoSetup}
						style={{
							padding: '8px 20px',
							borderRadius: 'var(--radius)',
							border: 'none',
							background: 'var(--color_main)',
							color: '#fff',
							cursor: 'pointer',
							fontSize: 14
						}}
					>
						{is_cn ? '前往配置' : 'Configure Now'}
					</button>
				</div>
			</div>
		</Modal>
	)
}

export default SandboxModal
