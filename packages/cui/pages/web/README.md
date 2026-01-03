# Web Page Iframe Integration

This page component (`$.tsx`) handles embedding external web pages (including Agent Pages) in CUI via the `/web/*` route.

## Route Pattern

```
/web/<path>
```

The `<path>` is passed directly to the iframe `src`, with URL parameter substitution.

## URL Parameter Substitution

Special parameter values are automatically replaced:

| Value      | Replaced With            |
| ---------- | ------------------------ |
| `__theme`  | Current theme (`light` / `dark`) |
| `__locale` | Current locale (e.g., `en-us`)   |

> **Note**: Authentication uses secure cookies, so `__token` parameter is not needed.

**Example:**

```
/web/my-assistant/result?theme=__theme&locale=__locale
```

Becomes:

```
/my-assistant/result?theme=dark&locale=en-us
```

## Message Protocol

### CUI → Iframe

#### Setup Message

Sent when iframe loads:

```typescript
interface SetupMessage {
  type: "setup";
  message: {
    theme: "light" | "dark";
    locale: string;
  };
}
```

#### Custom Messages

Send via event system:

```typescript
// From anywhere in CUI
window.$app.Event.emit("web/sendMessage", {
  type: "custom",
  message: { data: "value" },
});
```

### Iframe → CUI

#### Action Message

Trigger CUI actions from iframe using the unified Action system:

```typescript
interface ActionMessage {
  type: "action";
  message: {
    name: string;    // Action name (e.g., "navigate", "notify.success")
    payload?: any;   // Action payload
  };
}
```

**Example:**

```javascript
// In iframe - show notification
window.parent.postMessage(
  {
    type: "action",
    message: {
      name: "notify.success",
      payload: { message: "Done!" }
    }
  },
  window.location.origin
);

// Navigate to page
window.parent.postMessage(
  {
    type: "action",
    message: {
      name: "navigate",
      payload: {
        route: "/agents/my-assistant/detail",
        title: "Details",
        query: { id: "123" }
      }
    }
  },
  window.location.origin
);
```

## Supported Actions

### Navigate

| Action          | Description                     | Payload                                      |
| --------------- | ------------------------------- | -------------------------------------------- |
| `navigate`      | Open page in sidebar or new tab | `{ route, title?, icon?, query?, target? }`  |
| `navigate.back` | Navigate back in history        | -                                            |

**Navigate Payload:**

| Field    | Type                     | Required | Description                                          |
| -------- | ------------------------ | -------- | ---------------------------------------------------- |
| `route`  | `string`                 | ✅       | Target route (`$dashboard/xxx`, `/xxx`, or URL)      |
| `title`  | `string`                 | -        | Page title (shows custom title bar with back button) |
| `icon`   | `string`                 | -        | Tab icon (e.g., `material-folder`)                   |
| `query`  | `Record<string, string>` | -        | Query parameters                                     |
| `target` | `'_self'` \| `'_blank'`  | -        | `_self` (sidebar, default) or `_blank` (new window)  |

### Notify

| Action           | Description               | Payload                                        |
| ---------------- | ------------------------- | ---------------------------------------------- |
| `notify.success` | Show success notification | `{ message, duration?, icon?, closable? }`     |
| `notify.error`   | Show error notification   | `{ message, duration?, icon?, closable? }`     |
| `notify.warning` | Show warning notification | `{ message, duration?, icon?, closable? }`     |
| `notify.info`    | Show info notification    | `{ message, duration?, icon?, closable? }`     |

### App

| Action            | Description                    |
| ----------------- | ------------------------------ |
| `app.menu.reload` | Refresh application menu       |

### Modal

| Action        | Description         |
| ------------- | ------------------- |
| `modal.open`  | Open modal dialog   |
| `modal.close` | Close modal         |

### Table

| Action          | Description          |
| --------------- | -------------------- |
| `table.search`  | Trigger table search |
| `table.refresh` | Refresh table data   |
| `table.save`    | Save table row       |
| `table.delete`  | Delete table row(s)  |

### Form

| Action           | Description              |
| ---------------- | ------------------------ |
| `form.find`      | Load form data by ID     |
| `form.submit`    | Submit form              |
| `form.reset`     | Reset form               |
| `form.setFields` | Set form field values    |
| `form.fullscreen`| Toggle fullscreen        |

### MCP (Client-side)

| Action              | Description         |
| ------------------- | ------------------- |
| `mcp.tool.call`     | Execute MCP tool    |
| `mcp.resource.read` | Read MCP resource   |
| `mcp.resource.list` | List MCP resources  |
| `mcp.prompt.get`    | Get MCP prompt      |
| `mcp.prompt.list`   | List MCP prompts    |

### Event

| Action       | Description       |
| ------------ | ----------------- |
| `event.emit` | Emit custom event |

### Confirm

| Action    | Description              |
| --------- | ------------------------ |
| `confirm` | Show confirmation dialog |

## Title Update

For same-origin iframes, the page title is automatically extracted and used to update the sidebar tab title via:

```typescript
window.$app.Event.emit("app/updateSidebarTabTitle", {
  url: pathname + search,
  title: iframeTitle,
});
```

## Security

- Only same-origin iframes can send/receive messages
- Authentication uses secure HTTP-only cookies
- Cross-origin iframes are blocked from message communication

## Usage with Agent Pages

Agent Pages (SUI) are served at `/web/<assistant-id>/<page>`:

```
/web/expense/result        → assistants/expense/pages/result/index.html
/web/my-bot/report/detail  → assistants/my-bot/pages/report/detail.html
```

See [Agent Pages Documentation](../../../../../yao/agent/docs/pages.md) for creating agent pages.
