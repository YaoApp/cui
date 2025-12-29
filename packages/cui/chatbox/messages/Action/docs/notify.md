# Notify Actions

Show notification messages to the user.

## Action Names

| Action | Description |
|--------|-------------|
| `notify.success` | Show success notification (green) |
| `notify.error` | Show error notification (red) |
| `notify.warning` | Show warning notification (yellow) |
| `notify.info` | Show info notification (blue) |

## Payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | `string` | ✅ | Notification message content |
| `duration` | `number` | - | Auto-close duration in seconds (default: 3, set 0 to keep until closed) |
| `icon` | `string` | - | Custom icon name (overrides default type icon) |
| `closable` | `boolean` | - | Show close button (default: false) |

## Examples

### Success Notification

```typescript
{
  name: 'notify.success',
  payload: {
    message: 'Data saved successfully!'
  }
}
```

### Error Notification

```typescript
{
  name: 'notify.error',
  payload: {
    message: 'Failed to save data. Please try again.'
  }
}
```

### Warning Notification

```typescript
{
  name: 'notify.warning',
  payload: {
    message: 'Your session will expire in 5 minutes.'
  }
}
```

### Info Notification

```typescript
{
  name: 'notify.info',
  payload: {
    message: 'New updates are available.'
  }
}
```

### With Custom Duration

```typescript
// Show for 5 seconds
{
  name: 'notify.success',
  payload: {
    message: 'Operation completed!',
    duration: 5
  }
}

// Show until manually closed (duration: 0)
{
  name: 'notify.error',
  payload: {
    message: 'Critical error occurred!',
    duration: 0,
    closable: true
  }
}
```

### With Custom Icon

```typescript
{
  name: 'notify.info',
  payload: {
    message: 'Syncing data...',
    icon: 'material-sync'
  }
}
```

### Full Example

```typescript
{
  name: 'notify.warning',
  payload: {
    message: 'Your session will expire soon.',
    duration: 10,
    icon: 'material-schedule',
    closable: true
  }
}
```

## Implementation Notes

- Uses Ant Design's `message` component
- Notifications appear at the top center of the screen
- Multiple notifications stack vertically
- Default duration is 3 seconds
- Set `duration: 0` to keep notification until manually closed
- Icon names follow the project's icon naming convention (e.g., `material-xxx`)

## Related Actions

- `service.call` - Often followed by a notification
- `confirm` - For confirmations that require user interaction

