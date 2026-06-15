import { useEffect, useRef, useCallback } from 'react'

interface UseTaskPollingOptions {
	hasRunningTasks: boolean
	onPoll: () => Promise<void>
	activeInterval?: number
	idleInterval?: number
}

export function useTaskPolling({
	hasRunningTasks,
	onPoll,
	activeInterval = 5000,
	idleInterval = 30000
}: UseTaskPollingOptions) {
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const isVisibleRef = useRef(true)

	const clearTimer = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
	}, [])

	const startTimer = useCallback(() => {
		clearTimer()
		if (!isVisibleRef.current) return

		const interval = hasRunningTasks ? activeInterval : idleInterval
		timerRef.current = setInterval(() => {
			if (isVisibleRef.current) {
				onPoll()
			}
		}, interval)
	}, [hasRunningTasks, activeInterval, idleInterval, onPoll, clearTimer])

	useEffect(() => {
		const handleVisibility = () => {
			isVisibleRef.current = document.visibilityState === 'visible'
			if (isVisibleRef.current) {
				onPoll()
				startTimer()
			} else {
				clearTimer()
			}
		}

		document.addEventListener('visibilitychange', handleVisibility)
		startTimer()

		return () => {
			document.removeEventListener('visibilitychange', handleVisibility)
			clearTimer()
		}
	}, [startTimer, clearTimer, onPoll])
}
