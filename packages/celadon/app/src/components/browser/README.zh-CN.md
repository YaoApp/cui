# components/browser

`components/browser` 是应用右侧的标签浏览器，也就是三栏里的第三栏。按 `design/main-shell.md` §五，它按浏览器理解：
顶部标签条（首页固定第一个且不可关，新建吸附在右端），下面是当前页。标签是全局一套，与会话弱关联。
组件不认识业务：标签数据与当前页内容都由装配层给，组件本身不读任何 store。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `browser.tsx` | `Browser` 组件、`BrowserProps`、`BrowserTab`。标签条与操作钮，当前页由 `children` 传入。 |
| `browser.less` | 这一栏的宽度、分界线、标签条与首页样式；宽到容不下时的让位规则也在这一文件里。 |
| `parts/home/` | `Home`：首页内容，打开外部地址的入口与「这一侧打开过的东西」。 |
| `parts/web/` | `Web`：外部地址页的占位与地址行。 |
| `index.ts` | 对外出口，即 `Browser`、`Home`、`Web` 与各自的类型。 |

## 属性

`Browser`：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tabs` | `BrowserTab[]` | 无 | 标签条上的页。每项含 `key` · `label` · `closable`。 |
| `activeKey` | `string` | 无 | 当前页的 `key`。找不到对应标签时按首页处理。 |
| `side` | `'right' \| 'left'` | 无 | 这一栏在哪一侧，写到 `data-side` 上。 |
| `onActivate` | `(key: string) => void` | 无 | 切到某一页。 |
| `onClose` | `(key: string) => void` | 无 | 关掉某一页。首页由 `closable: false` 表示，不画关闭键。 |
| `onNew` | `() => void` | 无 | 新建，落在首页的地址栏。 |
| `onMove` | `() => void` | 无 | 换到另一侧。 |
| `onCollapse` | `() => void` | 无 | 收掉整栏。 |
| `children` | `ReactNode` | 无 | 当前页的内容。 |

`Home`：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `recent` | `HomeRecent[]` | 无 | 这一侧打开过的页。每项含 `key` 与 `label`。 |
| `onOpenAddress` | `(address: string) => void` | 无 | 回车后打开这个地址；空串不会触发。 |

`Web`：

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `address` | `string` | 无 | 外部地址，原样展示。 |

## 使用方式

```tsx
<Browser
  tabs={tabs.map((tab) => ({ key: tabKey(tab), label: nameOf(tab), closable: tab.kind !== 'browser-home' }))}
  activeKey={activeKey}
  side={browserSide}
  onActivate={(key) => activateTab(byKey(key))}
  onClose={(key) => closeTab(byKey(key))}
  onNew={() => activateTab(HOME_TAB)}
  onMove={() => setBrowserSide(browserSide === 'right' ? 'left' : 'right')}
  onCollapse={toggleBrowser}
>
  <Home recent={recent} onOpenAddress={(address) => openTab({ kind: 'browser-web', id: address })} />
</Browser>
```

## 无障碍

- 整栏是 `<aside>` 并带无障碍名；标签条是 `role="tablist"`，每个标签是 `role="tab"`，当前页带 `aria-selected="true"`。
- 关闭、新建、换边、收掉都是图标按钮，一律给 `aria-label`，并有文字提示。
- 地址栏是带可见标签的输入框，回车提交。

## 状态

| 状态 | 表达方式 |
| --- | --- |
| 缺省 | 标签透明底；当前标签底取 `--background-selected`。 |
| 悬停 | 按钮底取 `--background-hover`。 |
| 焦点 | `box-shadow: var(--focus-ring)`。 |
| 空 | 首页在没有任何打开过的页时显示空态文字。 |
| 收掉 | 整栏不渲染，内容区拿到空出来的宽度。 |
| 让位 | 宽到容不下这一栏时整条消失，不是压窄。 |

## 验证方式

- 单元用例与组件同目录：`browser.test.tsx`。
- 浏览器用例：`app/src/features/inbox/tests/layout.browser.ts` 覆盖打开外部地址、关闭标签、首页不可关、收掉让位与换边。

## 已知限制

- 「放大（进独占）」还没有做。
- 首页的「打开过的东西」当前只列这次会话里打开的标签，持久历史随后接。
