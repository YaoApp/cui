/* **数据层验证页的私有状态**（`06-state.md` §2.2）：结果区那几行日志。
 *
 * 只服务这一个页面；动作留名字（`06 §2.1`，`devtools` 里能看出是谁改的）。
 * 这里**不缓存服务端返回的值** —— 每次调用的值由各自的 `useRequest` 持有，这里只记"哪一次、结果如何"。
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/** 结果区的一行：标签 · 文案 · 是不是"预期失败"（受保护的两条）。 */
export type DataCheckLine = {
  id: number
  label: string
  text: string
  expected: boolean
}

export type DataCheckState = {
  /** 最近的调用记录，新的在前，最多 20 条 */
  lines: DataCheckLine[]
  /** 下一条记录的编号（单调递增：截断后 id 不重复，列表 key 才稳）*/
  nextId: number
  /** 记一笔调用结果 */
  report: (line: Omit<DataCheckLine, 'id'>) => void
}

export const useDataCheckStore = create<DataCheckState>()(
  devtools((set) => ({
    lines: [],
    nextId: 1,
    report: (line) =>
      set(
        (state) => ({
          lines: [{ id: state.nextId, ...line }, ...state.lines].slice(0, 20),
          nextId: state.nextId + 1,
        }),
        false,
        'data-check/report',
      ),
  })),
)
