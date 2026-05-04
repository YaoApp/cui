import { useCallback, useEffect, useRef, useState } from 'react'
import { getLocale, history } from '@umijs/max'
import { Setting } from '@/openapi/setting/api'
import type { AssistantSetupStatus, Checkpoint } from '@/openapi/setting/types'
import Icon from '@/widgets/Icon'
import styles from './index.less'

interface AssistantSetupBannerProps {
	assistantId?: string
	onReadyChange: (ready: boolean) => void
}

const AssistantSetupBanner = ({ assistantId, onReadyChange }: AssistantSetupBannerProps) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [status, setStatus] = useState<AssistantSetupStatus | null>(null)
	const requestSeq = useRef(0)
	const leftRef = useRef<HTMLDivElement>(null)
	const [hasOverflow, setHasOverflow] = useState(false)

	const checkOverflow = useCallback(() => {
		const el = leftRef.current
		if (el) setHasOverflow(el.scrollWidth > el.clientWidth)
	}, [])

	const fetchStatus = useCallback(
		async (id: string, seq: number) => {
			try {
				if (!window.$app?.openapi) return
				const api = new Setting(window.$app.openapi)
				const res = await api.GetAssistantSetupStatus(id)
				if (seq !== requestSeq.current) return
				if (res?.data && !window.$app.openapi.IsError(res)) {
					setStatus(res.data)
					onReadyChange(res.data.ready)
				} else {
					setStatus(null)
					onReadyChange(true)
				}
			} catch {
				if (seq !== requestSeq.current) return
				setStatus(null)
				onReadyChange(true)
			}
		},
		[onReadyChange]
	)

	useEffect(() => {
		if (!assistantId) {
			setStatus(null)
			onReadyChange(true)
			return
		}
		onReadyChange(false)
		const seq = ++requestSeq.current
		fetchStatus(assistantId, seq)
	}, [assistantId, fetchStatus, onReadyChange])

	useEffect(() => {
		const handleRecheck = () => {
			if (!assistantId) return
			const seq = ++requestSeq.current
			fetchStatus(assistantId, seq)
		}
		const handleVisibility = () => {
			if (document.visibilityState === 'visible') handleRecheck()
		}
		window.$app?.Event?.on('setup/recheck', handleRecheck)
		window.addEventListener('focus', handleRecheck)
		document.addEventListener('visibilitychange', handleVisibility)
		return () => {
			window.$app?.Event?.off('setup/recheck', handleRecheck)
			window.removeEventListener('focus', handleRecheck)
			document.removeEventListener('visibilitychange', handleVisibility)
		}
	}, [assistantId, fetchStatus])

	useEffect(() => {
		checkOverflow()
		window.addEventListener('resize', checkOverflow)
		return () => window.removeEventListener('resize', checkOverflow)
	}, [checkOverflow, status])

	if (!status || status.ready) return null

	const failedCheckpoints = Object.entries(status.checkpoints).filter(
		([, cp]) => cp.status === 'fail'
	)
	if (failedCheckpoints.length === 0) return null

	const firstFailed = failedCheckpoints[0][1]

	return (
		<div className={styles.assistant_banner}>
			<div ref={leftRef} className={`${styles.banner_left} ${hasOverflow ? styles.has_overflow : ''}`}>
				<span className={styles.banner_name}>
					<Icon name='material-warning' size={13} />
					{status.assistant_name}
				</span>
				<div className={styles.checkpoint_list}>
					{failedCheckpoints.map(([key, cp]: [string, Checkpoint]) => (
						<span
							key={key}
							className={styles.checkpoint_item}
							onClick={() => history.push(cp.path)}
						>
					<Icon name='material-radio_button_unchecked' size={12} />
						{cp.label}{cp.detail ? `: ${cp.detail}` : ''}
						</span>
					))}
				</div>
			</div>
			<button className={styles.action_button} onClick={() => history.push(firstFailed.path)}>
				{is_cn ? '前往设置' : 'Go to Settings'}
			</button>
		</div>
	)
}

export default AssistantSetupBanner
