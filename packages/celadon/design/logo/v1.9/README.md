# Yao Agents — v1.9 deliverables

## 1. Fourier program

`fourier/fourier.py` — 从透明 PNG 提轮廓，FFT，保留 2N+1 个系数，导出 SVG / PNG 对比 / MP4。

- 标准：**N=24（49 个圆）**
- 已生成：`fourier/out/ghost-N24.svg` / `.png` / `.mp4`
- 用法与原理：`fourier/README.md`

## 2. Icon system

`icons/` — Primary / Dark / Light / Mono

- SVG：`icons/svg/mark-*.svg`、`icons/svg/icon-*.svg`
- 透明 PNG：`icons/png/<variant>/ghost-<variant>-{1024,512,256,128,100,72,64,32,16}.png`
- 规格与数值：`icons/icon-spec.md`、`icons/icon-spec.json`
- 预览：`icons/preview.png`

## 3. Spec

`spec/` — 19 页品牌规范（PDF + Markdown + 引用图）

- `spec/Yao-Agents-品牌规范-v1.9.pdf`
- `spec/Yao-Agents-品牌规范-v1.9.md`

## 5. CUI integration

- The product `BrandMark` uses `app/public/brand/yao-agents-ghost.svg` and
  `app/public/brand/yao-agents-ghost-dark.svg`; both are copies of
  `icons/svg/mark-primary.svg` and `icons/svg/mark-dark.svg`.
- The favicon uses `app/public/favicon-ghost.svg`, copied from
  `icons/svg/mark-primary.svg`, so the tab shows the borderless mark. The boot
  screen uses the same mark in its light and dark variants.
- The previous Celadon and robot marks remain in `design/` and the icon sprite.


## 4. Key values

- Mark：863 × 995（ratio 0.867）@ 1024
- Tile ghost：780（76% H），radius 228，safe area 192
- Primary / Light：`#36D2C2 → #19F0D9`
- Dark body：`#F4F1EA`；eyes `#14120E`；highlight `#F4F1EA`
- Mono：`#85857A` 或 `currentColor`，眼睛 knockout
