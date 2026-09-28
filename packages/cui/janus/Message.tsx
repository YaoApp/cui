import { MessageType } from '@/openapi'
import React from 'react'

import type { Message } from '@/openapi'
import type { PanelMode } from './mock'

/**
 * janus（V2）消息渲染 —— 按**消息标准** `MessageType` 分派。
 *
 * 复用：类型来自 `@/openapi`（与 `chatbox/messages/*` 同一契约）。
 * V2 的差别只在**表达与组件**，数据层不动。
 */

interface IProps {
	message: Message
	active?: boolean
	onSelect?: (mode: PanelMode) => void
}

/** 从消息里推断它"属于"哪个右侧栏模式（设计 / 开发 / 部署） */
function inferMode(msg: Message): PanelMode | undefined {
	const p = (msg.props || {}) as any
	const s = `${p.tool || ''} ${p.name || ''} ${p.summary || ''}`.toLowerCase()
	if (/publish|deploy|hosting|release/.test(s)) return 'deploy'
	if (/design|canvas|theme|spec/.test(s)) return 'design'
	if (/dui|test|build|bash|edit|write|diff|code/.test(s)) return 'dev'
	return undefined
}

const MessageItem: React.FC<IProps> = ({ message, active, onSelect }) => {
	const p = (message.props || {}) as any

	const Head: React.FC<{ label: string; chip?: React.ReactNode }> = ({ label, chip }) => (
		<div className='jn-blk-h'>
			<b>{label}</b>
			<span className='jn-sp' />
			{chip}
		</div>
	)

	const block = (label: string, body: React.ReactNode, chip?: React.ReactNode, mode?: PanelMode) => {
		const m = mode ?? inferMode(message)
		return (
			<div className={'jn-blk' + (active ? ' on' : '')} onClick={() => m && onSelect?.(m)}>
				<Head label={label} chip={chip} />
				<div className='jn-blk-b'>{body}</div>
			</div>
		)
	}

	switch (message.type) {
		/* ---------- 用户 ---------- */
		case MessageType.USER_INPUT:
			return (
				<div className='jn-msg me'>
					<div className='jn-who'>我</div>
					<div className='jn-bubble'>{p.content}</div>
				</div>
			)

		/* ---------- 思考 ---------- */
		case MessageType.THINKING:
			return (
				<div className='jn-msg'>
					<div className='jn-who'>Agent · 思考</div>
					<div className='jn-blk' style={{ opacity: 0.85 }}>
						<div className='jn-blk-b' style={{ marginTop: 0, fontStyle: 'italic' }}>{p.content}</div>
					</div>
				</div>
			)

		/* ---------- Plan / Todo / Question（语义化 execute 子类型） ---------- */
		case MessageType.PLAN:
			return (
				<div className='jn-msg'>
					<div className='jn-who'>Agent</div>
					{block('plan', <span>{p.summary || '进入计划模式'}</span>, <span className='jn-chip blue'>PLAN</span>, 'design')}
				</div>
			)

		case MessageType.TODO: {
			const todos: any[] = p.input?.todos || []
			return (
				<div className='jn-msg'>
					<div className='jn-who'>Agent</div>
					{block(
						'todo',
						<ul className='jn-todos'>
							{todos.map((t, i) => (
								<li key={i} className={t.status === 'completed' ? 'done' : t.status === 'in_progress' ? 'doing' : ''}>
									<i>{t.status === 'completed' ? '✓' : ''}</i>
									<span>{t.content}</span>
								</li>
							))}
						</ul>,
						<span className='jn-chip'>{p.summary}</span>
					)}
				</div>
			)
		}

		case MessageType.QUESTION: {
			const opts: any[] = p.input?.options || []
			return (
				<div className='jn-msg'>
					<div className='jn-who'>Agent</div>
					{block(
						'question',
						<>
							<div style={{ marginBottom: 8 }}>{p.input?.question}</div>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
								{opts.map((o, i) => (
									<button key={i} className='jn-btn ghost sm' style={{ justifyContent: 'flex-start' }}>
										{o.label}
									</button>
								))}
							</div>
						</>,
						<span className='jn-chip blue'>待你确认</span>,
						undefined
					)}
				</div>
			)
		}

		/* ---------- 工具调用 / 执行 ---------- */
		case MessageType.TOOL_CALL:
			return (
				<div className='jn-msg'>
					<div className='jn-who'>Agent</div>
					{block(
						'tool call',
						<code className='jn-mono'>
							{p.name} {p.arguments}
						</code>,
						<span className='jn-chip'>工具</span>
					)}
				</div>
			)

		case MessageType.EXECUTE: {
			const ok = p.status === 'completed' && !p.is_error
			return (
				<div className='jn-msg'>
					<div className='jn-who'>Agent</div>
					{block(
						'execute',
						<>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<span className={'jn-chip ' + (ok ? 'ok' : p.status === 'running' ? 'blue' : 'err')}>
									{p.status === 'completed' ? '完成' : p.status === 'running' ? '运行中' : '失败'}
								</span>
								<span className='jn-mono' style={{ fontSize: 12 }}>{p.tool}</span>
								<span style={{ color: 'var(--jn-text-3)' }}>{p.summary}</span>
							</div>
							{p.output && (
								<pre className='jn-mono' style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--jn-text-3)', whiteSpace: 'pre-wrap' }}>
									{String(p.output)}
								</pre>
							)}
						</>,
						<span className='jn-chip'>{p.runner}</span>
					)}
				</div>
			)
		}

		/* ---------- 文本 ---------- */
		case MessageType.TEXT: {
			const parts = String(p.content || '').split('\n\n')
			return (
				<div className='jn-msg'>
					<div className='jn-who'>Agent</div>
					<div className='jn-bubble'>
						{parts.map((t: string, i: number) => (
							<p key={i} style={{ margin: i ? '8px 0 0' : 0 }} dangerouslySetInnerHTML={{ __html: mdBold(t) }} />
						))}
					</div>
				</div>
			)
		}

		case MessageType.ERROR:
			return (
				<div className='jn-msg'>
					<div className='jn-who'>Agent</div>
					<div className='jn-blk' style={{ borderColor: '#5a2b28' }}>
						<Head label='error' chip={<span className='jn-chip err'>失败</span>} />
						<div className='jn-blk-b'>{p.message || p.content}</div>
					</div>
				</div>
			)

		default:
			return (
				<div className='jn-msg'>
					<div className='jn-who'>Agent</div>
					{block(message.type, <code className='jn-mono'>{JSON.stringify(p).slice(0, 160)}</code>)}
				</div>
			)
	}
}

/** 极简 markdown：只处理 **加粗**（原型够用；真实渲染走既有 Text 组件） */
function mdBold(s: string) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
}

export default MessageItem
