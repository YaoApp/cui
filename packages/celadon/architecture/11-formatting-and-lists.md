# 11 · 格式化与长列表

- **版本**：v1.9
- **最后修改**：2026-10-02 13:57:27
- **说明**：日期/数字/时区 · 长列表与表格

## 日期与时间

- **显示**（日期 / 数字 / 货币 / 相对时间）→ **`Intl`**（或 i18next 的 formatter）。
- **运算 / 区间 / 日历网格 / 时区换算** → **`date-fns` + `@date-fns/tz`**（tree-shakable）。
- 存储与传输一律 **UTC**；客户端上送 **`clientTimeZone`**。
- **不许**写无 locale 的 `toLocaleDateString()`。

## 长列表与表格

- **`virtua`** 是唯一虚拟滚动库：长列表用 `VList` / `Virtualizer`，**表格类用 `VGrid`**（二维 · 固定表头/列）。
- **容器 DOM 与行渲染归我们**，库只算位置；索引 ↔ 偏移双向可查；尺寸缓存可存可恢复。
- **`@tanstack/react-virtual` 不采用**。

## 待讨论

- 聊天流（不定高 + 反向滚动）用 `VList` 还是 `Virtualizer` 的手写组合。
- 「表格」的判定线：多少行开始上 `VGrid`。
