/* 无标题栏窗口的窗口动作：桌面由宿主执行，Web 下按钮不出现。
   组件只读这里的能力与 props，不判宿主（`architecture/03-boundaries.md` §2 的平台差异规则）。 */
import { client } from './facts'
import { windowChrome } from '../bridge/window'

export type WindowChrome = {
  /** 要不要画窗口按钮：只有桌面壳有窗口可管 */
  visible: boolean
  /** 顶行的拖动区属性；Web 下为空对象 */
  dragProps: Record<string, string>
  minimize: () => void
  close: () => void
}

export function useWindowChrome(): WindowChrome {
  const visible = client.kind === 'desktop'
  return {
    visible,
    dragProps: visible ? { 'data-tauri-drag-region': 'true' } : {},
    minimize: () => {
      void windowChrome.minimize()
    },
    close: () => {
      void windowChrome.close()
    },
  }
}
