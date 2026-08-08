import { useState, useRef, useCallback, useEffect } from 'react'

const WAVEFORM_BARS = 24
const MIME_PRIORITY = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']

const ADAPTIVE_SPAN_DB = 34
const GATE_OPEN_LEVEL = 0.16
const GATE_CLOSE_LEVEL = 0.14
const FLOOR_TRACK_DOWN = 0.5
const FLOOR_TRACK_UP = 0.15
const DIGITAL_SILENCE_DBFS = -65
const SILENCE_FLOOR_DBFS = -45

function rmsToDbFs(rms: number): number {
	if (rms <= 0) return -120
	return 20 * Math.log10(rms)
}

function levelAboveFloor(rmsDb: number, floorDb: number): number {
	if (rmsDb <= floorDb) return 0
	return Math.min(Math.max((rmsDb - floorDb) / ADAPTIVE_SPAN_DB, 0), 1)
}

function getBestMime(): string {
	for (const mime of MIME_PRIORITY) {
		if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) return mime
	}
	return ''
}

export type VoiceRecorderStatus = 'idle' | 'recording' | 'encoding' | 'error'

export interface VoiceRecorderState {
	status: VoiceRecorderStatus
	duration: number
	waveformRef: React.RefObject<number[]>
	error?: string
}

export interface VoiceRecorderActions {
	start: () => Promise<void>
	stop: () => Promise<Blob>
	cancel: () => void
}

const EMPTY_WAVEFORM = new Array(WAVEFORM_BARS).fill(0)

