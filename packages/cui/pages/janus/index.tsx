import React from 'react'

import { Workbench } from '@/janus'

/**
 * /janus —— CUI V2（BUILD 工作台）原型入口
 *
 * 说明见 `packages/cui/janus/README.md`；接口缺口见 `janus/GAPS.md`。
 * 该页面为 **standalone**（在 `layouts/index.tsx` 注册），不带后台包裹层。
 */
const JanusPage: React.FC = () => {
	return <Workbench />
}

export default JanusPage
