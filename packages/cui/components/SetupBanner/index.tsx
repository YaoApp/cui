import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { getLocale, history } from '@umijs/max'
import { useGlobal } from '@/context/app'
import { GetCurrentUser } from '@/pages/auth/auth'
import { Setting } from '@/openapi/setting/api'
import { local } from '@yaoapp/storex'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const SetupBanner = observer(() => {
	const global = useGlobal()
	const status = global.setup_status
	const user = GetCurrentUser()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [dismissed, setDismissed] = useState(false)

	const isOwner = user?.is_owner ?? !user?.team_id
	const shouldShow = useMemo(() => {
		if (!status || status.completed || status.banner_dismissed || dismissed || !isOwner) return false
		if (!status.checkpoints) return false
		return Object.values(status.checkpoints).some((cp) => cp.status === 'fail')
	}, [status, isOwner, dismissed])

	const failedRequired = useMemo(() => {
		if (!status?.checkpoints) return []
		return Object.entries(status.checkpoints)
			.filter(([, cp]) => cp.required && cp.status === 'fail')
			.map(([key, cp]) => ({ key, ...cp }))
	}, [status])

	const leftRef = useRef<HTMLDivElement>(null)
	const [hasOverflow, setHasOverflow] = useState(false)

	const checkOverflow = useCallback(() => {
		const el = leftRef.current
		if (el) setHasOverflow(el.scrollWidth > el.clientWidth)
	}, [])

	useEffect(() => {
		checkOverflow()
		window.addEventListener('resize', checkOverflow)
		return () => window.removeEventListener('resize', checkOverflow)
	}, [checkOverflow, shouldShow])

	if (!shouldShow) return null

	const checkpoints = Object.entries(status!.checkpoints ?? {})

	const handleNavigate = (path: string) => {
		history.push(path)
	}

	const handleGoSetup = () => {
		if (failedRequired.length > 0) {
			history.push(failedRequired[0].path)
		}
	}

	const handleDismiss = async () => {
		setDismissed(true)
		if (global.setup_status) {
			global.setup_status = { ...global.setup_status, banner_dismissed: true }
			local.setup_status = global.setup_status
		}
		try {
			if (window.$app?.openapi) {
				const api = new Setting(window.$app.openapi)
				await api.UpdatePreference({ banner_dismissed: true })
			}
		} catch {}
	}

	return (
		<div className={styles.setup_banner}>
			<div ref={leftRef} className={`${styles.banner_left} ${hasOverflow ? styles.has_overflow : ''}`}>
				<span className={styles.banner_title}>
					{is_cn ? '配置检查' : 'Setup Check'}
				</span>
				<div className={styles.checkpoint_list}>
					{checkpoints.map(([key, cp]) => (
						<span
							key={key}
							className={`${styles.checkpoint_item} ${
								cp.status === 'pass'
									? styles.pass
									: cp.required
									? styles.fail_required
									: styles.fail_optional
							}`}
							onClick={() => handleNavigate(cp.path)}
						>
							<Icon
								name={cp.status === 'pass' ? 'material-check_circle' : 'material-radio_button_unchecked'}
								size={13}
							/>
							{cp.label}
						</span>
					))}
				</div>
			</div>
			<div className={styles.banner_actions}>
				{failedRequired.length > 0 && (
					<button className={styles.action_button} onClick={handleGoSetup}>
						{is_cn ? '前往设置' : 'Go to Settings'}
					</button>
				)}
				<button className={styles.dismiss_button} onClick={handleDismiss}>
					{is_cn ? '忽略' : 'Dismiss'}
				</button>
			</div>
		</div>
	)
})

export default SetupBanner
