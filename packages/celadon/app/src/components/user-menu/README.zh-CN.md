# components/user-menu

`components/user-menu` 是账户菜单，用在导航列底部；导航列收起时，同一份菜单挂到内容列头的按钮上。
它负责触发按钮、弹层、分段、键盘行为与退出确认。

这一件只负责展示：资料、套餐、用量、链接与动作都由 props 给，组件不调用任何接口。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `user-menu.tsx` | `UserMenu`、`UserMenuProps`、`UserMenuSection`、`UserMenuStatus`、`UserMenuLinks`。 |
| `parts/identity/` | 头像、名字与套餐那一行，点开个人资料。 |
| `parts/usage/` | 用量行与反色升级按钮。 |
| `parts/item/` | 普通行：图标、文案、右侧说明或外链图标。 |
| `parts/separator/` | 段间分隔线。 |
| `locales/` | zh-CN、zh-TW、en-US、ja 四份文案，键前缀 `userMenu.`。 |
| `user-menu.less` | 两种触发按钮、弹层外观、行状态与骨架。 |
| `user-menu.test.tsx` | 单元用例：分段、外链、升级、退出确认与各状态。 |

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `status` | `'loading' \| 'ready' \| 'unavailable' \| 'signedOut'` | 必填 | `signedOut` 只画一个去登录的按钮，不弹菜单。 |
| `name` | `string` | `''` | 显示名。 |
| `plan` | `string` | `''` | 名字下方的套餐。 |
| `avatar` | `string` | 无 | 照片地址。 |
| `teamName` | `string` | 无 | 画团队徽标，并填在团队行右侧。 |
| `usage` | `{ remaining: number \| null; upgradeUrl?: string }` | 无 | 余量用 `Intl.NumberFormat` 加本语言单位。 |
| `shortcut` | `string` | 无 | 设置行右侧的快捷键，如 `⌘,` 或 `Ctrl+,`。 |
| `width` | `number` | `264` | 弹层宽度；装配层按导航列实测宽度减 16 传入。 |
| `variant` | `'footer' \| 'icon'` | `'footer'` | 底部一行带名字，列头只画头像。 |
| `links` | `{ home, help, docs }` | 必填 | 三个外链地址。 |
| `onOpenSettings` | `(section) => void` | 必填 | `profile` · `team` · `usage`。 |
| `onOpenExternal` | `(url) => void` | 必填 | 升级与三个外链。 |
| `onSignOut` | `() => void` | 必填 | 确认之后才调用。 |
| `onSignIn` | `() => void` | 必填 | 未登录时使用。 |

## 行为

- 向上弹出，间距 8；视口低于 560 像素时改为向下。
- `Esc` 关闭并把焦点还给触发按钮；点击外部或选中一项也关闭。
- 菜单项都是 `menuitem`；升级行是加了反色样式的菜单项，不是嵌套按钮。
- 退出登录弹 `AlertDialog`；取消只关闭，不调用 `onSignOut`。
- 超过 `min(480px, 100vh - 96px)` 时弹层内部滚动。

## 无障碍

- 触发按钮是真实按钮，带 `aria-haspopup="menu"` 与 `aria-expanded`（由上游菜单给）。
- 打开时焦点进菜单；方向键移动，`Home` 与 `End` 到首尾，`Tab` 关闭。
- 退出确认框会锁住焦点，关闭后把焦点还给触发按钮。

## 验证方式

单元用例与组件同目录：`user-menu.test.tsx`。完整路径（打开菜单、进设置、关闭）由
`app/src/features/account/tests/user-menu.browser.ts` 覆盖。
