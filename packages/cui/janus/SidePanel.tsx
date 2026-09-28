import React, { useState } from 'react'

import Capability from './Capability'
import DualFace from './DualFace'

import type { JDeploy, JGate, PanelMode } from './mock'

interface IProps {
	mode: PanelMode
	onMode: (m: PanelMode) => void
	gates: JGate[]
	deploy: JDeploy
	onPublish?: () => void
}

/** 右侧栏：**Design / Dev / Deploy 模式切换**；双面与能力管理在 Dev 下展开 */
const SidePanel: React.FC<IProps> = ({ mode, onMode, gates, deploy, onPublish }) => {
	const [face, setFace] = useState<'human' | 'agent'>('human')
	const [published, setPublished] = useState(false)

	const passed = gates.filter((g) => g.status === 'pass').length

	return (
		<div className='jn-card jn-col'>
			<div className='jn-colhead'>
				<div className='jn-tabs'>
					<button className={mode === 'design' ? 'on' : ''} onClick={() => onMode('design')}>
						🎨 Design
					</button>
					<button className={mode === 'dev' ? 'on' : ''} onClick={() => onMode('dev')}>
						⌨️ Dev
					</button>
					<button className={mode === 'deploy' ? 'on' : ''} onClick={() => onMode('deploy')}>
						🚀 Deploy
					</button>
				</div>
				<span className='jn-sp' />
				<span className={'jn-chip ' + (passed === gates.length ? 'ok' : '')}>
					门禁 {passed}/{gates.length}
				</span>
				<button className='jn-btn ghost sm'>预览</button>
				<button
					className='jn-btn sm'
					onClick={() => {
						setPublished(true)
						onPublish?.()
					}}
				>
					{published ? '已发布' : '发布'}
				</button>
			</div>

			<div className='jn-body'>
				{/* ---------------- Design ---------------- */}
				{mode === 'design' && (
					<div className='jn-design'>
						<div className='jn-canvas'>
							<div className='jn-art'>
								<div className='jn-ph blue w30' />
								<div className='jn-ph w90' />
								<div className='jn-ph w70' />
								<div className='jn-ph tall w90' />
								<div className='jn-ph w45' />
							</div>
						</div>
						<div className='jn-aside'>
							<div className='jn-layers'>
								<div className='on'>▸ 首页</div>
								<div>▸ 结果页</div>
								<div>· 顶部导航</div>
								<div>· 卡片 / 运势</div>
								<div>· 分享按钮</div>
							</div>
							<div className='jn-card' style={{ padding: 10 }}>
								<div className='jn-blk-h'>
									<b>契约五 · 设计规范</b>
								</div>
								<div className='jn-blk-b'>
									HIG 式组件子集 + 跨端对应 + 用法规则（**待接入**）
								</div>
							</div>
						</div>
					</div>
				)}

				{/* ---------------- Dev ---------------- */}
				{mode === 'dev' && (
					<>
						<div className='jn-dev'>
							<div className='jn-preview'>
								<div className='bar'>
									<span className='jn-chip blue'>live preview</span>
									<span className='url'>localhost:1420/result</span>
									<span className='jn-chip'>H5</span>
								</div>
								<iframe
									title='preview'
									srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>
										body{margin:0;font-family:-apple-system,'PingFang SC',sans-serif;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;height:100%}
										.c{width:260px;text-align:center}
										.h{width:44px;height:44px;border-radius:12px;background:#3371fc;margin:0 auto 14px}
										h1{font-size:19px;margin:0 0 10px}
										.p{border:1px solid #eee;border-radius:10px;padding:14px;color:#444;font-size:13px;line-height:1.6}
										.b{margin-top:14px;background:#3371fc;color:#fff;border:0;border-radius:8px;padding:10px 0;width:100%;font-size:13px;font-weight:600}
									</style></head><body><div class="c">
										<div class="h"></div><h1>Your Fortune</h1>
										<div class="p">Good things are coming.<br/>Keep going, you're closer than you think.</div>
										<button class="b">Try Again</button>
									</div></body></html>`}
								/>
							</div>

							<div className='jn-code'>
								<div className='bar'>
									<span className='jn-mono' style={{ fontSize: 11, color: 'var(--jn-text-3)' }}>
										src/human/pages/result/index.tsx
									</span>
									<span className='jn-sp' style={{ flex: 1 }} />
									<span className='jn-chip'>diff</span>
								</div>
								<pre>
									<span className='jn-cmt'>{'// 契约二：页面户口 → type: detail'}</span>
									{'\n'}
									<span className='jn-add'>{'+ export default function Result() {'}</span>
									{'\n'}
									<span className='jn-add'>{'+   const { data } = useBackend(ding.hooks.useFortune(date));'}</span>
									{'\n'}
									<span className='jn-del'>{'-   return <LegacyCard />'}</span>
									{'\n'}
									<span className='jn-add'>{'+   return <FortuneView data={data} />'}</span>
									{'\n'}
									<span className='jn-add'>{'+ }'}</span>
								</pre>
							</div>
						</div>

						{/* 双面 + 能力 */}
						<div className='jn-sec'>双面表达（人面 / Agent 面）</div>
						<DualFace face={face} onFace={setFace} />

						<div className='jn-sec'>能力（Skill / MCP）</div>
						<Capability />
					</>
				)}

				{/* ---------------- Deploy ---------------- */}
				{mode === 'deploy' && (
					<div className='jn-deploy'>
						<div className='jn-card' style={{ padding: 13 }}>
							<div className='jn-blk-h' style={{ marginBottom: 6 }}>
								<b>发布</b>
							</div>
							<div className='jn-kv'>
								<span>应用 ID</span>
								<b>{deploy.app_id}</b>
							</div>
							<div className='jn-kv'>
								<span>形态</span>
								<b>{deploy.forms.join(' + ')}</b>
							</div>
							<div className='jn-kv'>
								<span>后端</span>
								<b>{deploy.backend}</b>
							</div>
							<div className='jn-kv'>
								<span>托管</span>
								<b>{deploy.hosting}</b>
							</div>
							<div className='jn-kv'>
								<span>访问</span>
								<b>{deploy.visibility === 'private' ? '私有（可转公开）' : '公开'}</b>
							</div>
							<div className='jn-row' style={{ marginTop: 12 }}>
								<button className='jn-btn' onClick={() => setPublished(true)}>
									一键发布
								</button>
								<button className='jn-btn ghost'>分享链接</button>
							</div>
							{published && (
								<div className='jn-note' style={{ marginTop: 12 }}>
									已发布到 Yao hosting：<code className='jn-mono'>lucky-fortune.apps.yaoagents.com</code>
									<br />
									（原型为 Mock；真实接口见 GAPS.md）
								</div>
							)}
						</div>

						<div className='jn-card' style={{ padding: 13 }}>
							<div className='jn-blk-h' style={{ marginBottom: 6 }}>
								<b>发布步骤</b>
							</div>
							<ul className='jn-steps'>
								{deploy.steps.map((s, i) => (
									<li key={i} className={s.status}>
										{s.label}
									</li>
								))}
							</ul>
							<div className='jn-sec' style={{ marginTop: 14 }}>
								门禁明细
							</div>
							{gates.map((g) => (
								<div className='jn-kv' key={g.key}>
									<span>{g.label}</span>
									<b style={{ color: g.status === 'pass' ? 'var(--jn-ok)' : g.status === 'fail' ? 'var(--jn-err)' : 'var(--jn-text-3)' }}>
										{g.status === 'pass' ? 'pass' : g.status === 'fail' ? `fail${g.detail ? ' · ' + g.detail : ''}` : g.status}
									</b>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default SidePanel
