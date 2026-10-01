# 图标与品牌（对应 icons.html）

> 界面图标取自 **lucide**（24 网格 · 描边 2 · ISC 许可）；品牌标识自建。
> 本文件与页面一一对应；**符号与命名以 `icons/manifest.json` 为准**。

## 1. 品牌标识 ≠ 界面图标

品牌标识回答"这是谁"；界面图标回答"这里能做什么"。**两者永不混用**。

| | 品牌标识（Mark / App Icon） | 界面图标（Icon） |
| --- | --- | --- |
| 是什么 | 识别：这是哪个产品 | 语义：这里能做什么 |
| 职责 | **只整体使用**：不描边、不旋转、不换色、不加效果；留白 ≥ 图标高度的 25%；最小 16px（再小用 App Icon） | **只用 currentColor**；描边 2（24 网格）；不自绘、不混用实心与线性 |

**反例（不要这样做）**：不加描边 / 阴影 / 渐变 · 不旋转 / 不镜像 / 不压扁 · 不改品牌色以外的颜色 · 不把标识当界面图标用

## 2. 图标系列（67 个界面图标）

| 规格项 | 值 |
| --- | --- |
| 网格 | **24 × 24**（lucide 规定；描边距边缘 ≥1px） |
| 描边 | **2**（lucide 规定，24 网格）。缩到 14/16px 显示时按比例变细（视觉 ≈1.2–1.3）；某档觉得太细就把该档整体调到 2.25 |
| 端点 / 拐角 | `stroke-linecap: round` · `stroke-linejoin: round`（lucide 规定） |
| 圆角 | ≥8px 的元素 **2px**；<8px 用 **1px**；对角线 90° 用 **≈2.41px**（lucide 规定） |
| 填充 | `fill: none`（仅小圆点等必要实心，且要有理由） |
| 元素间距 | 不同元素之间 **≥2px**（lucide 规定） |
| 颜色 | `stroke: currentColor` —— 一个图标只有一种颜色来源 |
| 尺寸 | 显示档 **14 / 16 / 20 / 24**（默认 16）；图标本体只有 24 网格一套 |

**全量语义名 → lucide 名**（按页面的覆盖度表分组；最后一组是自建品牌符号，不计入 67 个界面图标）

### 主导航（11）

| 语义名 | 来源 |
| --- | --- |
| `i-chat` | `message-circle` |
| `i-inbox` | `inbox` |
| `i-board` | `square-kanban` |
| `i-ws` | `folder-kanban` |
| `i-pc` | `monitor` |
| `i-book` | `book` |
| `i-nav-settings` | `settings` |
| `i-nav-help` | `circle-question-mark` |
| `i-nav-user` | `user` |
| `i-nav-team` | `users` |
| `i-nav-logout` | `log-out` |

### 操作（27）

| 语义名 | 来源 |
| --- | --- |
| `i-search` | `search` |
| `i-plus` | `plus` |
| `i-plus-square` | `square-plus` |
| `i-left` | `chevron-left` |
| `i-right` | `chevron-right` |
| `i-collapse` | `panel-left-close` |
| `i-dots` | `ellipsis` |
| `i-split` | `columns-2` |
| `i-send` | `send` |
| `i-stop` | `square` |
| `i-expand` | `panel-left-open` |
| `i-split2` | `columns-3` |
| `i-pause` | `pause` |
| `i-act-edit` | `pencil` |
| `i-act-trash` | `trash` |
| `i-act-copy` | `copy` |
| `i-act-download` | `download` |
| `i-act-upload` | `upload` |
| `i-act-refresh` | `refresh-cw` |
| `i-act-external` | `external-link` |
| `i-act-filter` | `funnel` |
| `i-act-sort` | `arrow-up-down` |
| `i-act-close` | `x` |
| `i-act-undo` | `undo-2` |
| `i-act-redo` | `redo-2` |
| `i-act-play` | `play` |
| `i-act-attach` | `paperclip` |

### 文件类型（10）

| 语义名 | 来源 |
| --- | --- |
| `i-file` | `file` |
| `i-folder` | `folder` |
| `i-file-pdf` | `file-text` |
| `i-file-image` | `file-image` |
| `i-file-sheet` | `table` |
| `i-file-code` | `code` |
| `i-file-archive` | `archive` |
| `i-file-media` | `music` |
| `i-file-text` | `file-type` |
| `i-file-terminal` | `terminal` |

### 状态（8）

| 语义名 | 来源 |
| --- | --- |
| `i-check` | `check` |
| `i-clock` | `clock` |
| `i-spark` | `sparkles` |
| `i-state-warning` | `triangle-alert` |
| `i-state-error` | `circle-alert` |
| `i-state-info` | `info` |
| `i-state-loading` | `loader-circle` |
| `i-state-queued` | `list-ordered` |

### 对象 / 领域（11）

| 语义名 | 来源 |
| --- | --- |
| `i-tasks` | `list-checks` |
| `i-obj-key` | `key-round` |
| `i-obj-schedule` | `calendar-clock` |
| `i-obj-integration` | `plug` |
| `i-obj-skill` | `wand-sparkles` |
| `i-obj-model` | `cpu` |
| `i-obj-quota` | `gauge` |
| `i-obj-billing` | `receipt` |
| `i-obj-sandbox` | `box` |
| `i-obj-container` | `container` |
| `i-obj-artifact` | `package` |

