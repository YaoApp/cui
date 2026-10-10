# components/base

`components/base` 放基础件：原子控件与最底层的行为件。它们只描述外观与行为，不认识业务、不发请求，
行为一律包装上游的无头部件，视觉一律取自 token。业务组件从这里拿件，不自己写控件。

新增一件的门槛（`architecture/03-boundaries.md` §3）：同一个东西在业务里出现到第三个使用者，才上提到这里；
上提时先查上游有没有对应部件，不自己造行为。

## 目录内容

| 组件 | 用途 |
| --- | --- |
| [`alert-dialog/`](alert-dialog/README.zh-CN.md) | 不可误关的确认弹层。 |
| [`brand-mark/`](brand-mark/README.zh-CN.md) | 品牌图形标识，与界面图标分属两套。 |
| [`button/`](button/README.zh-CN.md) | 按钮，八个变体与三个尺寸档。 |
| [`captcha-field/`](captcha-field/README.zh-CN.md) | 图形验证码控件。 |
| [`checkbox/`](checkbox/README.zh-CN.md) | 复选框。 |
| [`dialog/`](dialog/README.zh-CN.md) | 弹层页面，两档宽度。 |
| [`drawer/`](drawer/README.zh-CN.md) | 从窗口一侧滑入的面板。 |
| [`icon/`](icon/README.zh-CN.md) | 界面图标，四档尺寸。 |
| [`input/`](input/README.zh-CN.md) | 输入框。 |
| [`link/`](link/README.zh-CN.md) | 站内与站外共用的文字链接。 |
| [`otp-field/`](otp-field/README.zh-CN.md) | 一次性口令输入。 |
| [`scroll-area/`](scroll-area/README.zh-CN.md) | 滚动容器，溢出时画边缘阴影。 |
| [`segmented-control/`](segmented-control/README.zh-CN.md) | 分段选择器。 |
| [`select/`](select/README.zh-CN.md) | 选择器，按 ARIA combobox 用法使用。 |
| [`spinner/`](spinner/README.zh-CN.md) | 加载指示器。 |
| [`tooltip/`](tooltip/README.zh-CN.md) | 文字提示。 |
| [`turnstile-field/`](turnstile-field/README.zh-CN.md) | 人机验证控件。 |

## 使用方式

业务从统一出口引入，不逐个深入子目录：

```tsx
import { Button, Icon, Tooltip } from '@/components/base'
```

## 约定

- 目录槽位与组件同构：`index.ts` · `<名>.tsx` · `<名>.test.tsx` · `<名>.less` · `parts/` · `hooks/`。
- 每个组件目录都有自己的中文使用说明，文件名是 `README.zh-CN.md`。
- 裸控件禁令：`features/`、`routes/`、`components/`（本目录豁免）里不许裸写 `<button>` 与 `<select>`，由 `pnpm check` 强制。
