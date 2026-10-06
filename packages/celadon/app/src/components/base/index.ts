/* 基础件的统一出口：调用方从 `@/components/base` 引入，不逐个深入 `components/base/<名>`。
   这里只做再导出，不带任何逻辑（见 architecture/03-boundaries.md §3）。 */

export { BrandMark } from './brand-mark'
export type { BrandMarkProps, BrandId } from './brand-mark'
export { Button } from './button'
export type { ButtonProps } from './button'
export { Icon } from './icon'
export type { IconProps, IconSize } from './icon'
export { Input } from './input'
export type { InputProps } from './input'
export { Select } from './select'
export type { SelectGroup, SelectOption, SelectProps } from './select'
export { Spinner } from './spinner'
