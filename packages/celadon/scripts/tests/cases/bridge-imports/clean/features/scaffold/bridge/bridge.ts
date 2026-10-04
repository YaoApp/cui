/* 白名单正例：桥检查页**允许**直接引宿主机制（它是唯一点名调命令的页面）。
   样本放在真实路径上，这样白名单分支也被自测覆盖（2026-10-04 复核指出缺这条）。 */
import { bridge } from '@/platform/bridge'

export const platform = () => bridge.system.platform()
