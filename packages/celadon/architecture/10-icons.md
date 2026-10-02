# 10 · 图标（工程落点）

- **版本**：v1.17
- **最后修改**：2026-10-02 19:51:21
- **说明**：图标工程落点（规格见 design）

## 规则

- **源是 lucide**（ISC · 24 网格 · 描边 2 · 本包收录 **67 个**）；不自绘，仅 5 类例外（见 `design/icons.md`）。
- **源**：`design/icons/lucide-sprite.svg` · `own-sprite.svg` · `manifest.json`（`{id, cat, src}`）· 品牌雪碧图。
- **应用侧产物**（`scripts/build-icons.mjs` 生成，**不许手改**）：`app/src/platform/icons/sprite.svg`（整块）
  与 `icon-ids.ts`（**id 联合类型** —— 写错图标名由 `tsc` 拦下）。
- **应用侧经平台层**：入口 `mountIconSprite()` 把整块雪碧图挂在 `body` 上一次（`<IconSprite />`）；
  其余地方用**基础件 `Icon`**：`<Icon name="i-<域>-<名>" size={16} />`。
  **不引外部雪碧图**（跨文件 `<use>` 有 Safari 与 CSP 的坑，还多一次请求）。
- 命名 **`i-<域>-<名>`**，与 manifest 一一对应。
- **尺寸档 14 / 16 / 20 / 24**（产品默认 **16**）；小档按比例变细。
- **不引图标库依赖**（不装 `lucide-react`）—— 雪碧图已经装好，`Icon` 只是 `<use>` + 尺寸档 + 可访问性。
- **校验**：`check-generated.mjs` 重新生成并比对应用侧两份产物，**不一致即失败**。

## 用法

1. **入口挂一次** —— `app/src/main.tsx` 调 `mountIconSprite()`（挂在 `<body>`，**不占页面结构**）。
2. **要图标就用基础件** —— `<Icon name="i-act-refresh" size={16} />`；`size` 取 **14 / 16 / 20 / 24**（默认 16）。
   有语义时给 `label`（`role="img"` + 可访问名）；纯装饰不传（自动 `aria-hidden`）。
3. **图标名从 manifest 来** —— 改 `design/icons/manifest.json` → 跑 `node scripts/build-icons.mjs` →
   `icon-ids.ts` 的联合类型随之更新；**写错名字 `tsc` 直接报**。
4. **不要**自己画 `<svg>`、不要装 `lucide-react`、不要在组件里写图标路径。
5. **与文字同行时靠容器的 flex 居中**（`inline-flex` + `align-items:center` + `gap`），
   **不要**在 JSX 里塞空格凑间距。

## 测试覆盖

| 层 | 测什么 |
| --- | --- |
| 单元 | 组件 DOM 契约：`<use>` 指向对的符号 · 尺寸档 · 装饰/语义两种可访问性 |
| 浏览器 | **真实渲染**：与文字居中（中心差 < 0.5px）· `fill: none`（不是实心黑块）· **描边随主题换色** |
| 拟人 | 导航项与按钮上的图标都渲染出来（符号指得到）+ 同一组居中/取色测量 |
- **品牌官方色是全站唯一允许不用 token 的颜色**。
- **库自带的装饰性指示器**（如 Select 的 `▼`，`aria-hidden`）**不强制走应用图标体系**；
  应用自己画的图标才走 `i-<域>-<名>`。
