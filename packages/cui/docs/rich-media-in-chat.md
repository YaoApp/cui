# Rich Media in Chat Messages

Reference for AI agents on how to output rich media content in assistant messages. The frontend renders assistant messages as MDX (Markdown + JSX), supporting standard Markdown, a subset of HTML tags, and special protocols.

## Images

**Markdown syntax (preferred):**

```markdown
![alt text](https://example.com/photo.jpg)
![project screenshot](workspace://ws-abc123/screenshots/demo.png)
```

**HTML syntax:**

```html
<img src="https://example.com/photo.jpg" alt="description" />
<img src="workspace://ws-abc123/assets/logo.png" alt="Logo" />
```

Both syntaxes support `workspace://` URLs. The frontend automatically resolves them to the workspace file API. If the image fails to load, a fallback with the alt text and a file link is displayed.

## Video

**HTML syntax (native player):**

```html
<video src="https://example.com/demo.mp4" controls></video>
<video src="workspace://ws-abc123/videos/demo.mp4" controls></video>
```

Always include the `controls` attribute so the user can play/pause/seek.

**With `<source>` children (multiple formats):**

```html
<video controls>
  <source src="workspace://ws-abc123/videos/intro.mp4" type="video/mp4">
</video>
```

**YouTube and Bilibili auto-embed:**

Place a bare URL on its own line (not inside a link, code block, or inline text). The frontend converts it into an embedded player automatically.

```
https://www.youtube.com/watch?v=dQw4w9WgXcQ

https://youtu.be/dQw4w9WgXcQ

https://www.bilibili.com/video/BV1GJ411x7h7
```

Supported YouTube URL formats: `youtube.com/watch?v=`, `youtube.com/shorts/`, `youtu.be/`. Mobile URLs (`m.youtube.com`, `m.bilibili.com`) are also recognized.

URLs inside `[markdown links](...)`, `` `backtick code` ``, or fenced code blocks are **not** auto-embedded.

## Audio

**HTML syntax (native player):**

```html
<audio src="https://example.com/recording.mp3" controls></audio>
<audio src="workspace://ws-abc123/audio/recording.mp3" controls></audio>
```

Always include the `controls` attribute.

**With `<source>` children:**

```html
<audio controls>
  <source src="workspace://ws-abc123/audio/music.ogg" type="audio/ogg">
</audio>
```

## Workspace File Links

Link to a workspace file that opens in a new sidebar tab when clicked:

**Markdown syntax:**

```markdown
[View README](workspace://ws-abc123/docs/readme.md)
```

**Bare URL (auto-linked with file icon):**

```
workspace://ws-abc123/docs/readme.md
```

Backtick-wrapped URLs are also auto-linked:

```markdown
Check the config at `workspace://ws-abc123/config.yaml`
```

## Workspace URL Format

```
workspace://{workspaceId}/{filePath}
```

- `workspaceId`: the workspace identifier (e.g. `ws-6e1497a7-34f`)
- `filePath`: path relative to the workspace root (e.g. `screenshots/demo.png`)

Always use the actual workspace ID, not a placeholder like `default`.

## Allowed HTML Tags

Only the following HTML tags are rendered; all others are escaped:

`a`, `b`, `i`, `u`, `s`, `em`, `strong`, `code`, `pre`, `br`, `hr`, `p`, `div`, `span`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `img`, `h1`-`h6`, `blockquote`, `sup`, `sub`, `del`, `ins`, `mark`, `abbr`, `details`, `summary`, `figure`, `figcaption`, `caption`, `col`, `colgroup`, `video`, `audio`, `source`

## Void Elements

HTML void elements (`img`, `br`, `hr`, `source`, `col`, `track`, `wbr`) do not need to be self-closed in your output. The frontend automatically converts `<source src="..." type="...">` to `<source src="..." type="..." />` for JSX compatibility.

## Things to Avoid

- Do not place video/audio/image URLs inside fenced code blocks if you want them rendered as media.
- Do not use `class`; use `className` (JSX syntax).
- Do not nest `<a>` tags inside other `<a>` tags.
- Do not use `workspace://default/...` as a placeholder; always use the real workspace ID.
- Do not put YouTube/Bilibili URLs inline with other text on the same line; they must be on their own line to trigger auto-embed.
- Do not omit `controls` on `<video>` and `<audio>` tags; without it the player has no UI.
