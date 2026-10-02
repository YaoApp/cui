/* **公共条目** —— 值"指向某个对象"时的统一形状（见 architecture/06-state.md §3.2）。

   一份定义，**所有公共 store 共用**：它不属于任何 store，也不认识任何功能的词汇。
   谁放东西谁定义 `kind` 的值；形状固定为 `{ kind, id }`。 */
export type Entry = {
  /** 哪一类；值由放东西的功能定义 */
  kind: string
  /** 该类里哪个对象 */
  id: string
}
