import sprite from '../../../app/src/platform/icons/sprite.svg?raw'

let mounted = false

/* Mount the product icon sprite once, before React renders any <use href="#i-…" />. */
export function mountIcons(): void {
  if (mounted) return
  document.body.insertAdjacentHTML('beforeend', sprite)
  mounted = true
}
