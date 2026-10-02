import sprite from './sprite.svg?raw'

/* **图标底座**（方案 A：整块内联）—— 在应用里渲染**一次**，其余地方用 `<use href="#i-…">`。
   为什么不用外部雪碧图：跨文件 `<use>` 有 Safari 与 CSP 的坑，还多一次请求。
   内容来自设计目录的源（`design/icons/`），本文件旁边的 `sprite.svg` 是**产物**，别手改。 */
export function IconSprite() {
  return <div hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: sprite }} />
}
