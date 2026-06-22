import { useCallback, useState, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useGlobal } from '@/context/app'
import { useKanbanContext } from '../../context'
import CreateBoardModal from '../CreateBoardModal'
import slidesData from '@/components/WelcomeWizard/slides.json'
import styles from './index.less'

const CDN_BASE = 'https://assets.yaoagents.com/en/'
const INTERVAL = 5000

const WELCOME_SLIDES = slidesData.filter(
	(s: any) => s.remoteImage?.includes('kanban/') || s.remoteImage?.includes('inbox/')
)

const Welcome = () => {
	const { is_cn } = useKanbanContext()
	const global = useGlobal()
	const theme = global.theme || 'light'
	const locale = getLocale() as 'zh-CN' | 'en-US'
	const [active, setActive] = useState(0)
	const [modalOpen, setModalOpen] = useState(false)
	const timerRef = useRef<ReturnType<typeof setInterval>>()

	useEffect(() => {
		timerRef.current = setInterval(() => {
			setActive((i) => (i + 1) % WELCOME_SLIDES.length)
		}, INTERVAL)
		return () => clearInterval(timerRef.current)
	}, [])

	const goTo = useCallback((idx: number) => {
		setActive(idx)
		clearInterval(timerRef.current)
		timerRef.current = setInterval(() => {
			setActive((i) => (i + 1) % WELCOME_SLIDES.length)
		}, INTERVAL)
	}, [])

	const slide = WELCOME_SLIDES[active] as any
	const title = slide.title[locale] || slide.title['en-US']
	const description = slide.description[locale] || slide.description['en-US']

	return (
		<div className={styles.welcome}>
			<div className={styles.hero}>
				<div
					className={styles.heroTrack}
					style={{ transform: `translateX(-${active * 100}%)` }}
				>
					{WELCOME_SLIDES.map((s: any) => (
						<div key={s.remoteImage} className={styles.heroSlide}>
							<img src={`${CDN_BASE}${s.remoteImage.replace('$__THEME', theme)}`} alt='' />
						</div>
					))}
				</div>
			</div>

			<div className={styles.dots}>
				{WELCOME_SLIDES.map((_: any, idx: number) => (
					<button
						key={idx}
						className={styles.dot}
						data-active={idx === active || undefined}
						onClick={() => goTo(idx)}
					/>
				))}
			</div>

			<div className={styles.content} key={active}>
				<h1 className={styles.title}>{title}</h1>
				<p className={styles.subtitle}>{description}</p>
			</div>

			<button className={styles.cta} onClick={() => setModalOpen(true)}>
				<Icon name='material-add' />
				{is_cn ? '创建看板' : 'Create Board'}
			</button>

			<CreateBoardModal open={modalOpen} onClose={() => setModalOpen(false)} />
		</div>
	)
}

export default Welcome
