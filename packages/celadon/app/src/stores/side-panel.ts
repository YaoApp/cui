import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/* **公共状态**（见 architecture/06-state.md）。

   为什么它是公共的：**侧边是一个应用级挂载点**，谁都可以往里放东西；
   "侧边现在开着哪个对象"因此**说不清归哪个功能** —— 这正是公共的判据。
   （目前唯一的占用者是 world 的实体；等第二个占用者出现，再把它抽象成 `{ kind, id }`。）

   改它的动作留名字（zustand 第三参），出问题能看出是谁改的。 */
type SidePanelState = {
  /** 侧边面板里打开的对象 id；空 = 没开 */
  entityId?: string
  open: (entityId?: string) => void
}

export const useSidePanelStore = create<SidePanelState>()(
  devtools(
    (set) => ({
      entityId: undefined,
      open: (entityId) => set({ entityId }, false, 'side-panel/open'),
    }),
    { name: 'side-panel' },
  ),
)
