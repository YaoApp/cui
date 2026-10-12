import { BrandMark } from '@/components/base/brand-mark'
import { useTranslation } from '@/platform/i18n'

/* 品牌行：标志与产品名。按规范列头不放品牌（见 design/main-shell.md §三），品牌落在列头下面这一行；
   图标轨里整行收走（由容器查询按列宽隐藏），收起态的入口是列头里的标志。 */
export function NavBrand() {
	const { t } = useTranslation()
	return (
		<div className='nav__brand-row'>
			<BrandMark name='brand-yao-agents' size={24} label={t('app.name')} />
			<span className='nav__brand'>{t('app.name')}</span>
		</div>
	)
}
