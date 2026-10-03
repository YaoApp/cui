/** 界面表面：主区与侧边。**只有侧边出现在地址里**（前缀 `side/`），主区就在 base 之下。
 *  跨层共享的词汇，住 platform/utils（见 architecture/00-principles.md）。 */
export const SIDE_PREFIX = 'side'

export const SURFACES = ['main', 'side'] as const
export type Surface = (typeof SURFACES)[number]
