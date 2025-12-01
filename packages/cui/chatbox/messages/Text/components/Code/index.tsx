import { useMemoizedFn } from 'ahooks'
import clsx from 'clsx'
import { Copy, Check } from 'phosphor-react'
import { useState } from 'react'
import { When, If, Then, Else } from 'react-if'
import { getLocale } from '@umijs/max'
import styles from './index.less'

interface IProps {
	className?: string
	children?: any
	raw?: string
}

const Code = (props: IProps) => {
	const { className, children, raw } = props
	const [copied, setCopied] = useState(false)
	const is_cn = getLocale() === 'zh-CN'

	const copy = useMemoizedFn(async () => {
		if (!raw) return
		await navigator.clipboard.writeText(raw)
		setCopied(true)
		setTimeout(() => setCopied(false), 3000)
	})

	// If no language class, render as inline code
	if (!className) return <code className={styles.inline}>{children}</code>

	const language = className?.replace('hljs language-', '') || 'text'

	return (
		<div className={clsx('w_100 flex flex_column', styles.code_block)}>
			<div className='code_header_wrap w_100 border_box flex justify_between align_center'>
				<span className='lang'>{language}</span>
				<div
					className='btn_copy flex justify_center align_center clickable'
					onClick={copy}
					title={is_cn ? '复制' : 'Copy'}
				>
					<If condition={copied}>
						<Then>
							<Check size={16} color='var(--color_success)' />
						</Then>
						<Else>
							<Copy size={16} />
						</Else>
					</If>
				</div>
			</div>
			<pre className='code_content_wrap w_100 border_box ma_0'>
				<code className={className}>{children}</code>
			</pre>
		</div>
	)
}

export default Code
