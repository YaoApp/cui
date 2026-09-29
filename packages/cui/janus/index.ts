/**
 * janus（CUI V2 原型）— 导出
 *
 * 页面：`pages/janus/index.tsx` → 路由 `/janus`
 * 详细说明见 ./README.md；接口缺口见 ./GAPS.md
 */
export { default as Workbench } from './Workbench'
export { default as ChatPane } from './ChatPane'
export { default as MessageItem } from './Message'
export { default as SidePanel } from './SidePanel'
export { default as DualFace } from './DualFace'
export { default as Capability } from './Capability'

export { mockApi, task, messages, gates, deploy, apps, capabilities } from './mock'
export type { PanelMode, FaceKind, JTask, JApp, JCapability, JGate, JDeploy } from './mock'
