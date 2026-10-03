# 09 · 主题

- **版本**：v1.32
- **最后修改**：2026-10-03 09:12:12
- **说明**：设计→代码的转换 · 偏好与解析（三态）· Base UI 基础件 · 页面底色 · 对比度

## 1. 规则

- **单一来源**：颜色只写在 `design/tokens.less`（规范与设计同在这一份）。**产物由脚本生成**，**不许手改**。
- **改颜色的路径固定**：改设计 → 跑转换脚本 → 产物更新 —— **方向不许反**（不许先改产物再补设计）。
- 浅 / 暗两套**来自同一份 token**；**暗色只覆盖 semantic 值**，不另起一套名称。
- 组件**不写颜色字面量**；唯一例外：**系统色**（如 macOS 红绿灯）与**品牌官方色**（见 `10-icons.md`）。
- 暗色下"浅底 + 品牌字/描边"用 `--brand-lift` —— token 层已解决，**组件不判断当前深浅**。
- `data-theme` 挂在 **`<html>`**（选择器对 `.celadon` 自身与任意祖先都生效）。
- **必须在首帧前定主题**：`index.html` 里放一段 **inline 脚本**，读偏好与系统设置，**绘制前**写好 `data-theme`
  （否则会先闪一下浅色）。

## 2. 设计 → 代码

| 项 | 规则 |
| --- | --- |
| 源 | `design/tokens.less` —— **唯一**手写处；规范变更先落这里 |
| 转换 | `node scripts/build-css.mjs` 一次生成两份相同产物：`design/tokens.css` 与 `app/src/platform/theme/tokens.css`（带生成头，**不许手改**）|
| 消费 | 产物落 `app/src/platform/theme/tokens.css`；应用在**入口引一次**，**只经平台层**；**组件与 feature 不引设计文件** |
| 校验 | `check-generated.mjs` 重新生成并与仓库比对**两份产物**（`design/` 与 `app/src/platform/theme/`），**不一致即失败** |

## 3. 偏好与解析

- **偏好必须是三态**：`system` | `light` | `dark`，默认 `system`，持久化。
- **只有解析后的主题**（`light` / `dark`）**才写 `data-theme`**；`system` 按 `prefers-color-scheme` 解析，
  **系统变化时实时跟随**。
- **切换控件保持 light / dark 两态** —— 它切的是**解析后的主题**，等于写下一条显式偏好。
- 状态住 `app/src/platform/theme/theme.store.ts`（zustand + persist）；
  **副作用放在"初始写一次 + 订阅变化"**里（持久化水合 · 测试复位都会同步 DOM），不塞进动作。

## 4. 组件库与基础件

- **行为**用 **`@base-ui/react`**（headless · **无样式**）；**视觉**用 Celadon token。**不引 antd**。
- 基础件（`components/base/`）**必须包装它**，不直接写原生控件（见 `03-boundaries.md` §3）。
- 它是**无样式**的 —— 所以**没有"组件库主题映射"这回事**：
  主题只经 CSS 变量，库不参与配色。
- **裸控件禁令的覆盖范围**：`features/` · `routes/` · `components/`（**`components/base/` 豁免** —— 那里就是包装库、必须落到原生控件）。
- **禁令随基础件扩展**：禁用范围**随对应基础件落地而扩展**。当前覆盖 **`button`** 与 **`select`**；
  **`<input>` 暂不在禁令内** —— `components/base/input` 尚未建立，等它落地再把 `<input>` 加进检查器。
- **选择类基础件的语义是 ARIA combobox / listbox**：触发器 `role="combobox"` · 弹层 `role="listbox"` ·
  选项 `role="option"`，另有一个视觉隐藏的原生 input 只承载序列化值 —— **它不再是原生 `<select>`**。
  受控用法走 `value` + `onValueChange`（对内接 Base UI 的 `onValueChange`）。**不许再当原生下拉用**：
  测试里不用 `.selectOption()` / `toHaveValue()`，按角色与可访问名断言。
- **基础件 Button 默认不提交表单**：默认 `type="button"`；表单提交由表单自身逻辑或调用方显式声明的 `type` 决定。
- **弹层等共用视觉**：设计系统补了对应类之后，基础件**改为复用该类**；在此之前允许基础件按 token 自写
  （如 Select 的 `.select__popup` / `.select__item`），**但不许写颜色字面量**。

## 5. 页面底色归壳

**整页底色与整页高度由 `app/src/platform/shell.less` 负责**（`html` / `body` 铺满 + `--background-app` + 清零外边距）；
feature 与组件只管自己那块，**不需要知道当前深浅**。

> 这两件事是**一对**：只改一处，底部就露出分界。守住它的是拟人测试的可视断言。

## 6. 对比度

- **必须提供 `readableColorOn(fg, bg)`**：按**实际绘制的背景**算对比度，并给出可读替代色。
- 开发期断言 + 关键组件接入。

## 7. 测试

| 层 | 测什么 |
| --- | --- |
| 单元 | 偏好与解析（`system` 按系统解析 · 显式偏好优先）· 持久化 |
| 浏览器 | 切换后 `data-theme` 与观感一致 · 刷新后保持 · **首帧不闪** |
| 拟人 | 页面自身跟随主题 · 内容面铺满视口（**可视断言**）|
