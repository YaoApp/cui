import { FC } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import './empty.less'

interface EmptyProps {
	/** Custom message */
	message?: string
}

const Empty: FC<EmptyProps> = ({ message }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const defaultMessage = is_cn ? '从左侧菜单选择页面开始浏览' : 'Select a page from the menu to start browsing'

	return (
		<div className='sidebar_empty'>
			<div className='sidebar_empty_content'>
				<Icon name='material-web' size={48} className='sidebar_empty_icon' />
				<p className='sidebar_empty_text'>{message || defaultMessage}</p>
			</div>
		</div>
	)
}

export default Empty

