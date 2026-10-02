import sprite from './sprite.svg?raw'

/* 挂一次图标底座（`<use href="#i-…">` 都靠它）。
   **与设计页 `design/icons.html` 完全同样的结构**：雪碧图作为 `<svg width=0 height=0>` 直接插进
   `body`，不包 `<div>`、不设 `hidden`/`display:none` —— 换了任何一层，品牌标识的身体（靠 `url(#渐变)`
   填充）就不画（2026-10-02 实测：包 div、`hidden`、`display:none` 三种写法都会让它掉身体）。 */
export function mountIconSprite(): void {
  document.body.insertAdjacentHTML('beforeend', sprite)
}
