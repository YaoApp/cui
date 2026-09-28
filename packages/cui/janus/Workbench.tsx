import React, { useEffect, useState } from 'react'

import ChatPane from './ChatPane'
import SidePanel from './SidePanel'
import { mockApi } from './mock'
import './janus.less'

import type { JApp, JDeploy, JGate, PanelMode } from './mock'
import type { Message } from '@/openapi'

type View = 'build' | 'apps'

const NAV = [
	{ key: 'chat', label: 'Chat', icon: '💬' },
	{ key: 'kanban', label: 'Kanban', icon: '🗂' },
	{ key: 'inbox', label: 'Inbox', icon: '✉️' },
	{ key: 'build', label: 'BUILD', icon: '⚡' },
	{ key: 'apps', label: 'Apps', icon: '📱' },
	{ key: 'mc', label: 'Mission Control', icon: '🎛' }
]

/**
 * janus（CUI V2）· BUILD 工作台原型
 *
 * 形态：顶栏 +（左 Chat ‖ 右 SidePanel[Design/Dev/Deploy]）；另有 Apps 库视图。
 * 数据：全部 Mock（见 ./mock.ts）；接口缺口见 ./GAPS.md。
 */
const Workbench: React.FC = () => {
	const [view, setView] = useState<View>('build')
	const [mode, setMode] = useState<PanelMode>('dev')

	const [msgs, setMsgs] = useState<Message[]>([])
	const [gates, setGates] = useState<JGate[]>([])
	const [deploy, setDeploy] = useState<JDeploy | null>(null)
	const [taskTitle, setTaskTitle] = useState('')

	useEffect(() => {
		mockApi.getTask().then((t) => setTaskTitle(t.title))
		mockApi.getMessages().then(setMsgs)
		mockApi.getGates().then(setGates)
		mockApi.getDeploy().then(setDeploy)
	}, [])

	const send = (text: string) => {
		setMsgs((prev) => [
			...prev,
			{ type: 'user_input' as any, ui_id: `u${Date.now()}`, props: { content: text, role: 'user' } }
		])
		// 原型：不接真实流；1 秒后回一条 Mock 文本，模拟 Agent 响应
		setTimeout(() => {
			setMsgs((prev) => [
				...prev,
				{
					type: 'text' as any,
					ui_id: `a${Date.now()}`,
					props: { content: '收到。**原型**里这是 Mock 回复；真实接口走 `@/openapi` 的 chat 流（GAPS.md 已列）。' }
				}
			])
		}, 900)
	}

	return (
		<div className='jn-root'>
			{/* -------- top bar -------- */}
			<div className='jn-top'>
				<div className='jn-logo'>
					<i />
					BUILD
				</div>
				<nav className='jn-nav'>
					{NAV.map((n) => (
						<a
							key={n.key}
							className={(view === 'build' && n.key === 'build') || (view === 'apps' && n.key === 'apps') ? 'on' : ''}
							onClick={() => {
								if (n.key === 'apps') setView('apps')
								else if (n.key === 'build') setView('build')
							}}
						>
							<span>{n.icon}</span>
							{n.label}
						</a>
					))}
				</nav>
				<div className='jn-right'>
					<span className='jn-chip'>janus · V2 原型</span>
					<span className='jn-chip warn'>数据 Mock</span>
					<div className='jn-avatar' />
				</div>
			</div>

			{/* -------- BUILD -------- */}
			{view === 'build' && deploy && (
				<div className='jn-main'>
					<ChatPane
						title={`构建「${taskTitle}」`}
						subtitle={<span className='jn-chip blue'>任务 #{128}</span>}
						messages={msgs}
						onSelect={(m) => setMode(m)}
						onSend={send}
					/>
					<SidePanel mode={mode} onMode={setMode} gates={gates} deploy={deploy} />
				</div>
			)}

			{/* -------- Apps -------- */}
			{view === 'apps' && <AppsView onNew={() => setView('build')} />}
		</div>
	)
}

const AppsView: React.FC<{ onNew: () => void }> = ({ onNew }) => {
	const [apps, setApps] = useState<JApp[]>([])
	const [filter, setFilter] = useState<'all' | 'local' | 'cloud' | 'shared'>('all')

	useEffect(() => {
		mockApi.listApps().then(setApps)
	}, [])

	const list = apps.filter((a) => filter === 'all' || a.source === filter)
	const chip = (v: JApp['status']) =>
		v === 'published' ? 'ok' : v === 'ready' ? 'blue' : v === 'draft' ? 'warn' : ''

	return (
		<div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
			<div className='jn-colhead' style={{ border: 0, padding: '0 0 12px' }}>
				<b style={{ fontSize: 20 }}>Apps</b>
				<span className='jn-sp' />
				<button className='jn-btn sm' onClick={onNew}>
					＋ 用 BUILD 新建
				</button>
			</div>

			<div className='jn-row' style={{ marginBottom: 14, flexWrap: 'wrap' }}>
				<div className='jn-inputbox' style={{ flex: '0 0 300px' }}>
					<span style={{ color: 'var(--jn-text-3)' }}>🔍</span>
					<input placeholder='搜索应用…' />
				</div>
				{(
					[
						['all', '全部'],
						['local', '我的（local）'],
						['cloud', '云（cloud）'],
						['shared', '他人分享']
					] as const
				).map(([k, label]) => (
					<button key={k} className={'jn-btn ' + (filter === k ? '' : 'ghost') + ' sm'} onClick={() => setFilter(k)}>
						{label}
					</button>
				))}
			</div>

			<div className='jn-grid'>
				{list.map((a) => (
					<div className='jn-app' key={a.id}>
						<div className='th'>{a.glyph}</div>
						<div className='mt'>
							<b>{a.name}</b>
							<small>
								{a.source === 'local' ? '我构建' : a.source === 'cloud' ? '官方 · 云' : `他人分享 ${a.owner || ''}`} ·{' '}
								{a.updated_at}
							</small>
						</div>
						<div className='ft'>
							<span className={'jn-chip ' + chip(a.status)}>
								{a.status === 'published' ? '已发布' : a.status === 'ready' ? '可直接用' : a.status === 'draft' ? '草稿' : '私有'}
							</span>
							<span className='jn-sp' />
							{a.forms.map((f) => (
								<span className='jn-chip' key={f}>
									{f}
								</span>
							))}
						</div>
					</div>
				))}
			</div>

			<div className='jn-note' style={{ marginTop: 16 }}>
				原型：Apps 列表为 <b>Mock</b>。真实接口需要 local / cloud / 分享 三种来源与"点开即用"（见 GAPS.md）。
			</div>
		</div>
	)
}

export default Workbench
