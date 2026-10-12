# WindowControls

自绘的窗口键：最小化 · 最大化与还原 · 关闭。窗口键归谁由平台决定，组件本身不做判断。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `window-controls.tsx` | 三个键的呈现与动作接线 |
| `window-controls.less` | 尺寸、间距、字形与悬停（关闭键悬停用危险档） |
| `window-controls.test.tsx` | 自绘平台画三个键与三种动作 · 已最大化时中间键改叫还原 · 原生与无窗口平台不画 |
| `index.ts` | 对外出口 |

## 属性

无属性。它读 `useWindowChrome()` 的 `controls` · `maximized` · `minimize` · `toggleMaximize` · `close`。

| 取值 | 行为 |
| --- | --- |
| `controls: 'own'` | 画三个键（Windows：关掉原生边框后由我们自绘） |
| `controls: 'native'` | 不画（macOS 有原生交通灯） |
| `controls: 'none'` | 不画（Web 没有窗口可管） |

## 使用方式

```tsx
import { WindowControls } from '@/components/window-controls'

<header className="auth__top">
  ...
  <WindowControls />
</header>
```

放在标题栏那一行的右端即可；它的 `margin-inline-start: auto` 会把自己推到最右，并在 `data-no-drag` 上标记，顶部拖动带不会接管它上面的按下。

## 尺寸与间距

按参照客户端的实测规格：键的命中区 32 见方、中心间距 34、细线字形 12 见方、关闭键右缘留白 14。最大化与还原用同一档细线画，还原时叠出第二层方框。

## 无障碍

每个键都有 `aria-label`（`shell.window.minimize` · `shell.window.maximize` · `shell.window.restore` · `shell.window.close`），四语齐。图形本身是装饰元素，不参与朗读。

## 验证方式

`pnpm vitest run app/src/components/window-controls/window-controls.test.tsx`；真机验证在 Windows 上做，规格与参照图见内部文档「桌面客户端壳」第二节。

## 已知限制

只在客户端内出现；Web 下渲染为空。最大化状态在窗口尺寸变化时读一次，不做实时推送。
