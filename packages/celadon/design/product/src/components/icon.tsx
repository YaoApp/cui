import type { IconId } from '../../../../app/src/platform/icons/icon-ids'

export function Icon({ name, size = 20 }: { name: IconId; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#${name}`} />
    </svg>
  )
}
