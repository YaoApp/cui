# 数据格式（对应 data-format.html）

> 页面上所有值都由浏览器**实时调用 `Intl.*`** 计算，不是写死的字符串 —— 所以它同时是
> [`plan/19-data-format.md`](../plan/19-data-format.md) §3.4 样例表的**校验**。
> **固定样例**保证可复现：时间戳 `2026-09-30T08:12:34Z` · 数值 `1234.56` / `12345` / `1280` / `-100` · 大小 `900B` / `2.1KB` / `1.8MB` / `2MB` · 词表 `阿 波 蔡 邓 徐 张` · 列表 `甲|乙|丙`。
> 切换语言看同一份数据的变化；**某个 `Intl` 能力缺失时只让那一节显示原因，不把整页留白**。

## 日期与时间

同一时刻按语言渲染；相对时间用固定样例间隔。

| 项 | 规则 / API |
| --- | --- |
| 长日期 | `{ dateStyle: "long" }` |
| 短日期 | `{ dateStyle: "short" }` |
| 日期 + 时间 | `{ dateStyle: "medium", timeStyle: "short" }` |
| 仅时间（强制 24h） | `{ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }` |
| 星期 | `{ weekday: "long" }` |

## 相对时间阶梯

`Intl.RelativeTimeFormat({ numeric: "auto" })` —— 阈值见 `19` §3.1。

| 项 | 规则 / API |
| --- | --- |
| < 1 分钟 | 显示「刚刚」—— **不显示"20 秒钟前"** |
| 几十分钟 | `-N minute` |
| 几小时 | `-N hour` |
| 几天 | `-N day` |
| > 7 天 | 改用 `DateTimeFormat({ month: "short", day: "numeric" })` |
| > 1 年 | `{ year, month: "short", day: "numeric" }` |

## 时区

Intl.DateTimeFormat({ timeZone }) —— 同一时间戳在四个时区下的显示；落库格式带偏移与 IANA 括注（`19` §2）。

| 项 | 规则 / API |
| --- | --- |
| 四个时区 | `UTC` · `Asia/Shanghai` · `America/New_York` · `Europe/Berlin` |
| 偏移 | `timeZoneName: "longOffset"` 取 `formatToParts` |
| 落库格式 | 带偏移与 IANA 括注（`19` §2），例：`2026-09-30T16:12:34+08:00[Asia/Shanghai]` |

## 数字 · 单位 · 货币

Intl.NumberFormat / ListFormat —— 千分位 · 大数缩写 · 文件大小（1024 进制 / 1 位小数）· 金额（保留币种小数位）· 列表与范围。**技术标识强制拉丁数字与 LTR**。

| 项 | 规则 / API |
| --- | --- |
| 千分位与小数 | `{ minimumFractionDigits: 2 }` |
| 大数缩写 | `{ notation: "compact", maximumFractionDigits: 1 }` |
| 文件大小 | **1024 进制**，KMGT 递进，**1 位小数**（整数不带 `.0`）；`< 1024` 显 `N B` |
| 金额 | `{ style: "currency", currency }`；默认 `symbol`，可选 `narrowSymbol`；**保留币种小数位**（JPY 0 位） |
| 负数金额 | `.format(-100)` |
| 列表 | `Intl.ListFormat({ style: "long", type: "conjunction" })` |
| 范围 | **en dash** `1–3`（不是 hyphen） |
| 时长（进度） | `1:23` 恒拉丁 |
| 时长（陈述） | `2 小时 5 分` |
| 技术标识 | **强制拉丁数字与 LTR**：`1.8 MB · v2.0.0 · :8080` |

## 排序（按语言）

同一组词按语言排序；标识符与路径**不本地化**，按码位（`19` §3.6）。

| 项 | 规则 / API |
| --- | --- |
| 按语言 | `new Intl.Collator(L).compare` |
| 按码位 | `.sort()`（标识符与路径不本地化，`19` §3.6） |

## 双向文本（RTL）

方向性图标镜像 · bidi 隔离 · 视觉回归 —— 规则见 `19` §4，效果演示见 [css-logical.html](css-logical.html)。

| 项 | 规则 / API |
| --- | --- |
| 要镜像 | i-left · i-right · i-collapse · i-expand · i-act-undo · i-act-redo |
| 不镜像 | i-act-sort（↕）· 播放 ▶ · 时钟 ⏱ · 进度 —— |
| bidi | `dir="auto"`（用户输入 / 文件名）· `dir="ltr"` + `isolate`（代码 / 路径 / 标识符） |

## 四语与主题

- 语言：简 `zh-CN` · 繁 `zh-TW` · 英 `en` · 日 `ja`（切换即重算，不刷新页面）
- 主题：浅 / 暗（同上）
