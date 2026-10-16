import { useState, type FormEvent } from 'react'
import { Button } from '@/components/base/button'
import { Input } from '@/components/base/input'
import { useTranslation } from '@/platform/i18n'

export type NewTabRecent = {
	key: string
	label: string
}

export type NewTabProps = {
	/** 这一侧已经打开的页（不含首页） */
	recent: NewTabRecent[]
	/** 提交一段输入：解析成什么内容由外层用目标模块决定，这一页只管把输入交出去 */
	onOpen: (input: string) => void
	/** 「打开过的东西」里点了一条：由外层复用同一页打开 */
	onOpenRecent?: (key: string) => void
	/** 校验一段输入：判据由装配层给（地址规则在目标模块里），这一页只负责显示错误态 */
	validate?: (input: string) => 'empty' | 'invalid' | null
}

/* 新标签页：地址入口与"打开过的东西"。首页与 `＋` 新建出来的空页共用这一个组件，
   两者的差别只在装配层怎么处理它的提交（首页另开一页，空页在本页里换内容）。 */
export function NewTab({ recent, onOpen, onOpenRecent, validate }: NewTabProps) {
	const { t } = useTranslation()
	const [address, setAddress] = useState('')
	const [error, setError] = useState<'empty' | 'invalid' | null>(null)

	const submit = (event: FormEvent) => {
		event.preventDefault()
		const value = address.trim()
		const problem = validate ? validate(value) : value ? null : 'empty'
		if (problem) {
			setError(problem)
			return
		}
		setError(null)
		onOpen(value)
		setAddress('')
	}
	const errorText =
		error === 'empty'
			? t('shell.browser.address.empty')
			: error === 'invalid'
				? t('shell.browser.address.invalid')
				: undefined

	return (
		<div className="browser__new-tab">
			<form className="browser__address" onSubmit={submit} noValidate>
				<Input
					id="browser-address"
					label={t('shell.browser.address.label')}
					value={address}
					onChange={(event) => {
						setAddress(event.target.value)
						if (error) setError(null)
					}}
					placeholder={t('shell.browser.address.placeholder')}
					error={errorText}
				/>
				<Button type="submit" variant="soft" size="small">
					{t('shell.browser.address.open')}
				</Button>
			</form>
			<div className="browser__recent">
				<h2 className="browser__recent-title">{t('shell.browser.recent')}</h2>
				{recent.length === 0 ? (
					<p className="browser__hint">{t('shell.browser.recent.empty')}</p>
				) : (
					<ul className="browser__recent-list">
						{recent.map((item) => (
							<li key={item.key} className="browser__recent-row">
								<Button
									className="browser__recent-item"
									variant="plain"
									size="small"
									onClick={() => onOpenRecent?.(item.key)}
								>
									{item.label}
								</Button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}
