# components/page

`components/page` holds the shared page pieces: a body container, a titled section, a row of cards and one
line of guidance. Product pages and scene pages share it, and a page's own `.less` keeps only what is
specific to it.

## Contents

| File | Contents |
| --- | --- |
| `page.tsx` | Four components: `Page`, `PageSection`, `PageRow` and `PageCell`. |
| `page.less` | The body width cap, section spacing, and the styles for rows and guidance. |
| `page.test.tsx` | Unit tests. |
| `index.ts` | The module's public surface. |

## Props

| Component | Prop | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `Page` | `children` | `ReactNode` | none | The body content. The outer element is `.page__body`, which owns the width cap and the spacing between sections. |
| `Page` | `className` | `string` | none | Appended to the outer element. |
| `PageSection` | `heading` | `ReactNode` | none | The section heading; without it no heading is drawn. |
| `PageSection` | `label` | `string` | none | Accessible name, for a section with no visible heading. |
| `PageSection` | `children` | `ReactNode` | none | The section content. |
| `PageRow` | `children` | `ReactNode` | none | The content of one row of cards. |
| `PageRow` | `label` | `string` | none | Accessible name. |
| `PageCell` | `children` | `ReactNode` | none | One cell inside a row. |

## Usage

```tsx
<Page>
  <PageSection heading={t('inbox.title')}>
    <p className="inbox__hint">{t('inbox.composer.placeholder')}</p>
  </PageSection>
</Page>
```

## Verification

Unit tests sit next to the component: `page.test.tsx`.

## Known limits

- Only four pieces: body, section, row and cell. Tables, two-column layouts and page heads are added when a
  screen needs them.
