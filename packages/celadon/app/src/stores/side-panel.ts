import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Entry } from '@/stores/entry'

type SidePanelState = {
  entry?: Entry
  open: (entry?: Entry) => void
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
