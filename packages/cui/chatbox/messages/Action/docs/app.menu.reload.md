# App Menu Reload Action

Refresh the application menu/navigation.

## Action Name

`app.menu.reload`

## Payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| - | - | - | No payload required |

## Description

This action triggers a reload of the application menu data from the backend. It's useful when:

- Menu items have been dynamically added or removed
- User permissions have changed
- Menu visibility needs to be updated based on application state

## Examples

### Basic Usage

```typescript
{
  name: 'app.menu.reload'
}
```

### Use Case: After Permission Change

When user roles or permissions are updated, reload the menu to reflect the new access rights:

```typescript
// After updating user permissions via service call
{
  name: 'app.menu.reload'
}
```

### Use Case: After Creating New Module

When a new module is created that should appear in the menu:

```typescript
// After creating a new module
{
  name: 'app.menu.reload'
}
```

## Implementation Notes

- Triggers `app/getUserMenu` event internally
- Menu data is fetched from backend API
- UI updates automatically after menu data is refreshed
- Does not affect current page or navigation state

## Related Actions

- `navigate` - Navigate to a menu item after reload