### 自建 / 品牌（4）

| 语义名 | 来源 |
| --- | --- |
| `brand-yao-agents` | `own:yao-agents` |
| `brand-yao-agents-mono` | `own:yao-agents-mono` |
| `brand-yao` | `own:yao` |
| `brand-yao-mono` | `own:yao-mono` |

**统计**：界面图标 **67** 个（lucide）· 自建品牌符号 **4** 个（`brand-yao-agents` / `brand-yao-agents-mono` / `brand-yao` / `brand-yao-mono`）· 第三方品牌 **340** 个（`brand-*`，另存独立雪碧图，外部引用；其中 simple-icons 来源 1 个）。

## 3. 尺寸档

显示档 **14 / 16 / 20 / 24**（**默认 16**）；图标本体只有 **24 网格**一套。画廊默认 24，只为看清。
品牌标识默认 **24**（品牌是标识不是界面图标）。

## 4. 用法与自绘规范

默认**从 lucide 取**；只有下面 5 类才自绘，且自绘也必须画在 **24 网格 / 2px** 上 —— 混排才不会脏。

- **先找后用**：需要图标时先去 lucide 找语义最近的一个，找到就用，不要另画。
- **命名照旧**：我们的语义名 `i-<域>-<名>`，与 lucide 名一一对应，记在 `icons/manifest.json`。
- **自绘只限 5 类**：品牌标识 · 彩色文件类型徽章 · lucide 没有的语义 · 状态/过程图形 · 14px 下的简化版。
- **自绘也必须同网格**：24 × 24 画布 · 2px 描边 · 圆头圆角。
- **线宽不单独改**：全库一个来源；要更实就整档调，不要逐个图标改线宽。

### 自绘硬规则（lucide 的 must 级，原样采用）

| 项 | 规则（must） |
| --- | --- |
| 画布 | **24 × 24** 正方形；描边距边缘 **≥1px** |
| 描边 | **2px**，且**沿路径居中**（不是内描边） |
| 端点 / 拐角 | 开放路径**圆头**；所有拐角**圆角** |
| 间距 | 不同元素之间 **≥2px**；内部间隙同样 ≥2px |
| 90° 圆角 | ≥8px 的元素 **2px**；<8px **1px**；对角线直角 **≈2.41px** |
| 视觉重量 | 与 `circle` / `square` 相当；**不对称图标可略偏**，求视觉居中而非数学居中 |

### should 级（跟随 lucide）

- 细节密度与其他图标相当；识别不需要的细节**省略**。
- 曲线平滑、无突变；**优先圆弧与二次贝塞尔**，三次必要才用，且相邻控制点要对齐。
- 坐标尽量落在**像素网格**上（含圆心）；但**视觉质量优先**，必要时可离网格。
- 变体图标保持基础几何、位置、朝向不变。
- 相关图标里相同的构件（修饰、附加件）用**一致**的几何、尺寸、位置。
- 两条 should 冲突时，选**更清晰**且更贴近整套语言的那个。

### 我们的例外（明文声明）

- **显示档 14 / 16 / 20 / 24**：lucide 只针对 24 设计、未覆盖小尺寸显示 —— 我们声明 **16px 档整档描边 2.25**（视觉 ≈1.5），14px 档必要时用简化版，但**仍画在 24 网格 / 2px 上**。
- **命名**用我们的语义名 `i-<域>-<名>`，与 lucide 名在 `icons/manifest.json` 一一对应。
- **自绘范围**只限上面的 5 类；其余一律从 lucide 取。

## 5. 可访问性

- **纯装饰**（旁边有文字）→ `aria-hidden="true"`，不要给可读名字。
- **表意**（图标是唯一含义）→ `role="img"` + `<title>`；或更稳妥：补上视觉隐藏文字。
- **命中区**：图标 16，但按钮命中区 ≥ 24（理想 32）；不要只给图标留 16px 可点。
- **不要只靠图标传达状态**：状态=图标+文字+颜色（色盲下仍可读）。

## 6. 新增一个图标

1. 去 **lucide** 找语义最近的名字（`lucide.dev/icons`）。
2. 加进 `icons/manifest.json`（取自 lucide 的写 lucide 名；自建的放进 `icons/own-sprite.svg`），跑 `build-icons.mjs` 重新内联。
3. 在 **14px** 下确认可辨；不可辨则按 24 网格自绘简化版。
4. 跑检查：`check-i18n` / `check-readme-values`；确认页面无硬编码颜色、无 16 网格残留。

## 7. 品牌来源

- **官方色是全站唯一允许不使用我们 token 的颜色** —— 依商标规范不得改色；深色底请切**单色**变体。
- 商标归各品牌方，**仅用于标识对应模型或服务**。
- 自建 **2** 个（`brand-yao-agents` / `brand-yao`）+ 第三方 **340** 个（`brand-*`，另存独立雪碧图，外部引用）。

