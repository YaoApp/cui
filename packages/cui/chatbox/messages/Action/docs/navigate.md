# Navigate Action

Open a route in the application sidebar or new window.

## Action Name

`navigate`

## Payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `route` | `string` | ✅ | Target route or URL |
| `title` | `string` | - | Page title (for temporary view mode) |
| `query` | `Record<string, string>` | - | Query parameters |
| `target` | `'_self'` \| `'_blank'` | - | Open target: `_self` (sidebar, default), `_blank` (new window) |

## Route Types

The `route` determines the page type and how it will be loaded:

| Prefix | Type | Loading Method | Description |
|--------|------|----------------|-------------|
| `$dashboard/` | CUI Page | Direct route | CUI Dashboard pages (e.g., `$dashboard/kb` → `/kb`) |
| `/` | SUI Page | iframe (`/web/`) | Yao SUI custom pages (e.g., `/expense/setup`) |
| `http://` or `https://` | External | iframe | External URL |

> **Note**: 
> - `$dashboard/` prefix is removed at runtime (e.g., `$dashboard/kb` → `/kb`)
> - SUI pages are automatically wrapped with `/web/` prefix for iframe loading (e.g., `/expense/setup` → `/web/expense/setup`)

## Display Modes

### 1. Sidebar View (default, `target: '_self'`)

Opens in the right sidebar panel.

#### 1.1 Temporary View (with `title`)

When `title` is provided, the page opens as a temporary view:
- Shows a custom title bar with back button
- No system menu integration
- Suitable for detail pages, traces, previews

```typescript
{
  name: 'navigate',
  payload: {
    route: '/trace/abc123',
    title: 'Trace Details'
  }
}
```

#### 1.2 Menu Navigation (without `title`)

When `title` is not provided, the page opens with system menu:
- Integrates with sidebar menu
- Shows breadcrumb navigation
- Suitable for main business pages

```typescript
{
  name: 'navigate',
  payload: {
    route: '$dashboard/users'
  }
}
```

### 2. New Window (`target: '_blank'`)

Opens in a new browser window/tab.

```typescript
{
  name: 'navigate',
  payload: {
    route: 'https://docs.example.com',
    target: '_blank'
  }
}
```

## Examples

### Open CUI Page

```typescript
// Open user management page (with menu, in sidebar)
{
  name: 'navigate',
  payload: {
    route: '$dashboard/users'
  }
}

// Open user detail page (temporary view, in sidebar)
{
  name: 'navigate',
  payload: {
    route: '$dashboard/users/123',
    title: 'User Details'
  }
}

// Open user page in new window
{
  name: 'navigate',
  payload: {
    route: '$dashboard/users',
    target: '_blank'
  }
}
```

### Open SUI Page

```typescript
// Open custom report page (temporary view, in sidebar)
{
  name: 'navigate',
  payload: {
    route: '/custom/pages/report',
    title: 'Sales Report'
  }
}

// Open custom profile page (with menu, in sidebar)
{
  name: 'navigate',
  payload: {
    route: '/custom/pages/profile'
  }
}
```

### Open External URL

```typescript
// Open external documentation in sidebar (iframe)
{
  name: 'navigate',
  payload: {
    route: 'https://docs.example.com/api',
    title: 'API Documentation'
  }
}

// Open external URL in new window
{
  name: 'navigate',
  payload: {
    route: 'https://docs.example.com/api',
    target: '_blank'
  }
}
```

### With Query Parameters

```typescript
{
  name: 'navigate',
  payload: {
    route: '$dashboard/orders',
    query: {
      status: 'pending',
      page: '1'
    }
  }
}
```

## Implementation Notes

- Default behavior opens in the sidebar panel (right side)
- When `target: '_blank'`, opens in a new browser window/tab
- The sidebar automatically opens if currently hidden (when `target: '_self'`)
- History is managed: first temporary view pushes to history, subsequent ones replace

### Loading Methods

| Type | Method |
|------|--------|
| CUI (`$dashboard/`) | Direct route navigation within the app |
| SUI (`/`) | Loaded via `/web/` iframe wrapper component |
| External (`http(s)://`) | Loaded in iframe |

### Path Resolution

- `$dashboard/kb` → `/kb` (CUI page, direct route)
- `/expense/setup` → `/web/expense/setup` (SUI page, iframe)
- `https://example.com` → `https://example.com` (external, unchanged)

## Related Actions

- `navigate.back` - Navigate back in history

