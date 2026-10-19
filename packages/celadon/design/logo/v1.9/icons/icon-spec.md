# Yao Agents — Icon System v1.9

Master: **1024 × 1024** ｜ Mark: **863 × 995**（ratio **0.867**）｜ 2026-10-19

## 1. 文件

```
icons/
  svg/
    mark-primary.svg          透明 mark，渐变 body
    mark-dark.svg             透明 mark，Cream body
    mark-light.svg            同 mark-primary；用于浅底
    mark-mono.svg             透明，currentColor，眼睛挖空
    mark-mono-85857a.svg      固定 #85857A
    icon-primary.svg          1024 图标：Slate tile + 渐变 ghost（76% H）
    icon-dark.svg             1024 图标：Slate tile + Cream ghost
    icon-light.svg            1024 图标：Cream tile + 渐变 ghost
    icon-mono.svg             1024 图标：Cream tile + currentColor ghost
  png/
    primary/  dark/  light/  mono/
      ghost-<variant>-1024.png
      … 512 / 256 / 128 / 100 / 72 / 64 / 32 / 16
  preview.png
```

## 2. 数值

| 项 | 值 |
|---|---:|
| Master canvas | 1024 × 1024 |
| Mark W × H | 863 × 995 |
| Mark ratio W/H | **0.867** |
| Tile ghost height | 780（76% H） |
| Tile corner radius | 228 |
| Safe area | 192 |
| Eye | 78 × 109 @ 442 × 509 |
| Eye spacing | 147.5 |
| Highlight | r ≈ 16，左上 |

## 3. 颜色

| Variant | Body | Eyes | Highlight |
|---|---|---|---|
| **Primary** | `#36D2C2 → #19F0D9`（45°） | `#14120E` | `#F4F1EA` |
| **Dark** | `#F4F1EA` | `#14120E` | `#F4F1EA` |
| **Light** | `#36D2C2 → #19F0D9`（45°） | `#14120E` | `#F4F1EA` |
| **Mono** | `#85857A` 或 `currentColor` | knockout | 无 |

- Primary / Light 是同一个 mark，只换容器底色；
- Dark 是 Cream body，不是把 Primary 反相；
- Mono 的眼睛是**透明挖空**，不是印白点。

## 4. 尺寸

已导出：**1024 / 512 / 256 / 128 / 100 / 72 / 64 / 32 / 16**。

- 16–32 px：建议 Mono 或 Primary；Light on Cream 对比只有 1.28–1.67:1，只适合大图；
- 64 px 以上：保留眼睛高光；
- 16 px：可去高光，轮廓优先。

## 5. 单色自由填色

`mark-mono.svg` 的 body 是 `currentColor`，眼睛是 mask 挖空：

```html
<img src="mark-mono.svg" style="color:#2F3A45">
```

或直接改文件里的 `currentColor`。`mark-mono-85857a.svg` 是固定值版本。

## 6. 使用

- App icon：用 `icon-*.svg`，导出 1024，再缩到 512/256/128；
- Avatar：用 `mark-*.svg`，圆形裁切保留下摆；
- Loading：`mark-*` + 一条 `#19F0D9` 进度线；
- 印刷：Mono，`#2F3A45` 或 `#85857A`，眼睛挖空。
