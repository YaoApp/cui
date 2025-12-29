# CUI Action System

A unified action message system for handling UI operations triggered by AI assistants or backend services.

## Action List

### Navigate

| Action | Description |
|--------|-------------|
| `navigate` | Open a route (supports: page, sidebar panel, new tab, external URL) |
| `navigate.back` | Navigate back in history |

### Modal

| Action | Description |
|--------|-------------|
| `modal.open` | Open content in modal dialog |
| `modal.close` | Close modal |

### App

| Action | Description |
|--------|-------------|
| `app.menu.reload` | Refresh application menu/navigation |

### Table

| Action | Description |
|--------|-------------|
| `table.search` | Trigger table search with query |
| `table.refresh` | Refresh table data |
| `table.save` | Save table row data |
| `table.delete` | Delete table row(s) |

### Form

| Action | Description |
|--------|-------------|
| `form.find` | Load form data by ID |
| `form.submit` | Submit form data |
| `form.reset` | Reset form to initial state |
| `form.setFields` | Set form field values programmatically |
| `form.fullscreen` | Toggle form fullscreen mode |

### MCP (Client-side)

| Action | Description |
|--------|-------------|
| `mcp.tool.call` | Execute MCP tool |
| `mcp.resource.read` | Read MCP resource |
| `mcp.resource.list` | List MCP resources |
| `mcp.prompt.get` | Get MCP prompt |
| `mcp.prompt.list` | List MCP prompts |

### Notification

| Action | Description |
|--------|-------------|
| `notify.success` | Show success notification |
| `notify.error` | Show error notification |
| `notify.warning` | Show warning notification |
| `notify.info` | Show info notification |

### Confirm

| Action | Description |
|--------|-------------|
| `confirm` | Show confirmation dialog before proceeding |

### Event

| Action | Description |
|--------|-------------|
| `event.emit` | Emit custom event for advanced use cases |

---

## Action Details

<!-- Details for each action will be designed one by one below -->

