# 客户端事实（`platform/client/`）· React 里怎么读

- **版本**：v1.0（**已实施** 2026-10-04）
- **最后修改**：2026-10-04 17:59:58
- **状态**：`client` + `loadClient()` **已实施**（2026-10-04，见 git 历史）；本文只写 **React 里怎么读**。
- **规则**：[`15-platform.md`](../architecture/15-platform.md) §5 · 进度：[`02-platform.md`](02-platform.md)

## 1. 结论：不要 `useClient()`

`client.preferences` 是 getter —— **每次读都是当前值**。只要组件会重渲染，读到的就是最新的。所以缺的不是"读的通道"，而是"**谁触发重渲染**"，而那件事只有会变的数据才需要。

| 数据 | 会不会变 | 怎么读 |
| --- | --- | --- |
| `kind` · `os` · `manifest` · `capabilities` · `host` · `id` | **永不变**（装填一次）| 渲染里直接 `client.x` |
| `preferences` · `metadata` | 会变（用户切语言 / 主题）| `useLocalePreference()` / `useThemePreference()` |

所以：**不引入 `useClient()`**；静态事实直接读 `client`；会变的那两个用偏好 hook（订阅在平台层，feature 与 component 不 import 语言 / 主题 store）。

## 2. 新的导出（`platform/client/`）

| 导出 | 签名 | 说明 |
| --- | --- | --- |
| `useLocalePreference` | `() => { locale: string; setLocale: (next: string) => void }` | **新增**：语言的值 + 动作（订阅在平台层）|
| `useThemePreference` | `() => { theme: 'light' \| 'dark'; setTheme: (next: 'light' \| 'dark' \| 'system') => void }` | **新增**：主题的值 + 动作 |
| `client` · `loadClient` · 各类型 | 不变 | 静态事实直接读 `client`；装填仍在入口（`await loadClient()`，预热保留）|

不新增 `useClient()`。**待你定**（§6）：偏好的值要不要也留一个"只读"hook（`usePreferences()`），还是让显示方各自用上面两个（我倾向后者：少一个入口）。

## 3. 调用点逐个改

| 现在 | 改成 |
| --- | --- |
| `features/data-check/data-check.tsx:24,25,70,71`（直接读两个 store，只为显示）| `const { locale } = useLocalePreference()` + `const { theme } = useThemePreference()` |
| `features/hello/hello.tsx:10,39,40`（主题值 + `setTheme`）| `const { theme, setTheme } = useThemePreference()` |
| `components/locale-switch/locale-switch.tsx:3,23,24`（语言值 + `setLocale`）| `const { locale, setLocale } = useLocalePreference()` |

## 4. TODO（审核通过后按顺序做）

- [x] 1. 新增 `platform/client/use-preferences.ts`：`useLocalePreference()` · `useThemePreference()`（值 + 动作，内部订阅两个 store）
- [x] 2. `platform/client/index.ts` 导出这两个
- [x] 3. 三处调用点改走 hook（见 §3 表），feature / component 里不再出现 `useLocaleStore` / `useThemeStore`
- [x] 4. 用例：改 store 后组件重渲染（`act(() => useThemeStore.getState().setTheme('dark'))` → 断言界面文字 / `html` 变化）；hook 返回值与 store 同步
- [x] 5. 回写 `15-platform.md` §5.4：**静态事实直接读 `client`；会变的偏好用偏好 hook**；feature 与 component 不 import 语言 / 主题 store
- [x] 6. `pnpm lint` / `pnpm check` / `pnpm test` 全绿，并在 macOS 真客户端上切一次语言与主题（附截图）

## 5. 验收（每条都能否证）

1. **不再直接读 store**：三处调用点里 `useLocaleStore` / `useThemeStore` 的引用为 0（grep 为证）。
2. **跟着变**：用例里改 store → 断言界面（文字 / 主题属性）随之变化。
3. **静态事实不需要订阅**：只在渲染里读 `client.kind` / `client.host` 的组件不改动、行为不变（回归用例）。
4. **真客户端**：macOS 上切一次语言（zh-CN ↔ en-US）与一次主题（浅 / 深），截图里文案与配色都变。

## 6. 不做与待定

**不做**：

- 不引入 `useClient()`（§1 的理由）。
- 不动 `client` 与 `loadClient()` 的形状。
- 不引入缓存库或状态库。

**待你定**：

1. 显示的组件要不要一个只读入口 `usePreferences()`（值，不带动作）？—— 我倾向不要，显示方用上面两个 hook 里需要的那个。
2. `metadata` 要不要也给 hook（现在没人要活的 `metadata`：`send` 走 getter 足够）？—— 我倾向先不给。
