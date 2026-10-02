import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/** 侧边面板里开着的**条目**。谁想往侧边放东西都按这个形状传 ——
    公共态**不认识任何功能的词汇**（不认识"世界实体"，也不认识"会话"）。 */
export type PanelEntry = {
  /** 哪一类；字符串由放东西的功能定义（`world-entity` · `thread` …）*/
  kind: string
  id: string
}

type SidePanelState = {
  entry?: PanelEntry
  open: (entry?: PanelEntry) => void
}

/* **公共状态**（见 architecture/06-state.md）：侧边是应用级挂载点，谁都可以往里放东西，
   所以"现在开着哪条"说不清归哪个功能。改它的动作留名字，出问题能看出是谁改的。 */
export const useSidePanelStore = create<SidePanelState>()(
  devtools(
    (set) => ({
      entry: undefined,
      open: (entry) => set({ entry }, false, 'side-panel/open'),
    }),
    { name: 'side-panel' },
  ),
)
