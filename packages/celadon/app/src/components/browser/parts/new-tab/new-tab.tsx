import { useState } from 'react'
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
}

/* 新标签页：地址入口与"打开过的东西"。首页与 `＋` 新建出来的空页共用这一个组件，
   两者的差别只在装配层怎么处理它的提交（首页另开一页，空页在本页里换内容）。 */
export function NewTab({ recent, onOpen }: NewTabProps) {
	const { t } = useTranslation()
	const [address, setAddress] = useState('')

	return (
		<div className="browser__new-tab">
			<form
				className="browser__address"
				onSubmit={(event) => {
					event.preventDefault()
					const value = address.trim()
					if (!value) return
					onOpen(value)
					setAddress('')
				}}
			>
				<Input
					id="browser-address"
					label={t('shell.browser.address.label')}
					value={address}
					onChange={(event) => setAddress(event.target.value)}
					placeholder={t('shell.browser.address.placeholder')}
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
							<li key={item.key} className="browser__recent-item">
								{item.label}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}
