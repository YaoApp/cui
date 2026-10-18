# features/account

`features/account` 负责账户菜单的业务侧：取资料与用量、合成菜单的 view-model，以及设置外壳与外链地址。
退出登录本身留在装配层，与其他登录接线放在一起。

| 文件 | 内容 |
| --- | --- |
| `hooks/use-account-menu.ts` | 资料与用量两条查询，合成 `status`、名字、套餐、头像、团队与用量。 |
| `settings-shell.tsx` | 设置窗外壳：三个入口分区与占位正文。 |
| `settings-shell.less` | 外壳的两栏布局。 |
| `links.ts` | 首页、帮助、文档三个地址；文档按界面语言分流。 |
| `locales/` | 设置外壳的四语文案。 |

## 数据

`useAccountMenu` 调 `data/user` 的 `accountProfileQuery()` 与 `accountUsageQuery()`。打开
`VITE_ACCOUNT_MOCK=1` 时由数据层的 `data/user/mock.ts` 回答，因此引擎接口就绪之前也能先把菜单做出来。

## 边界

- 菜单组件只负责展示，数据与动作都从这里经 props 传入。
- 打开外部地址统一走 `platform/client` 面的 `openUrl`，本域不认识宿主桥。
- 设置外壳刻意做薄：分区内容由下一层补，本层只证明菜单入口有落点。

## 验证方式

- `hooks/use-account-menu.test.tsx`：状态映射与重试。
- `settings-shell.test.tsx`：分区、切换与关闭。
- `tests/user-menu.browser.ts`：真实浏览器里的完整路径。
