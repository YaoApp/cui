/** 界面表面：主区 · 侧边。跨层共享的词汇，住 platform/utils（见 architecture/00-principles.md）。 */
export const SURFACES = ['app', 'side'] as const
export type Surface = (typeof SURFACES)[number]

export const isSurface = (value: unknown): value is Surface =>
  typeof value === 'string' && (SURFACES as readonly string[]).includes(value)
