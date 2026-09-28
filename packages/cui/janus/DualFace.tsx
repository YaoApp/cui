import React from 'react'

import type { FaceKind } from './mock'

interface IProps {
	face: FaceKind
	onFace: (f: FaceKind) => void
}

/**
 * 双面表达 —— App = 能力内核（无壳）+ **人面** + **Agent 面**。
 * 原型只为把"双面"讲清楚：同一内核，两张面孔。
 */
const DualFace: React.FC<IProps> = ({ face, onFace }) => {
	return (
		<div className='jn-faces'>
			<div className={'jn-face' + (face === 'human' ? ' on' : '')} onClick={() => onFace('human')}>
				<h5>
					🧑 人面 <span className='jn-chip blue'>Human</span>
				</h5>
				<p>给人打开用：H5 / PWA / 小程序，有自己的风格。</p>
				<ul>
					<li>路由：<code className='jn-mono'>/result</code></li>
					<li>深链：<code className='jn-mono'>lucky://fortune</code>（待定）</li>
					<li>预览：Dev 面板 live preview</li>
				</ul>
			</div>

			<div className={'jn-face' + (face === 'agent' ? ' on' : '')} onClick={() => onFace('agent')}>
				<h5>
					🤖 Agent 面 <span className='jn-chip'>A2UI → MCP</span>
				</h5>
				<p>给 Agent 调用：A2UI 声明式 → Adapter → MCP / 微信 / App Intents。</p>
				<ul>
					<li>动作：<code className='jn-mono'>fortune.get</code></li>
					<li>宿主：MCP（已规划）/ 微信（暂缓）</li>
					<li>适配器：<code className='jn-mono'>adapters/mcp</code></li>
				</ul>
			</div>
		</div>
	)
}

export default DualFace
