# Browse Page — Cross-origin Iframe Host

The `browse` page (`pages/browse/$.tsx`) embeds external or cross-origin URLs via an `<iframe>` with a generic `postMessage` communication protocol. It serves as the platform-level bridge between arbitrary iframe content and the CUI application.

## Usage

Open in the sidebar:

```
/dashboard/browse?src=<encoded-url>
```

Example:

```
/dashboard/browse?src=http%3A%2F%2Flocalhost%3A19999%2Fdrag-test.html
```

## Communication Protocol

The iframe communicates with the parent via `window.parent.postMessage(payload, '*')`.

### Supported Message Types

| Type | Purpose | Payload |
|------|---------|---------|
| `action` | Execute a CUI action | `{ type: 'action', message: { name, payload } }` |
| `title` | Update sidebar tab title | `{ type: 'title', message: { title } }` |
| `updateTab` | Update active tab URL/title | `{ type: 'updateTab', message: { url, title } }` |
| `mention:drag-start` | Begin cross-origin drag | `{ type: 'mention:drag-start', data: MentionData, ghost: string, x, y }` |
| `mention:pointer-move` | Update drag position | `{ type: 'mention:pointer-move', x, y }` |
| `mention:drag-end` | End drag (with hit-test) | `{ type: 'mention:drag-end', x, y }` |
| `content:insert` | Insert content into chatbox | `{ type: 'content:insert', data: MentionData \| InsertSegment[] }` |

### MentionData Schema

```typescript
interface MentionData {
  type: 'expert' | 'workspace' | 'file' | 'directory' | 'clip'
  id: string
  label: string
  description?: string
  metadata?: Record<string, string>
}
```

### Drag Protocol Details

The drag protocol uses **Pointer Events** (not native HTML5 DnD) to avoid cross-origin limitations.

**Iframe responsibilities:**
1. Track `pointerdown` → `setPointerCapture` → detect drag threshold (4px)
2. On drag start: send `mention:drag-start` with `data`, `ghost` (HTML string for the drag ghost), and initial `x, y` (iframe-relative `clientX/Y`)
3. On pointer move: send `mention:pointer-move` with `x, y`
4. On pointer up: send `mention:drag-end` with final `x, y`
5. On `lostpointercapture`: clean up local state (parent tracking takes over)

**Parent (browse/$.tsx) responsibilities:**
1. Create ghost element in parent document (from `ghost` HTML string — appearance fully controlled by iframe)
2. Position ghost using `iframeRect + iframe clientX/Y` with `requestAnimationFrame`
3. Listen on `document` for `pointermove`/`pointerup` (dual-track: covers case when pointer leaves iframe and `setPointerCapture` is lost)
4. On pointer release: `elementFromPoint` hit-test → only insert mention if over `[data-mention-drop-zone]`
5. Safety nets: 3s stale timeout, `window blur`, `pointerleave`, `Escape` key → auto-cancel

**Key insight:** `setPointerCapture` may lose capture when the pointer crosses the iframe boundary. The parent's own event listeners seamlessly take over, providing uninterrupted tracking.

### Content Insert Protocol (`content:insert`)

Allows iframe content to programmatically insert text, mentions, or mixed content directly into the chatbox at the cursor position — no drag interaction needed.

**Payload formats:**

```typescript
// Single mention
{ type: 'content:insert', data: { type: 'clip', id: '<uuid>', label: '...' } }

// Mixed content (text + mentions interleaved)
{ type: 'content:insert', data: [
  { text: 'Please modify ' },
  { type: 'clip', id: 'screenshot-001', label: 'Homepage Screenshot' },
  { text: ' to be responsive' }
] }
```

**InsertSegment type:**

```typescript
type InsertSegment =
  | { text: string }     // plain text node
  | MentionData          // mention tag (must have type/id/label)
```

**Behavior:**
- Inserts at the current cursor position in the chatbox editor
- If the editor has no focus, inserts at the end
- If text is selected, replaces the selection
- No ghost element, no drop-zone check — direct insertion
- Validated by `browse/$.tsx` (VALID_MENTION_TYPES whitelist for mention segments)

## Testing

### Test Page

`drag-test.html` is a standalone test page that demonstrates the protocol.

```bash
# Serve on a DIFFERENT port (cross-origin requirement)
cd cui/packages/cui/docs/browse
python3 -m http.server 19999 --bind 0.0.0.0

# Then open in the app:
# /dashboard/browse?src=http://localhost:19999/drag-test.html
```

### What to Verify

1. **Ghost follows cursor** — Press a card, drag across the iframe boundary. Ghost should follow smoothly.
2. **Drop on Chatbox** — Release over the chatbox input area. A mention tag should appear.
3. **Cancel on miss** — Release anywhere outside the chatbox. Nothing should be inserted.
4. **No ghost residue** — Ghost should never remain on screen. Edge cases: drag to window edge, blur window, press Escape.
5. **Ghost appearance** — Ghost style is defined by the test page, not by browse/$.tsx. Modify the `ghostHTML` in the test page to customize.
