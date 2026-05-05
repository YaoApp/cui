import { useState, useCallback, useEffect } from 'react'
import { getLocale, setLocale } from '@umijs/max'
import { useGlobal } from '@/context/app'
import { local } from '@yaoapp/storex'
import { Setting as SettingAPI } from '@/openapi/setting/api'
import RadioGroupInput from '@/components/ui/inputs/RadioGroup'
import type { PropertySchema } from '@/components/ui/inputs/types'
import { yaoagents as yaoagentsLogo } from '@/assets/icons/brands'

import chatSvg from './assets/chat.svg'
import expertsSvg from './assets/experts.svg'
import startSvg from './assets/start.svg'
import slidesData from './slides.json'
import styles from './index.less'

const CDN_BASE = 'https://assets.yaoagents.com/en/'
const fallbackImages: Record<string, string> = { welcome: yaoagentsLogo, chat: chatSvg, experts: expertsSvg, start: startSvg }

interface WelcomeWizardProps {
	visible: boolean
	onClose: () => void
	isReopen?: boolean
}

const WelcomeWizard = ({ visible, onClose, isReopen }: WelcomeWizardProps) => {
	const global = useGlobal()
	const [currentStep, setCurrentStep] = useState(0)
	const [selectedLocale, setSelectedLocale] = useState(() => getLocale() || 'en-US')
	const [mounted, setMounted] = useState(false)
	const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

	const is_cn = selectedLocale === 'zh-CN'
	const theme = global.theme || 'light'

	useEffect(() => {
		if (visible) {
			setCurrentStep(0)
			setSelectedLocale(getLocale() || 'en-US')
			setImgErrors({})
			requestAnimationFrame(() => setMounted(true))
		} else {
			setMounted(false)
		}
	}, [visible])

	const getLocaleText = useCallback(
		(field: Record<string, string>) => {
			return field[selectedLocale] || field['en-US'] || ''
		},
		[selectedLocale]
	)

	const handleComplete = useCallback(async () => {
		if (!isReopen) {
			try {
				if (window.$app?.openapi) {
					const api = new SettingAPI(window.$app.openapi)
					await api.UpdatePreference({ onboarding_completed: true })
				}
			} catch {}
			if (global.setup_status) {
				global.setup_status = { ...global.setup_status, onboarding_completed: true }
				local.setup_status = global.setup_status
			}
		}
		onClose()
	}, [isReopen, global, onClose])

	const handleNext = useCallback(() => {
		if (currentStep < slidesData.length - 1) {
			setCurrentStep((s) => s + 1)
		}
	}, [currentStep])

	const handleGoSetup = useCallback(() => {
		handleComplete().then(() => {
			const status = global.setup_status
			if (status?.checkpoints) {
				const firstFail = Object.values(status.checkpoints).find(
					(cp) => cp.required && cp.status === 'fail'
				)
				if (firstFail?.path) {
					window.location.hash = ''
					window.location.pathname = firstFail.path
					return
				}
			}
			window.location.pathname = '/settings/models'
		})
	}, [handleComplete, global])

	const handleLocaleChange = useCallback(
		async (value: any) => {
			const v = value as string
			if (!v || v === selectedLocale) return
			setSelectedLocale(v)
			const normalized = v.toLowerCase().replace('_', '-')
			document.cookie = `locale=${normalized};path=/;max-age=31536000`
			await window.$app?.Event?.emit('app/getUserMenu', v)
			setLocale(v, false)
		},
		[selectedLocale]
	)

	const handleThemeChange = useCallback(
		(value: any) => {
			const v = value as string
			if (v === 'light' || v === 'dark') {
				global.setTheme(v)
			}
		},
		[global]
	)

	const langSchema: PropertySchema = {
		type: 'string',
		component: 'RadioGroup',
		enum: [
			{ label: 'English', value: 'en-US' },
			{ label: '中文', value: 'zh-CN' }
		]
	}

	const themeSchema: PropertySchema = {
		type: 'string',
		component: 'RadioGroup',
		enum: [
			{ label: is_cn ? '浅色' : 'Light', value: 'light' },
			{ label: is_cn ? '深色' : 'Dark', value: 'dark' }
		]
	}

	const getIllustrationSrc = useCallback(
		(slide: any, idx: number) => {
			if (slide.remoteImage && !imgErrors[idx]) {
				return CDN_BASE + slide.remoteImage.replace('$__THEME', theme)
			}
			return fallbackImages[slide.image] || ''
		},
		[theme, imgErrors]
	)

	const handleImgError = useCallback((idx: number) => {
		setImgErrors((prev) => ({ ...prev, [idx]: true }))
	}, [])

	if (!visible) return null

	const slide = slidesData[currentStep] as any
	const isLast = !!slide.isLast

	return (
		<div className={`${styles.overlay} ${mounted ? styles.visible : ''}`}>
			<div className={styles.modal}>
				{/* Illustration — all slides rendered, crossfade via opacity */}
				<div className={styles.illustration}>
					{slidesData.map((s: any, idx: number) => (
						<div
							key={idx}
							className={`${styles.illustration_layer} ${styles[`gradient_${idx}`]} ${idx === currentStep ? styles.illustration_active : ''}`}
						>
							<img
								className={`${styles.illustration_img} ${idx === 0 ? styles.illustration_logo : styles.illustration_screenshot}`}
								src={getIllustrationSrc(s, idx)}
								alt=""
								draggable={false}
								onError={() => handleImgError(idx)}
							/>
						</div>
					))}
				</div>

				{/* Slide content with horizontal slide animation */}
				<div className={styles.slide_viewport}>
					<div
						className={styles.slide_track}
						style={{ transform: `translateX(-${currentStep * 100}%)` }}
					>
						{slidesData.map((s: any, idx: number) => (
							<div key={idx} className={styles.slide_panel}>
								<div className={styles.content}>
									<h2 className={styles.title}>{getLocaleText(s.title)}</h2>
									<p className={styles.description}>{getLocaleText(s.description)}</p>

									{s.hasPreferences && (
										<div className={styles.preferences_card}>
											<div className={styles.pref_row}>
												<div className={styles.pref_label}>
													<div className={styles.pref_label_name}>
														{is_cn ? '语言' : 'Language'}
													</div>
													<div className={styles.pref_label_desc}>
														{is_cn
															? '选择界面显示语言'
															: 'Select your preferred language'}
													</div>
												</div>
												<div className={styles.pref_control}>
													<RadioGroupInput
														schema={langSchema}
														value={selectedLocale}
														onChange={handleLocaleChange}
													/>
												</div>
											</div>
											<div className={styles.pref_row}>
												<div className={styles.pref_label}>
													<div className={styles.pref_label_name}>
														{is_cn ? '主题' : 'Theme'}
													</div>
													<div className={styles.pref_label_desc}>
														{is_cn
															? '选择您喜欢的颜色主题'
															: 'Choose your preferred color theme'}
													</div>
												</div>
												<div className={styles.pref_control}>
													<RadioGroupInput
														schema={themeSchema}
														value={global.theme}
														onChange={handleThemeChange}
													/>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className={styles.footer}>
					{/* Page indicators */}
					<div className={styles.indicators}>
						{slidesData.map((_: any, idx: number) => (
							<div
								key={idx}
								className={`${styles.dot} ${idx === currentStep ? styles.active : ''}`}
								onClick={() => setCurrentStep(idx)}
							/>
						))}
					</div>

					{/* Action buttons */}
					<div className={styles.actions}>
						<button className={styles.btn_skip} onClick={handleComplete}>
							{is_cn ? '跳过' : 'Skip'}
						</button>
						{isLast ? (
							<>
								<button className={styles.btn_outline} onClick={handleGoSetup}>
									{is_cn ? '前往设置' : 'Go to Settings'}
								</button>
								<button className={styles.btn_primary} onClick={handleComplete}>
									{is_cn ? '开始体验' : 'Start Exploring'}
								</button>
							</>
						) : (
							<button className={styles.btn_primary} onClick={handleNext}>
								{is_cn ? '下一步' : 'Next'}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default WelcomeWizard
