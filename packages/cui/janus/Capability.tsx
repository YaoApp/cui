import React, { useEffect, useState } from 'react'

import { mockApi } from './mock'

import type { JCapability } from './mock'

/**
 * 能力（Skill / MCP）查看与管理 —— 对应"双面"里的能力内核。
 * 数据走 Mock（真实接口待补，见 GAPS.md）。
 */
const Capability: React.FC = () => {
	const [caps, setCaps] = useState<JCapability[]>([])

	useEffect(() => {
		mockApi.listCapabilities().then(setCaps)
	}, [])

	const toggle = async (c: JCapability) => {
		const next = !c.enabled
		setCaps((prev) => prev.map((x) => (x.id === c.id ? { ...x, enabled: next } : x)))
		await mockApi.setCapabilityEnabled(c.id, next)
	}

	return (
		<div className='jn-caps'>
			{caps.map((c) => (
				<div className='jn-cap' key={c.id}>
					<div className='ic'>{c.kind === 'skill' ? '🧩' : '🔌'}</div>
					<div className='tx'>
						<b>
							{c.name} <span className='jn-chip'>{c.kind}</span>{' '}
							{c.faces.map((f) => (
								<span className='jn-chip' key={f} style={{ marginLeft: 4 }}>
									{f === 'human' ? '人面' : 'Agent 面'}
								</span>
							))}
						</b>
						<small>{c.desc}</small>
					</div>
					<button
						className={'jn-sw' + (c.enabled ? ' on' : '')}
						onClick={() => toggle(c)}
						title={c.enabled ? '停用' : '启用'}
					>
						<i />
					</button>
				</div>
			))}
			<div className='jn-note'>
				原型：能力列表与启停为 <b>Mock</b>。真实接口需要"列出 / 启停 / 授权范围"（见 GAPS.md）。
			</div>
		</div>
	)
}

export default Capability
