# `components/base/link`

文字链接：站内与站外共用一个组件。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `link.tsx` | 组件本体：默认落 `<a>`，`external` 补 `target` 与 `rel`，`render` 换元素。 |
| `link.less` | 设计类 `.link` 与三态（静止、悬停、键盘聚焦）。 |
| `link.test.tsx` | 单元用例：锚元素与 `href`、外部地址、`render`、类名合并、点击处理器、无 `href`。 |
| `index.ts` | 目录出口。 |

## 结构与类名

组件没有子部件，渲染出的就是一个锚元素，类名 `.link` 落在它身上；调用方传的 `className` 与它拼接，不覆盖。
`render` 给出的元素会接手这些类名与属性，因此换成应用路由的链接组件时外观与行为一致。

## 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `href` | `string` | 无 | 目标地址。不传时不写 `href` 属性，此时它不是链接语义。 |
| `external` | `boolean` | `false` | 外部地址：写 `target="_blank"` 与 `rel="noopener noreferrer"`。 |
| `render` | `ReactElement \| (props, state) => ReactElement` | 无 | 换渲染元素，契约与上游 `useRender` 一致。 |
| `className` | `string` | 无 | 与 `.link` 拼接。 |
| `children` | `ReactNode` | 无 | 链接文字。 |

其余属性（`title`、`aria-*`、事件处理器等）原样落到渲染出的元素上，合并规则与上游 `mergeProps` 一致：
后面的覆盖前面的，`className` 拼接，事件处理器按序都调用。

## 状态

| 状态 | 表达 |
| --- | --- |
| 静止 | 品牌墨色加下划线。 |
| 悬停 | 补一层品牌软底；颜色与下划线不变。 |
| 键盘聚焦 | `--focus-ring` 焦点环，浏览器默认轮廓移除。 |
| 访问过 | 不做区分。界面里的链接都在卡片内、指向外部文档，区分浏览历史不是这里要表达的信息。 |

## 类与 token

`link.less` 里只有三条规则，取值全部来自 token：`--brand-ink`（暗色下自动切提亮档）、`--brand-soft`、
`--focus-ring`、`--radius-xs`。没有字号与行高：链接跟着所在段落排版走，不另立档位。

## 用法

```tsx
<Link href={config.form?.terms_of_service_link} external>
  {t('auth.terms.service')}
</Link>
```

换成应用路由的链接组件时传 `render`：

```tsx
<Link href="/app/register" render={<RouterLink to="/app/register" />}>
  {t('auth.footnote.link')}
</Link>
```

## 验证方式

单元用例持住锚元素与 `href`、外部地址的 `target` 与 `rel`、`render` 换元素后类名与属性仍在、类名拼接、
点击处理器被调用、以及不传 `href` 时不写该属性。清单页的「链接」组列出静止、悬停、聚焦与外部地址四档。

## 已知限制

上游没有链接组件，因此这件是自建：渲染契约照上游的 `useRender` 与 `mergeProps`，外观只有一处、
没有尺寸档。站外链接没有加「将在新窗口打开」的提示，页面上目前两处站外链接都在协议行里、语境已足够清楚。
