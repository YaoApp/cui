# components/page

`components/page` 是页面公共件：正文容器、一段带标题、一行卡片、一行提示。产品页面与场景页共用它，
页面自己的 `.less` 只留特有的样式。

## 目录内容

| 文件 | 内容 |
| --- | --- |
| `page.tsx` | `Page` · `PageSection` · `PageRow` · `PageCell` 四个组件。 |
| `page.less` | 正文宽度上限、段落间距、卡片与提示的样式。 |
| `page.test.tsx` | 单元用例。 |
| `index.ts` | 对外出口。 |

## 属性

| 组件 | 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `Page` | `children` | `ReactNode` | 无 | 正文内容。外层是 `.page__body`，负责宽度上限与分段间距。 |
| `Page` | `className` | `string` | 无 | 追加到外层。 |
| `PageSection` | `heading` | `ReactNode` | 无 | 段标题；不传就不画标题。 |
| `PageSection` | `label` | `string` | 无 | 无障碍名，用于没有可见标题的段。 |
| `PageSection` | `children` | `ReactNode` | 无 | 段内容。 |
| `PageRow` | `children` | `ReactNode` | 无 | 一行卡片的内容。 |
| `PageRow` | `label` | `string` | 无 | 无障碍名。 |
| `PageCell` | `children` | `ReactNode` | 无 | 行内的一格。 |

## 使用方式

```tsx
<Page>
  <PageSection heading={t('inbox.title')}>
    <p className="inbox__hint">{t('inbox.composer.placeholder')}</p>
  </PageSection>
</Page>
```

## 验证方式

单元用例与组件同目录：`page.test.tsx`。

## 已知限制

- 只提供正文、段、行与格四件；表格、双栏与页头等形态用到处再加。
