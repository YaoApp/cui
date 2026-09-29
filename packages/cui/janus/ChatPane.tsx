import React, { useEffect, useMemo, useRef, useState } from 'react'

import MessageItem from './Message'

import type { Message } from '@/openapi'
import type { PanelMode } from './mock'

interface IProps {
	title: string
	subtitle?: React.ReactNode
	messages: Message[]
	compact?: boolean
	onSelect: (mode: PanelMode, id: string) => void
	onSend?: (text: string) => void
}

/** 左：对话面板（V2 表达；数据吃消息标准） */
const ChatPane: React.FC<IProps> = ({ title, subtitle, messages, onSelect, onSend }) => {
	const [activeId, setActiveId] = useState<string>(messages[messages.length - 1]?.ui_id || '')
	const [draft, setDraft] = useState('继续：接上 lucky-server 的 /fortune 接口')
	const boxRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const el = boxRef.current
		if (el) el.scrollTop = el.scrollHeight
	}, [messages.length])

	const list = useMemo(() => messages, [messages])

	return (
		<div className='jn-card jn-col'>
			<div className='jn-colhead'>
				<b>{title}</b>
				{subtitle}
				<span className='jn-sp' />
				<span className='jn-chip'>看板可见</span>
			</div>

			<div className='jn-msgs' ref={boxRef}>
				{list.map((m) => (
					<MessageItem
						key={m.ui_id || Math.random().toString(36)}
						message={m}
						active={m.ui_id === activeId}
						onSelect={(mode) => {
							setActiveId(m.ui_id || '')
							onSelect(mode, m.ui_id || '')
						}}
					/>
				))}
			</div>

			<div className='jn-input'>
				<div className='jn-inputbox'>
					<input
						value={draft}
						placeholder='让 Agent 改点什么…'
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && draft.trim()) {
								onSend?.(draft.trim())
								setDraft('')
							}
						}}
					/>
					<button
						className='jn-btn sm'
						onClick={() => {
							if (draft.trim()) {
								onSend?.(draft.trim())
								setDraft('')
							}
						}}
					>
						发送
					</button>
				</div>
				<div className='jn-hint'>
					<span>消息标准不变（17 种）</span>
					<span>展示 / 交互 → V2 组件</span>
				</div>
			</div>
		</div>
	)
}

export default ChatPane
