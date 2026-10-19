# Fourier Ghost — 用圆画轮廓

一个独立的小程序：从透明 PNG 提取轮廓，做 FFT，保留 **2N+1** 个系数，用它们重画轮廓，并可导出 SVG / PNG 对比 / MP4 动画。

## 依赖

```bash
python3 -m pip install numpy opencv-python pillow matplotlib
# MP4 需要系统里有 ffmpeg
```

## 用法

```bash
python3 fourier.py \
  --image ../../../brand/ghost-mono-sil-85857a.png \
  --n 24 \
  --out out/ghost \
  --svg --png --mp4
```

输出：

- `out/ghost-N24.svg` — 49 个圆重画出的矢量轮廓，眼睛是挖空
- `out/ghost-N24.png` — 左原图 / 右重建
- `out/ghost-N24.mp4` — 1024×1024，8s，30fps，49 个圆

## 参数

| 参数 | 默认 | 说明 |
|---|---|---|
| `--image` | 必填 | 透明 PNG；alpha 当作剪影 |
| `--n` | 24 | 每侧谐波数；总圆数 = 2N+1 |
| `--out` | `out/ghost` | 输出前缀 |
| `--svg` / `--png` / `--mp4` | 关 | 选择输出 |
| `--color` | `#2F3A45` | SVG 填充色；单色可自由改 |
| `--size` | 1024 | 画布尺寸 |

## N 与精度（Ghost，1024px）

| N | 圆数 | IoU | 最大偏差 |
|---:|---:|---:|---:|
| 8 | 17 | 0.9840 | 6.1 px |
| 12 | 25 | 0.9947 | 2.7 px |
| 16 | 33 | 0.9976 | 1.5 px |
| **24** | **49** | **0.9987** | **0.65 px** |
| 48 | 97 | 0.9989 | 0.54 px |

**标准：N=24。** 加载动画可用 8–12；印刷母版可用 48。

## 原理

1. `alpha > 127` → 最大外轮廓 + 眼睛内孔；
2. 按弧长重采样 4096 点；
3. `FFT` 得到复数系数；
4. 只保留 `|k| ≤ N` 的系数；
5. `inverse FFT` 回到 720 点，画回 SVG / 动画；
6. 动效里每个系数是一个圆：半径 = `|c_k|`，下一圆圆心 = 当前圆心 + `c_k e^{2πikt}`。