export function useVoiceRecorder(): VoiceRecorderState & VoiceRecorderActions {
	const [status, setStatus] = useState<VoiceRecorderStatus>('idle')
	const [duration, setDuration] = useState(0)
	const waveformRef = useRef<number[]>(EMPTY_WAVEFORM)
	const lastDurRef = useRef(0)
	const [error, setError] = useState<string | undefined>()

	const recorderRef = useRef<MediaRecorder | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const audioCtxRef = useRef<AudioContext | null>(null)
	const analyserRef = useRef<AnalyserNode | null>(null)
	const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
	const rafRef = useRef<number>(0)
	const startTimeRef = useRef(0)
	const chunksRef = useRef<Blob[]>([])
	const resolveStopRef = useRef<((blob: Blob) => void) | null>(null)

	const floorDbRef = useRef(SILENCE_FLOOR_DBFS)
	const envRef = useRef(0)
	const gateOpenRef = useRef(false)
	const timeDomainBufRef = useRef<Uint8Array | null>(null)
	const freqBufRef = useRef<Uint8Array | null>(null)

	const cleanup = useCallback(() => {
		if (rafRef.current) {
			cancelAnimationFrame(rafRef.current)
			rafRef.current = 0
		}
		sourceRef.current?.disconnect()
		sourceRef.current = null
		analyserRef.current = null
		if (audioCtxRef.current?.state !== 'closed') {
			audioCtxRef.current?.close().catch(() => {})
		}
		audioCtxRef.current = null
		streamRef.current?.getTracks().forEach((t) => t.stop())
		streamRef.current = null
		recorderRef.current = null
		chunksRef.current = []
		floorDbRef.current = SILENCE_FLOOR_DBFS
		envRef.current = 0
		gateOpenRef.current = false
		timeDomainBufRef.current = null
		freqBufRef.current = null
	}, [])

	useEffect(() => {
		return () => cleanup()
	}, [cleanup])

	const tick = useCallback(() => {
		if (!analyserRef.current) return

		const now = performance.now()
		const newDur = Math.floor((now - startTimeRef.current) / 1000)
		if (newDur !== lastDurRef.current) {
			lastDurRef.current = newDur
			setDuration(newDur)
		}

		const analyser = analyserRef.current
		if (!timeDomainBufRef.current) timeDomainBufRef.current = new Uint8Array(analyser.fftSize)
		if (!freqBufRef.current) freqBufRef.current = new Uint8Array(analyser.frequencyBinCount)
		const timeDomain = timeDomainBufRef.current
		analyser.getByteTimeDomainData(timeDomain)

		let sumSq = 0
		for (let i = 0; i < timeDomain.length; i++) {
			const v = (timeDomain[i] - 128) / 128
			sumSq += v * v
		}
		const rms = Math.sqrt(sumSq / timeDomain.length)
		const rmsDb = rmsToDbFs(rms)

		let env = envRef.current
		const floorDb = floorDbRef.current
		let newFloorDb = floorDb

		if (gateOpenRef.current) {
			const src = levelAboveFloor(rmsDb, floorDb)
			env = src >= env ? src : env + (src - env) * 0.25

			if (env < GATE_CLOSE_LEVEL) {
				gateOpenRef.current = false
				env = 0
			}
		} else {
			if (rmsDb > DIGITAL_SILENCE_DBFS) {
				const rate = rmsDb < floorDb ? FLOOR_TRACK_DOWN : FLOOR_TRACK_UP
				newFloorDb = floorDb + (rmsDb - floorDb) * rate
			}
			const instant = rmsDb > DIGITAL_SILENCE_DBFS ? levelAboveFloor(rmsDb, newFloorDb) : 0
			if (instant >= GATE_OPEN_LEVEL) {
				gateOpenRef.current = true
				env = instant
			} else {
				env = 0
			}
		}

		envRef.current = env
		floorDbRef.current = newFloorDb

		const freqData = freqBufRef.current!
		analyser.getByteFrequencyData(freqData)
		const bars = new Array(WAVEFORM_BARS)
		for (let i = 0; i < WAVEFORM_BARS; i++) {
			const binIdx = Math.floor((i * analyser.frequencyBinCount) / WAVEFORM_BARS)
			const raw = freqData[binIdx] / 255
			bars[i] = Math.min(raw * (env > 0 ? 1 : 0.05), 1)
		}

		waveformRef.current = bars
		rafRef.current = requestAnimationFrame(tick)
	}, [])

	const startingRef = useRef(false)

	const start = useCallback(async () => {
		if (startingRef.current) return
		startingRef.current = true
		setError(undefined)

		if (!navigator.mediaDevices?.getUserMedia) {
			startingRef.current = false
			setError('not_supported')
			setStatus('error')
			return
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					noiseSuppression: true,
					autoGainControl: true,
					echoCancellation: false,
					channelCount: 1,
					sampleRate: 16000
				}
			})

			streamRef.current = stream

			const audioCtx = new AudioContext()
			audioCtxRef.current = audioCtx
			const analyser = audioCtx.createAnalyser()
			analyser.fftSize = 256
			analyserRef.current = analyser
			const source = audioCtx.createMediaStreamSource(stream)
			source.connect(analyser)
			sourceRef.current = source

			const mime = getBestMime()
			const options: MediaRecorderOptions = {}
			if (mime) options.mimeType = mime

			const recorder = new MediaRecorder(stream, options)
			recorderRef.current = recorder
			chunksRef.current = []

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data)
			}

			recorder.onstop = () => {
				const mimeType = recorder.mimeType || mime || 'audio/webm'
				const blob = new Blob(chunksRef.current, { type: mimeType })
				chunksRef.current = []
				if (resolveStopRef.current) {
					resolveStopRef.current(blob)
					resolveStopRef.current = null
				}
			}

			recorder.start(250)
			startTimeRef.current = performance.now()
			setStatus('recording')
			setDuration(0)
			lastDurRef.current = 0
			waveformRef.current = EMPTY_WAVEFORM
			floorDbRef.current = SILENCE_FLOOR_DBFS
			envRef.current = 0
			gateOpenRef.current = false
			startingRef.current = false
			rafRef.current = requestAnimationFrame(tick)
		} catch (err: any) {
			startingRef.current = false
			cleanup()
			if (err?.name === 'NotAllowedError') {
				setError('microphone_denied')
			} else if (err?.name === 'NotFoundError') {
				setError('microphone_not_found')
			} else {
				setError('recording_failed')
			}
			setStatus('error')
		}
	}, [tick, cleanup])

	const stop = useCallback((): Promise<Blob> => {
		return new Promise((resolve, reject) => {
			const recorder = recorderRef.current
			if (!recorder || recorder.state === 'inactive') {
				reject(new Error('No active recording'))
				return
			}

			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current)
				rafRef.current = 0
			}

			setStatus('encoding')
			resolveStopRef.current = (blob: Blob) => {
				sourceRef.current?.disconnect()
				sourceRef.current = null
				analyserRef.current = null
				if (audioCtxRef.current?.state !== 'closed') {
					audioCtxRef.current?.close().catch(() => {})
				}
				audioCtxRef.current = null
				streamRef.current?.getTracks().forEach((t) => t.stop())
				streamRef.current = null
				recorderRef.current = null

				setStatus('idle')
				waveformRef.current = EMPTY_WAVEFORM
				resolve(blob)
			}

			recorder.stop()
		})
	}, [])

	const cancel = useCallback(() => {
		const recorder = recorderRef.current
		if (recorder && recorder.state !== 'inactive') {
			resolveStopRef.current = null
			recorder.stop()
		}
		cleanup()
		setStatus('idle')
		setDuration(0)
		lastDurRef.current = 0
		waveformRef.current = EMPTY_WAVEFORM
		setError(undefined)
	}, [cleanup])

	return { status, duration, waveformRef, error, start, stop, cancel }
}
