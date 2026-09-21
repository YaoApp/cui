import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { getLocale, history } from '@umijs/max'
import { useGlobal } from '@/context/app'
import { GetCurrentUser } from '@/pages/auth/auth'
import { Setting } from '@/openapi/setting/api'
import { local } from '@yaoapp/storex'
import Icon from '@/widgets/Icon'
import type { Checkpoint } from '@/openapi/setting/types'
import styles from './index.less'

/** Whether any error- or warning-level checkpoint has failed. Info-level items are advisory and do not trigger the banner. */
function hasActionableFailures(checkpoints: Record<string, Checkpoint>): boolean {
	return Object.values(checkpoints).some((cp) => cp.status === 'fail' && cp.level !== 'info')
}

const LEVEL_PRIORITY: Record<string, number> = { error: 0, warning: 1, info: 2 }

/** Return failed checkpoints sorted by level priority: error > warning > info. */
function getFailedByPriority(checkpoints: Record<string, Checkpoint>) {
	return Object.entries(checkpoints)
		.filter(([, cp]) => cp.status === 'fail')
		.map(([key, cp]) => ({ key, ...cp }))
		.sort((a, b) => (LEVEL_PRIORITY[a.level] ?? 3) - (LEVEL_PRIORITY[b.level] ?? 3))
}

/** Path of the highest-priority failed checkpoint, for the "Go to Settings" button. */
function getTopFailedPath(checkpoints: Record<string, Checkpoint>): string | null {
	const sorted = getFailedByPriority(checkpoints)
	return sorted.length > 0 ? sorted[0].path : null
}

const SetupBanner = observer(() => {
	const global = useGlobal()
	const status = global.setup_status
	const user = GetCurrentUser()
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [dismissed, setDismissed] = useState(false)

	// Reset local dismissed state when banner_dismissed is cleared
	// (e.g. user clicks "Re-show banner" on System Info page).
	useEffect(() => {
		if (status && !status.banner_dismissed) {
			setDismissed(false)
		}
	}, [status?.banner_dismissed])

	const isOwner = user?.is_owner ?? !user?.team_id

	// Visible whenever there are failed checkpoints — no longer gated on `status.completed`.
	const shouldShow = useMemo(() => {
		if (!status || status.banner_dismissed || dismissed || !isOwner) return false
		if (!status.checkpoints) return false
		return hasActionableFailures(status.checkpoints)
	}, [status, isOwner, dismissed])

	const topFailedPath = useMemo(() => {
		if (!status?.checkpoints) return null
		return getTopFailedPath(status.checkpoints)
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
		if (topFailedPath) {
			history.push(topFailedPath)
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
		} catch {
			/* persist best-effort; UI already dismissed */
		}
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
									: styles[`fail_${cp.level}`] || styles.fail_info
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
				{topFailedPath && (
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
