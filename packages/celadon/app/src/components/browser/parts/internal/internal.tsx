import { useTranslation } from '@/platform/i18n'

export type InternalProps = {
	/** 内部路由的路径（快捷方式解析后的完整路径，含参数） */
	path: string
}

/* 内部路由页：路由内容随后接（内容区自己的页面），这里先把路径与说明画出来，
   组件关系与通信已按目标模型接好。 */
export function Internal({ path }: InternalProps) {
	const { t } = useTranslation()
	return (
		<div className="browser__internal">
			<p className="browser__address-line">{path}</p>
			<p className="browser__hint">{t('shell.browser.internal.hint')}</p>
		</div>
	)
}
